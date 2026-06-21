import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
const failures = [];

for (const removedPath of ['admin.html', 'notifications-ui.js', 'functions']) {
    if (fs.existsSync(path.join(root, removedPath))) fail('paid backend artifact remains: ' + removedPath);
}
function fail(message) { failures.push(message); }

for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicateIds.length) fail(`${file}: duplicate IDs: ${duplicateIds.join(', ')}`);
    if (!/<title>[^<]+<\/title>/i.test(html)) fail(`${file}: missing title`);
    if (!html.includes('G-Y2MZ4NKNHS')) fail(`${file}: missing analytics measurement ID`);
    if (html.includes('G-BKG9ZMV3YX')) fail(`${file}: old analytics ID remains`);
    if (!html.includes('site-core.css') || !html.includes('site-core.js')) fail(`${file}: shared accessibility/consent assets missing`);
    if (/firebase-functions|httpsCallable|getFunctions/.test(html)) fail(file + ': paid Cloud Functions dependency remains');
    if (/notifications-ui\.js|admin\.html/.test(html)) fail(file + ': removed backend interface remains linked');

    const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
        .map((match) => match[1]).filter((script) => script.trim());
    inlineScripts.forEach((script, index) => {
        try { new vm.SourceTextModule(script, { identifier: `${file}#${index}` }); }
        catch (error) { fail(`${file}: script ${index + 1} syntax error: ${error.message}`); }
    });

    for (const match of html.matchAll(/href="([^"#?]+)(?:[?#][^"]*)?"/g)) {
        const target = match[1];
        if (/^(https?:|mailto:|tel:)/.test(target) || target === '/' || target.includes(' + ') || target.includes('${')) continue;
        if (!fs.existsSync(path.join(root, target))) fail(`${file}: missing linked file ${target}`);
    }
}

const register = fs.readFileSync(path.join(root, 'register.html'), 'utf8');
const profile = fs.readFileSync(path.join(root, 'profile.html'), 'utf8');
for (const staleControl of ['name="showProfessional"', 'name="shareName"', 'Show my school', 'Show my cellphone', 'Show my email']) {
    if (register.includes(staleControl)) fail('register.html: stale sharing control remains: ' + staleControl);
}
for (const staleControl of ['id="showProfessional"', 'id="shareName"']) {
    if (profile.includes(staleControl)) fail('profile.html: stale sharing control remains: ' + staleControl);
}
for (const page of [['register.html', register], ['profile.html', profile]]) {
    if (!page[1].includes('N/A (Prefer not to say)')) fail(page[0] + ': private title choice missing');
    if (/value="(?:Mx.|Prof.)"/.test(page[1])) fail(page[0] + ': removed title choice remains');
}
const matches = fs.readFileSync(path.join(root, 'matches.html'), 'utf8');
for (const requiredMatchFeature of [
    'class="current-post-details"',
    '<b>Grades:</b>',
    '<b>Subjects:</b>',
    '<b>Phase:</b>',
    '<b>Post level:</b>',
    'id="currentGrades"',
    'id="currentSubjects"',
    'id="currentPhase"',
    'id="currentPostLevel"',
    'subjectOverlap === 0 ? Math.min(rawTotal, 50)',
    'breakdown.subjects}/40 points',
    'breakdown.location}/40 points'
]) {
    if (!matches.includes(requiredMatchFeature)) fail('matches.html: scoring or red-area feature missing: ' + requiredMatchFeature);
}
if (matches.includes('${tags.map')) fail('matches.html: duplicated professional tag row remains in runtime cards');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const requiredPreviewFeature of [
    'Quick Match Percentage Preview',
    'id="aCurrentDistrict"',
    'id="bCurrentDistrict"',
    'id="aSubjects"',
    'id="bSubjects"',
    'id="aGrades"',
    'id="bGrades"',
    'id="aPhase"',
    'id="bPhase"',
    'id="aPostLevel"',
    'id="bPostLevel"',
    'id="locationScoreText"',
    'id="subjectScoreText"',
    'id="gradeScoreText"',
    'id="phasePostScoreText"',
    'subjectOverlap === 0 ? Math.min(rawTotal, 50)'
]) {
    if (!home.includes(requiredPreviewFeature)) fail('index.html: full percentage preview feature missing: ' + requiredPreviewFeature);
}
if (home.includes('<a href="#matching">Match Logic</a>')) fail('index.html: redundant Match Logic navigation tab remains');
if (!home.includes('>See Match Logic</a>')) fail('index.html: main See Match Logic button is missing');
const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
for (const placeholder of ['Add before launch', 'Appoint and register', 'Add monitored address']) {
    if (privacy.includes(placeholder)) fail(`privacy.html: launch placeholder remains: ${placeholder}`);
}

for (const jsonFile of ['firebase.json', 'firestore.indexes.json', 'site.webmanifest']) {
    try { JSON.parse(fs.readFileSync(path.join(root, jsonFile), 'utf8')); }
    catch (error) { fail(`${jsonFile}: invalid JSON: ${error.message}`); }
}

const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
let braceDepth = 0;
for (const character of rules) {
    if (character === '{') braceDepth += 1;
    if (character === '}') braceDepth -= 1;
    if (braceDepth < 0) fail('firestore.rules: closing brace mismatch');
}
if (braceDepth !== 0) fail(`firestore.rules: brace depth is ${braceDepth}`);

if (failures.length) {
    console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
    process.exitCode = 1;
} else {
    console.log(`PASS: ${htmlFiles.length} HTML pages, internal links, scripts, JSON files, privacy placeholders and rule braces verified.`);
}

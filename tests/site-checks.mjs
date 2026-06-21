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

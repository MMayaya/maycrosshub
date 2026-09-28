const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'text/plain');
    res.end(fs.readFileSync(file));
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true, channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
    try {
        const page = await browser.newPage({ viewport: {width:360, height:800} });
        await page.route('**/*', route => /^(http:\/\/127\.0\.0\.1:|file:)/.test(route.request().url()) ? route.continue() : route.abort());
        await page.goto('http://127.0.0.1:' + server.address().port);
        await page.locator('.mch-share-launch').click();
        assert(await page.locator('dialog').evaluate(el => el.open));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.evaluate(() => {
            window.copied = [];
            Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async text => window.copied.push(text)}});
            Object.defineProperty(navigator, 'share', {configurable:true,value:undefined});
        });
        await page.locator('[data-action="share"]').click();
        assert.equal(await page.locator('dialog [role="status"]').textContent(), 'Link copied!');
        assert.deepEqual(await page.evaluate(() => copied), ['https://maycrosshub.co.za']);
        await page.evaluate(() => Object.defineProperty(navigator, 'share', {configurable:true,value:async data => {window.shared=data;}}));
        await page.locator('[data-action="share"]').click();
        assert.equal((await page.evaluate(() => shared)).title, 'MayCrossHub – Educator Transfer Network');
        await page.evaluate(() => Object.defineProperty(navigator, 'share', {configurable:true,value:async () => {throw new DOMException('cancel', 'AbortError');}}));
        await page.locator('[data-action="share"]').click();
        assert.equal(await page.evaluate(() => copied.length), 1);
        await page.evaluate(() => {
            Object.defineProperty(navigator, 'share', {configurable:true,value:async () => {throw new Error('blocked');}});
            Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async () => {throw new Error('denied');}}});
            document.execCommand = () => false;
        });
        await page.locator('[data-action="share"]').click();
        assert(await page.locator('dialog textarea').isVisible());
        assert.equal(await page.locator('dialog textarea').inputValue(), 'https://maycrosshub.co.za');
        assert.match(await page.locator('dialog [role="status"]').textContent(), /Automatic copying is unavailable/);
        await page.locator('[data-action="qr"]').click();
        assert(await page.locator('[data-qr] img').evaluate(img => img.complete && img.naturalWidth > 250));
        await page.keyboard.press('Escape');
        assert(await page.locator('.mch-share-launch').evaluate(el => el === document.activeElement));
        await page.evaluate(() => mchSharing.setProfile({current:{subjects:[]}}));
        assert(await page.locator('.mch-transfer-launch').isHidden());
        await page.evaluate(() => mchSharing.setProfile({
            title:'Ms.',firstName:'SECRET_NAME',lastName:'SECRET_SURNAME',phone:'SECRET_PHONE',email:'SECRET_EMAIL', uid:'SECRET_UID',
            current:{school:'SECRET_SCHOOL',grades:['10'],province:'KwaZulu-Natal',district:'iLembe',subjects:['Geography','Life Sciences']},
            desired:{province:'KwaZulu-Natal',district:'uMgungundlovu',town:'SECRET_TOWN'}, privacy:{allowRequests:true}
        }));
        await page.locator('.mch-transfer-launch').click();
        const preview = await page.locator('.mch-share-preview').textContent();
        assert(!preview.includes('SECRET'));
        assert(preview.includes('iLembe, KwaZulu-Natal'));
        assert(await page.locator('[data-action="share"]').isDisabled());
        await page.locator('.mch-share-consent input').check();
        await page.evaluate(() => Object.defineProperty(navigator, 'share', {configurable:true,value:async data => {window.shared=data;}}));
        await page.locator('[data-action="share"]').click();
        assert(!(JSON.stringify(await page.evaluate(() => shared))).includes('SECRET'));
        await page.locator('[data-action="qr"]').click();
        await page.screenshot({path:path.join(root,'..','sharing-mobile.png'),fullPage:false});
        await page.setViewportSize({width:1280,height:900});
        await page.screenshot({path:path.join(root,'..','sharing-desktop.png'),fullPage:false});
        assert.equal(await page.locator('[data-browser]').getAttribute('href'), 'https://maycrosshub.co.za/?mch_external=1');
        await page.evaluate(() => mchSharing.setProfile(null));
        assert(await page.locator('.mch-transfer-launch').isHidden());
        assert.equal(await page.locator('#mch-share-title').textContent(), 'Share MayCrossHub');
        await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
        await page.locator('.mch-share-launch').click();
        assert(await page.locator('dialog').evaluate(el => el.open));
        await page.locator('[data-action="qr"]').click();
        assert(await page.locator('[data-qr] img').evaluate(img => img.complete && img.naturalWidth > 250));
        console.log('PASS: direct local index.html preview loads the sharing menu and QR image.');
        console.log('PASS: mobile layout, native share, cancellation, copy and denied-copy fallback, QR asset, focus return, incomplete profile, consent, privacy projection and profile clearing.');
    } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;}).finally(() => server.close());

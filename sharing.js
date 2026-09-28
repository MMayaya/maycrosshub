(function () {
    'use strict';
    const qrAsset = new window.URL('share-qr.png', document.currentScript.src).href;
    const URL = 'https://maycrosshub.co.za';
    const TITLE = 'MayCrossHub – Educator Transfer Network';
    const TEXT = 'Looking for an educator transfer match? Find and connect with educators seeking reciprocal transfers on MayCrossHub.';
    let summary = '';
    let transferMode = false;
    let dialog, transferButton, preview, consent, status, manual, actions;

    // Explicit projection: never spread or serialise a profile into shared content.
    function transferText(profile) {
        const clean = value => typeof value === 'string' ? value.replace(/[\r\n\t]/g, ' ').trim().slice(0, 100) : '';
        const current = profile?.current;
        const desired = profile?.desired;
        const subjects = Array.isArray(current?.subjects) ? current.subjects.map(clean).filter(Boolean).slice(0, 20) : [];
        if (!clean(current?.district) || !clean(current?.province) || !clean(desired?.district) || !clean(desired?.province) || !subjects.length) return '';
        return '🔄 Educator seeking reciprocal transfer\n\nCurrent: ' + clean(current.district) + ', ' + clean(current.province)
            + '\nSeeking: ' + clean(desired.district) + ', ' + clean(desired.province)
            + '\nSubjects: ' + subjects.join(' & ') + '\n\nView or find a match on MayCrossHub:';
    }
    function setProfile(profile) {
        const complete = profile?.title && profile.firstName && profile.lastName && profile.phone
            && profile.current?.school && profile.current?.grades?.length
            && profile.desired?.town && profile.privacy?.allowRequests;
        summary = complete ? transferText(profile) : '';
        if (transferButton) transferButton.hidden = !summary;
        if (dialog?.open && transferMode) open(false);
    }
    window.mchSharing = { setProfile, transferText };
    // Covers profile modules finishing before this optional script loads.
    window.dispatchEvent(new Event('mch-sharing-ready'));

    function notify(message) { status.textContent = message; }
    async function copy(text, message) {
        try {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(text);
            notify(message);
            return;
        } catch (_) { /* Older WebViews may only support selection-based copying. */ }
        manual.hidden = false;
        manual.value = text;
        manual.focus();
        manual.select();
        manual.setSelectionRange(0, text.length);
        try {
            if (document.execCommand('copy')) {
                manual.hidden = true;
                notify(message);
                return;
            }
        } catch (_) { /* Keep the selected text available for manual copying. */ }
        notify('Automatic copying is unavailable. Touch and hold the selected text to copy it.');
    }
    function data() { return { title: TITLE, text: transferMode ? summary : TEXT, url: URL }; }
    function authorised() { return !transferMode || consent.checked; }
    async function share() {
        if (!authorised()) return;
        const payload = data();
        if (typeof navigator.share === 'function') {
            try { await navigator.share(payload); return; }
            catch (error) { if (error.name === 'AbortError') return; }
        }
        await copy(transferMode ? payload.text + '\n' + URL : URL, transferMode ? 'Transfer summary copied!' : 'Link copied!');
    }
    function open(asTransfer) {
        transferMode = asTransfer && !!summary;
        dialog.querySelector('h2').textContent = transferMode ? 'Share My Transfer Request' : 'Share MayCrossHub';
        preview.textContent = (transferMode ? summary : TEXT) + '\n' + URL;
        consent.checked = false;
        consent.parentElement.hidden = !transferMode;
        dialog.querySelector('[data-copy-summary]').hidden = !transferMode;
        dialog.querySelector('[data-qr]').hidden = true;
        manual.hidden = true;
        notify('');
        updateConsent();
        if (!dialog.open) dialog.showModal();
        dialog.querySelector('h2').focus({ preventScroll: true });
        dialog.scrollTop = 0;
    }
    function updateConsent() {
        actions.querySelectorAll('[data-publish]').forEach(button => { button.disabled = !authorised(); });
    }
    function init() {
        const bar = document.createElement('div');
        bar.className = 'mch-share-bar';
        bar.innerHTML = '<button type="button" class="mch-share-launch" aria-label="Share MayCrossHub" title="Share MayCrossHub"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg><span>Share MayCrossHub</span></button><button type="button" class="mch-transfer-launch" hidden>Share My Transfer Request</button>';
        document.body.append(bar);
        transferButton = bar.lastElementChild;
        transferButton.hidden = !summary;
        bar.firstElementChild.addEventListener('click', () => open(false));
        transferButton.addEventListener('click', () => open(true));
        dialog = document.createElement('dialog');
        dialog.className = 'mch-share-dialog';
        dialog.setAttribute('aria-labelledby', 'mch-share-title');
        dialog.innerHTML = '<h2 id="mch-share-title" tabindex="-1">Share MayCrossHub</h2>'
            + '<p>Help another educator find a reciprocal transfer match.</p><pre class="mch-share-preview"></pre>'
            + '<label class="mch-share-consent" hidden><input type="checkbox"> I want to share these district and subject details outside MayCrossHub. Recipients can forward or keep them.</label>'
            + '<p class="mch-share-note">The link opens MayCrossHub. Educators sign in to find matches; it does not open an individual profile.</p>'
            + '<div class="mch-share-actions"><button type="button" data-action="share" data-publish>Share</button><button type="button" data-action="whatsapp" data-publish>WhatsApp</button>'
            + '<button type="button" data-action="copy">Copy Link</button><button type="button" data-action="summary" data-copy-summary data-publish hidden>Copy Transfer Summary</button>'
            + '<button type="button" data-action="qr">Show QR Code</button><a href="https://maycrosshub.co.za/?mch_external=1" data-browser>Open in Browser</a></div>'
            + '<div data-qr tabindex="-1" hidden><img src="/share-qr.png" width="396" height="396" alt="QR code for https://maycrosshub.co.za"><p>Scan to open MayCrossHub<br>maycrosshub.co.za</p></div>'
            + '<p class="mch-share-note">Inside an app? External opening depends on app support. If it stays here, copy the link and paste it into your browser.</p>'
            + '<textarea aria-label="Text to copy manually" readonly hidden></textarea><p role="status" aria-live="polite"></p><button type="button" data-close>Close</button>';
        document.body.append(dialog);
        dialog.querySelector('[data-qr] img').src = qrAsset;
        preview = dialog.querySelector('pre');
        consent = dialog.querySelector('input');
        status = dialog.querySelector('[role="status"]');
        manual = dialog.querySelector('textarea');
        actions = dialog.querySelector('.mch-share-actions');
        consent.addEventListener('change', updateConsent);
        dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
        actions.addEventListener('click', event => {
            const action = event.target.dataset.action;
            if (action === 'share') void share();
            if (action === 'copy') void copy(URL, 'Link copied!');
            if (action === 'summary' && authorised()) void copy(summary + '\n' + URL, 'Transfer summary copied!');
            if (action === 'whatsapp' && authorised()) location.assign('https://wa.me/?text=' + encodeURIComponent(data().text + '\n' + URL));
            if (action === 'qr') {
                const qr = dialog.querySelector('[data-qr]');
                qr.hidden = !qr.hidden;
                if (!qr.hidden) { qr.focus(); qr.scrollIntoView({ block: 'start' }); }
            }
        });
        // Same-window HTTPS navigation works even when WebViews ignore target=_blank.
        // The host app intercepts ONLY this explicit marker, as documented in SHARING.md.
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());

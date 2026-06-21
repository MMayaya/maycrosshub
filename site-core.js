(function () {
    'use strict';

    const CONSENT_KEY = 'mch-analytics-consent';

    function readConsent() {
        try { return localStorage.getItem(CONSENT_KEY); }
        catch (error) { return null; }
    }

    function track(eventName, parameters = {}) {
        if (readConsent() !== 'granted') return;
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, parameters);
        }
    }

    window.mchTrack = track;

    function updateConsent(value) {
        try { localStorage.setItem(CONSENT_KEY, value); }
        catch (error) { return; }
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                analytics_storage: value === 'granted' ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });
        }
    }

    function addSkipLink() {
        const main = document.querySelector('main');
        if (!main) return;
        if (!main.id) main.id = 'main-content';
        const link = document.createElement('a');
        link.className = 'skip-link';
        link.href = `#${main.id}`;
        link.textContent = 'Skip to main content';
        document.body.prepend(link);
    }

    function addLegalLinks() {
        const footer = document.querySelector('footer');
        if (!footer || footer.querySelector('.site-legal-links')) return;
        const links = document.createElement('nav');
        links.className = 'site-legal-links';
        links.setAttribute('aria-label', 'Legal and support links');
        links.innerHTML = [
            '<a href="privacy.html">Privacy</a>',
            '<a href="terms.html">Terms</a>',
            '<a href="guidelines.html">Community Guidelines</a>',
            '<a href="index.html#feedback">Support</a>'
        ].join('');
        footer.append(links);
    }

    function addConsentBanner() {
        const saved = readConsent();
        if (saved === 'granted' || saved === 'denied') {
            updateConsent(saved);
            return;
        }

        const banner = document.createElement('section');
        banner.className = 'consent-banner';
        banner.setAttribute('aria-labelledby', 'consentTitle');
        banner.innerHTML = `
            <h2 id="consentTitle">Analytics choice</h2>
            <p>May Cross Hub uses necessary storage for sign-in and optional Google Analytics to understand how the platform is used. Analytics stays off unless you accept it. Read the <a href="privacy.html#analytics">privacy policy</a>.</p>
            <div class="consent-actions">
                <button class="consent-accept" type="button" data-consent="granted">Accept analytics</button>
                <button type="button" data-consent="denied">Necessary only</button>
            </div>`;
        banner.querySelectorAll('[data-consent]').forEach((button) => {
            button.addEventListener('click', () => {
                updateConsent(button.dataset.consent);
                banner.remove();
            });
        });
        document.body.append(banner);
    }

    function showConnectionStatus() {
        let banner = null;
        function update() {
            if (navigator.onLine) {
                if (banner) banner.remove();
                banner = null;
                return;
            }
            if (banner) return;
            banner = document.createElement('div');
            banner.className = 'connection-banner';
            banner.setAttribute('role', 'status');
            banner.textContent = 'You are offline. Changes and messages cannot be sent until your connection returns.';
            document.body.append(banner);
        }
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        update();
    }

    function addDocumentMetadata() {
        const baseUrl = 'https://maycrosshub.co.za/';
        const page = location.pathname.split('/').pop() || 'index.html';
        if (!document.querySelector('link[rel="canonical"]')) {
            const canonical = document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = baseUrl + page;
            document.head.append(canonical);
        }
        if (!document.querySelector('link[rel="icon"]')) {
            const icon = document.createElement('link');
            icon.rel = 'icon';
            icon.href = 'favicon.svg';
            icon.type = 'image/svg+xml';
            document.head.append(icon);
        }
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement('link');
            manifest.rel = 'manifest';
            manifest.href = 'site.webmanifest';
            document.head.append(manifest);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        addSkipLink();
        addLegalLinks();
        addConsentBanner();
        showConnectionStatus();
        addDocumentMetadata();
        document.querySelectorAll('[data-reset-consent]').forEach((button) => {
            button.addEventListener('click', () => {
                try { localStorage.removeItem(CONSENT_KEY); } catch (error) {}
                location.reload();
            });
        });
        if ('serviceWorker' in navigator && location.protocol === 'https:') {
            navigator.serviceWorker.register('service-worker.js').catch((error) => {
                console.warn('Offline support could not be enabled.', error);
            });
        }
    });
}());

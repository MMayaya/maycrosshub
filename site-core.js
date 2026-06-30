(function () {
    'use strict';

    const legacyRoutes = {
        '/index.html': '/',
        '/dashboard.html': '/dashboard',
        '/matches.html': '/matches',
        '/request.html': '/request',
        '/profile.html': '/profile',
        '/conversation.html': '/conversation',
        '/register.html': '/register',
        '/signin.html': '/signin',
        '/privacy.html': '/privacy',
        '/terms.html': '/terms',
        '/guidelines.html': '/guidelines'
    };
    const cleanRoute = legacyRoutes[window.location.pathname];
    if (cleanRoute && window.location.protocol !== 'file:') {
        window.location.replace(cleanRoute + window.location.search + window.location.hash);
        return;
    }

    function track(eventName, parameters = {}) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, parameters);
        }
    }

    window.mchTrack = track;

    function addSkipLink() {
        const main = document.querySelector('main');
        if (!main) return;
        if (!main.id) main.id = 'main-content';
        const link = document.createElement('a');
        link.className = 'skip-link';
        link.href = '#' + main.id;
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
            '<a href="/privacy">Privacy</a>',
            '<a href="/terms">Terms</a>',
            '<a href="/guidelines">Community Guidelines</a>',
            '<a href="/#feedback">Support</a>'
        ].join('');
        footer.append(links);
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
        const cleanPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '');
        if (!document.querySelector('link[rel="canonical"]')) {
            const canonical = document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = location.origin + cleanPath;
            document.head.append(canonical);
        }
        if (!document.querySelector('link[rel="icon"]')) {
            const icon = document.createElement('link');
            icon.rel = 'icon';
            icon.href = '/favicon.svg';
            icon.type = 'image/svg+xml';
            document.head.append(icon);
        }
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement('link');
            manifest.rel = 'manifest';
            manifest.href = '/site.webmanifest';
            document.head.append(manifest);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        addSkipLink();
        addLegalLinks();
        showConnectionStatus();
        addDocumentMetadata();
        if ('serviceWorker' in navigator && location.protocol === 'https:') {
            navigator.serviceWorker.register('/service-worker.js').catch((error) => {
                console.warn('Offline support could not be enabled.', error);
            });
        }
    });
}());
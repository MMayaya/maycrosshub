# Sharing: website and Android integration

## Implemented website stage

The existing shared site-core.js loads sharing.js on all pages. A small share bar opens a native dialog styled with the existing navy/blue palette. No Firebase rules, auth flows or routing changes are needed. Both root HTML pages and their clean-route directory copies have the profile integration.

- Share uses navigator.share directly from a click. Cancellation does nothing. Unsupported or failed sharing falls back to copying; a failed Clipboard API call tries selection-based copying, then leaves selectable text and honest instructions.
- Copy Link always copies https://maycrosshub.co.za. WhatsApp uses an encoded HTTPS wa.me link in the same window, avoiding target=_blank failures.
- The locally bundled share-qr.png encodes exactly https://maycrosshub.co.za with a four-module quiet zone. No third-party image service sees requests or profile data. QR always opens the homepage, including when shown in transfer mode.
- Dashboard and Profile expose Share My Transfer Request after loading a completed, non-suspended profile. The preview uses saved data; save profile edits first. The explicit projection includes only current district/province, desired district/province and subjects. There is no name, school, town, phone, email, ID, UID, display code or private message. No share payload is stored, logged to analytics or sent to a server by this feature.
- These fields were previously behind authentication. They leave the site only after the educator previews them and checks the external-sharing consent box, then chooses Share, WhatsApp or Copy Transfer Summary. Recipients may retain/forward copies; those copies cannot be revoked. Copy Link and QR share only the public homepage and do not require this consent.
- The service-worker cache version is bumped and includes the sharing assets.

## Android change required for reliable Open in Browser

Website JavaScript cannot force an arbitrary WebView to launch another app. The explicit Open in Browser link navigates in the same frame to:

https://maycrosshub.co.za/?mch_external=1

In a normal browser this opens the homepage normally. In May Learning Hub, merge the following branch into the existing WebViewClient.shouldOverrideUrlLoading, BEFORE the usual in-WebView routing. Keep the existing handling of every other link. Do not replace the entire client. This example targets the modern WebResourceRequest overload (API 24+).

```kotlin
override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
    val uri = request.url
    val source = view.url?.let { Uri.parse(it) }
    val trustedSource = source?.scheme == "https" && source.host == "maycrosshub.co.za"
    val explicitBrowserRequest = request.isForMainFrame && request.hasGesture()
        && trustedSource && uri.scheme == "https" && uri.host == "maycrosshub.co.za"
        && (uri.port == -1 || uri.port == 443) && uri.path == "/"
        && uri.getQueryParameter("mch_external") == "1"
    if (explicitBrowserRequest) {
        try {
            // Fixed destination; never execute a user-provided intent/package or redirect URL.
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://maycrosshub.co.za"))
                .addCategory(Intent.CATEGORY_BROWSABLE)
            view.context.startActivity(intent)
        } catch (error: ActivityNotFoundException) {
            Toast.makeText(view.context, "No browser available. Use Copy Link instead.", Toast.LENGTH_LONG).show()
        }
        return true
    }
    // Continue the app's EXISTING routing policy here.
    return false // Use this only where existing policy keeps the URL in the WebView.
}
```

Imports: android.content.Intent, android.content.ActivityNotFoundException, android.net.Uri, android.webkit.WebView, android.webkit.WebResourceRequest, android.widget.Toast. If May Learning Hub registers Android App Links for this domain, ensure the intent resolves to a browser (resolve an HTTPS browser handler using the app's supported Android-version policy) rather than back to May Learning Hub. Do not hard-code Chrome; test with the user's default browser and browser chooser. No Android source is present here, so this integration has not been applied or device-tested.

Also review the app's existing external-link policy for https://wa.me: permit the user-initiated WhatsApp link to resolve using ACTION_VIEW and catch ActivityNotFoundException, retaining an HTTPS browser fallback. Do not indiscriminately execute intent: or arbitrary custom schemes. The website does not depend on popups or target=_blank. Do not enable unrestricted JavaScript bridges, automatic popup windows or file access for this feature.

Web Share availability varies by WebView; the website's copy/manual fallback works without a native bridge. A native share-sheet bridge could be a later improvement using an origin-restricted AndroidX WebKit message listener and ACTION_SEND; it is not required for this stage. Keep normal MayCrossHub navigation inside the app.

References: [Android WebView navigation](https://developer.android.com/develop/ui/views/layout/webapps/webview), [Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share), [Clipboard restrictions](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API).

## Unique transfer links: next stage, deliberately not public yet

profiles are owner-only; matchProfiles require verified auth; requests are private invitations between two educators, not public transfer advertisements. None is safe to expose anonymously. Existing displayCode values derive from a short UID prefix and are not suitable unique public identifiers. This implementation does not invent a /transfer route or change any collection's visibility.

The safe next stage is a separate, opt-in publicTransferShares collection with a cryptographically random ID and a strict field whitelist. Publish only reviewed district/province/subject values, under explicit consent. Allow public get of an active, unexpired record, disallow public listing, and allow writes only by its verified owner with exact field/type/length validation. Enforce suspension, availability, expiry and revocation at the rules/server layer. Never copy whole profiles into this collection. Owners need publish, refresh and revoke controls, and account deletion must revoke shares. Already-forwarded summaries cannot be recalled.

Add /transfer?share=<random-id> (compatible with the static host) or configured /transfer/<id> routing. Its anonymous landing page should show only this approved snapshot and invite visitors to sign in/register to check reciprocal compatibility. Preserve a validated local return route through email verification, resolve the matching profile only after authentication, and honour blocking/moderation/contact permissions. Public previews need separate privacy-safe social metadata; do not promise rich previews without server/prerender support. Test rules in the Firebase emulator before deployment. This requires a reviewed data-lifecycle design, not a relaxation of existing profile rules.

## Verification / release checklist

Run node --experimental-vm-modules tests/site-checks.mjs and node tests/sharing-checks.cjs. The latter requires Playwright (PLAYWRIGHT_MODULE may point to an installed module). Browser tests mock native share/clipboard APIs and profile input; they do not claim end-to-end Firebase or real Android verification.

Before release, test a verified educator's saved profile, an incomplete/suspended profile, sign-out, profile edits and cancellation on a real account. Device-test Chrome and May Learning Hub for sharing, denying clipboard access, WhatsApp, QR scanning, browser chooser and Back navigation. Deploy the website through its existing hosting workflow; no rules deployment is needed for this stage.

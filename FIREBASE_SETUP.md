# May Cross Hub: Spark setup

This version is designed for the Firebase Spark plan. It does not use Cloud Functions, scheduled jobs, Firebase Extensions or server-generated email notifications.

## 1. Enable email and password authentication

1. Open Firebase Console and select maycrosshub.
2. Open **Authentication > Sign-in method**.
3. Enable **Email/Password**.
4. Under **Authentication > Settings > Authorized domains**, add the live domain and any local domain used for testing.
5. Review the verification-email and password-reset templates under **Authentication > Templates**.

## Custom password reset page

The site includes a themed password reset handler at `https://maycrosshub.co.za/reset-password`.

In Firebase Console, open **Authentication > Templates > Password reset** and set the custom action URL / continue URL for password reset links to:

`https://maycrosshub.co.za/reset-password`

The page reads Firebase's `mode=resetPassword` and `oobCode` query parameters, verifies the reset code, asks users to enter the new password twice, then confirms the reset with Firebase.
## 2. Publish Firestore rules

1. Open **Firestore Database > Rules**.
2. Replace the editor contents with the contents of firestore.rules.
3. Click **Publish**.

These rules allow verified users to manage their own profiles, saved matches and blocks. They also allow deterministic match requests between active profiles and participant-only conversations. The identityProfiles collection exposes only title (when provided), initial and surname to the other participant in an accepted request. School and contact details remain private. New saved matches, requests, messages and reports include readable MCH display codes alongside authoritative UIDs; emails are deliberately kept out of these documents. Publish this exact rules file before testing registration or these newer writes.

The current website does not require a composite Firestore index. firestore.indexes.json is retained as an empty configuration file for future use.

## 3. Publish the website

Push the complete contents of this folder to the GitHub repository used by the May Cross Hub custom domain. The clean URL folders such as matches/index.html, profile/index.html and privacy/index.html must be uploaded together with the root files; GitHub Pages uses them to serve /matches, /profile and /privacy without visible .html extensions.

Firebase Hosting users can deploy the same folder. firebase.json enables cleanUrls and disables trailing slashes. Existing .html addresses are retained only as compatibility entry points and redirect to their clean URL.

Do not upload service-account JSON files, passwords, private keys or Firebase Admin SDK credentials.

## Admin overview page

The site now includes a protected admin page at `/admin` for viewing recent requests and safety reports.

To enable it for your own account:

1. Sign in to May Cross Hub once with your admin email and verify the email.
2. In Firebase Console, open **Authentication > Users** and copy your user UID.
3. Open **Firestore Database > Data**.
4. Create a collection named `admins`.
5. Inside it, create a document whose document ID is your copied UID.
6. Add these fields:

   - `active` = boolean `true`
   - `name` = your name, for example `Mzwamadoda Mayaya`
   - `createdAt` = timestamp/current time, optional

7. Publish the included `firestore.rules` before using `/admin`.

The admin page can read recent requests, read reports, mark reports as reviewing/resolved/dismissed, and suspend a reported profile from match results. It does not expose Firebase Auth passwords and it does not use Cloud Functions.
## 4. Test the complete user journey

1. Register educator A and verify the email.
2. Register educator B with a reciprocal current and desired location and verify the email.
3. Confirm that both accounts can sign in and find each other.
4. Choose a required title and confirm the formal-name sharing acknowledgement.
5. Send, accept, decline, cancel and resend a request.
6. Confirm that accepted requests show only title, initial and surname.
7. Open an accepted request conversation and exchange messages.
8. Save and remove matches.
9. Block an educator and confirm they disappear from matching and conversation access.
10. Submit feedback, then delete a test account and confirm it disappears from Authentication and active profile collections.

## 5. Account deletion

The Profile page now reauthenticates the educator with their current password, removes their saved matches, blocks, private profile, public match profile and accepted-name identity document, and then deletes their Firebase Authentication account.

Shared request history, conversation messages and safety reports are not automatically erased because those records involve another participant or may be needed for security and dispute handling. They no longer link to an active match profile after deletion. Review retained records manually when a lawful deletion request requires it.

Publish the supplied Firestore rules before testing this feature. The rules allow authenticated owners to delete only their own active profile documents.
## 6. Safety reports

Reports continue to be written to the private reports collection and blocks continue to work immediately. Without the paid backend, the operator must review reports directly in Firestore Console. There is no automatic report email or administrator dashboard.

## 7. Analytics and privacy

Google Analytics runs automatically and does not require Cloud Functions. Necessary Firebase Authentication browser storage remains enabled so users can stay signed in. Formspree processes verified-user feedback submissions; account deletion is handled directly by Firebase after password reauthentication.

## Spark limitations

This version does not include:

- Server-side hourly request rate limiting.
- Automatic cleanup of shared request, conversation and safety-report history after account deletion.
- In-app notification generation.
- Request, acceptance or message notification emails.
- Weekly saved-match reminders.
- Scheduled Firestore backups.
- Automatic administrator claims or the moderation dashboard.
- Automatic safety-report emails.

## Local verification

Run this command in the project folder:

    node --experimental-vm-modules tests/site-checks.mjs

A passing result checks HTML scripts, local links, duplicate IDs, analytics IDs, JSON syntax and Firestore rule braces.
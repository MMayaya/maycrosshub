# May Cross Hub: Spark setup

This version is designed for the Firebase Spark plan. It does not use Cloud Functions, scheduled jobs, Firebase Extensions or server-generated email notifications.

## 1. Enable email and password authentication

1. Open Firebase Console and select maycrosshub.
2. Open **Authentication > Sign-in method**.
3. Enable **Email/Password**.
4. Under **Authentication > Settings > Authorized domains**, add the live domain and any local domain used for testing.
5. Review the verification-email and password-reset templates under **Authentication > Templates**.

## 2. Publish Firestore rules

1. Open **Firestore Database > Rules**.
2. Replace the editor contents with the contents of firestore.rules.
3. Click **Publish**.

These rules allow verified users to manage their own profiles, saved matches and blocks. They also allow deterministic match requests between active profiles and participant-only conversations. The sharingProfiles collection exposes only title, initial, surname and user-permitted school or contact details to the other participant in an accepted request.

The current website does not require a composite Firestore index. firestore.indexes.json is retained as an empty configuration file for future use.

## 3. Publish the website

Push the contents of this folder to the GitHub repository used by the May Cross Hub custom domain. GitHub Pages can publish the static HTML, CSS, JavaScript and image files without Firebase CLI access.

Do not upload service-account JSON files, passwords, private keys or Firebase Admin SDK credentials.

## 4. Test the complete user journey

1. Register educator A and verify the email.
2. Register educator B with a reciprocal current and desired location and verify the email.
3. Confirm that both accounts can sign in and find each other.
4. Choose a required title and test both school and contact sharing choices.
5. Send, accept, decline, cancel and resend a request.
6. Confirm that accepted requests show title, initial and surname, plus only the school/contact fields enabled by the educator.
7. Open an accepted request conversation and exchange messages.
8. Save and remove matches.
9. Block an educator and confirm they disappear from matching and conversation access.
10. Submit feedback and an account-deletion request.

## 5. Account-deletion requests

The profile page sends account-deletion requests through the existing Formspree endpoint. The operator must verify the request and remove the data manually.

For the requested Firebase UID:

1. Delete message documents under every affected requests/{requestId}/messages subcollection.
2. Delete request documents where fromUid or toUid matches the UID.
3. Delete documents under profiles/{uid}/savedMatches and profiles/{uid}/blockedUsers.
4. Delete profiles/{uid}, matchProfiles/{uid} and sharingProfiles/{uid}.
5. Review and remove related reports or moderation records where legally appropriate.
6. Open **Authentication > Users** and delete the Authentication account.

Deleting only the Authentication user is not enough. The Firestore profile and match profile must also be deleted or the educator may continue appearing in results.

## 6. Safety reports

Reports continue to be written to the private reports collection and blocks continue to work immediately. Without the paid backend, the operator must review reports directly in Firestore Console. There is no automatic report email or administrator dashboard.

## 7. Analytics and privacy

Google Analytics remains consent-based and does not require Cloud Functions. Necessary Firebase Authentication browser storage remains enabled so users can stay signed in. Formspree continues to process feedback and deletion-request submissions.

## Spark limitations

This version does not include:

- Server-side hourly request rate limiting.
- Automatic account and related-data cleanup.
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
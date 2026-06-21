# May Cross Hub Firebase Setup

The website code is connected to Firebase Authentication and Cloud Firestore. Complete these Firebase Console steps before using it publicly.

## 1. Enable email and password authentication

1. Open the Firebase Console and select the `maycrosshub` project.
2. Open **Authentication** and select **Get started** if prompted.
3. Open **Sign-in method**.
4. Enable **Email/Password**. Email-link sign-in is not required.

## 2. Add authorised domains

In **Authentication > Settings > Authorised domains**, add every domain that will host the site, including the GitHub Pages or Firebase Hosting domain.

Use a local web server for development. ES modules should not be tested by double-clicking the HTML files with a `file://` address.

## 3. Create Cloud Firestore

1. Open **Firestore Database**.
2. Select **Create database**.
3. Choose a permanent database location appropriate for the project.
4. Start with production restrictions, then publish the supplied `firestore.rules` file immediately.

Do not leave Firestore in open test mode.

## 4. Publish the security rules

The rules are in `firestore.rules`.

Console method:

1. Open **Firestore Database > Rules**.
2. Replace the editor contents with `firestore.rules`.
3. Select **Publish**.

CLI method, after installing and signing in to the Firebase CLI:

```text
firebase use maycrosshub
firebase deploy --only firestore:rules
```

The included `firebase.json` points the CLI to the rule and index files.

## 5. Configure email templates

In **Authentication > Templates**, review the sender name, verification email, password-reset email, action URL and support email before launch.

## 6. Test the complete flow

1. Register educator A and verify the email.
2. Register educator B with the opposite current and desired provinces and verify the email.
3. Sign in as educator A and confirm educator B appears under My Matches.
4. Send a match request.
5. Sign in as educator B and accept the request.
6. Open the conversation from both accounts and exchange a test message.
7. Confirm neither educator can open a conversation for a pending or unrelated request.
8. Confirm neither educator can read the other's private profile document.

## Firestore structure

- `profiles/{uid}`: owner-only contact, school and complete transfer profile.
- `profiles/{uid}/savedMatches/{matchUid}`: owner-only saved matches.
- `matchProfiles/{uid}`: sanitised matching fields readable by verified educators.
- `requests/{fromUid_toUid}`: participant-only match request and status.
- `requests/{fromUid_toUid}/messages/{messageId}`: immutable messages available only to the verified participants while the request is accepted.
- `notifications/{notificationId}`: server-created in-app activity for one recipient.
- `reports/{reportId}`: private safety reports reviewed by an administrator.
- `moderation/{uid}`: administrator-controlled profile suspension state.
- `mail/{mailId}`: server-created email jobs for the Trigger Email extension.

If Firebase reports that a query needs an index, use the link in the error message to create the suggested composite index, then wait for it to finish building.

## Deleting test users

After the functions are deployed, use **Delete Account** on `profile.html` whenever possible. The `deleteOwnAccount` callable removes the Authentication account and related Firestore documents. The `cleanupDeletedUser` trigger also runs when an administrator deletes a user under **Authentication > Users**.

Before those functions are deployed, Authentication deletion alone will still leave Firestore documents and manual cleanup is required.
# Launch completion checklist

The website code now includes account cleanup, reporting, blocking, moderation, notifications, email hooks, App Check support, analytics consent and hosting configuration. The following console steps are required before those server-backed features become active.

## 1. Upgrade and deploy the backend

Cloud Functions and the Trigger Email extension require the Blaze billing plan. Set a small budget alert in Google Cloud before deployment.

```powershell
npm --prefix functions install
firebase login
firebase use maycrosshub
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

When deployment asks for `ADMIN_EMAIL`, enter the email address that should access `admin.html`. Sign in with that account and open `admin.html` once; the protected `claimAdmin` function will add the administrator custom claim.

When deployment asks for `BACKUP_BUCKET`, enter a dedicated Cloud Storage bucket name. Create that bucket in a suitable region first, apply a retention policy, and grant the Functions service account permission to run Firestore exports and write to the bucket. The `dailyFirestoreBackup` function runs at 02:00 Africa/Johannesburg time.

## 2. Configure App Check

1. Open Google Cloud Console for project `maycrosshub`.
2. Create a reCAPTCHA Enterprise website key for `maycrosshub.co.za` and `www.maycrosshub.co.za` if the `www` address is used.
3. Paste the site key into `appCheckSiteKey` in `firebase-config.js`.
4. Deploy the website and confirm valid App Check requests appear in Firebase Console.
5. After monitoring, enable enforcement for Firestore and callable Cloud Functions. Enable Authentication enforcement only if it is offered for the project's configured authentication service.
6. Change all callable functions in `functions/index.js` from `enforceAppCheck: false` to `enforceAppCheck: true`, then redeploy functions.

Do not enable enforcement before the site key is deployed, because account deletion and administrator setup would be rejected.

## 3. Enable notification email delivery

1. In Firebase Extensions, install **Trigger Email**.
2. Use `mail` as the email documents collection.
3. Configure a verified SMTP provider and a sender such as `notifications@maycrosshub.co.za`.
4. Add SPF and DKIM records supplied by the mail provider.
5. Test a new request, accepted request and conversation message with two accounts.

The platform still provides in-app notifications if email delivery is unavailable.

## 4. Brand Authentication emails

In Firebase Authentication templates:

1. Set the sender name to **May Cross Hub**.
2. Use the custom action domain where Firebase permits it.
3. Rewrite verification and password-reset messages in plain, professional language.
4. Confirm every link returns users to `maycrosshub.co.za`.

## 5. Complete operational details

1. Confirm that the Formspree inbox for Privacy concern submissions is actively monitored.
2. Confirm the responsible party and privacy-contact wording in `privacy.html` with an appropriate South African privacy adviser.
3. Complete any Information Officer registration required for the operator.
4. Configure scheduled Firestore exports or another tested backup process.
5. Create Google Cloud budget and function-error alerts.

## 6. Release test

Use at least three verified test accounts and test:

- Registration, verification, sign-in persistence and password reset.
- Profile editing, pausing, exporting and permanent deletion.
- Exact and partial matches, filters, saved matches and Load More Matches.
- New, accepted, declined, cancelled, archived and resent requests.
- Introductory request messages and accepted conversations.
- Blocking, reporting, moderation and hidden profiles.
- In-app and email notifications.
- Analytics accepted and denied states without sending personal information.
- Chrome, Edge, Firefox and mobile widths, including keyboard-only use.

Run the static release checks with:

```powershell
node --experimental-vm-modules tests/site-checks.mjs
node --check functions/index.js
```

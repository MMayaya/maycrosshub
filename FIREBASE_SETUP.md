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

If Firebase reports that a query needs an index, use the link in the error message to create the suggested composite index, then wait for it to finish building.

## Deleting test users

Deleting a user under **Authentication > Users** does not delete that user's Firestore documents. Before deleting a test user, copy the UID and clean up these paths in **Firestore Database > Data**:

- `matchProfiles/{uid}` to remove the account from recommended matches.
- `profiles/{uid}` and its `savedMatches` subcollection.
- Any `requests` documents where `fromUid` or `toUid` equals the deleted UID, including their `messages` subcollections.

If the Authentication user was already deleted, find the old document under `profiles` by its `email` field and use that document ID as the old UID. Firestore subcollections must be deleted separately.

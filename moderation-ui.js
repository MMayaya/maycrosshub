import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

export function displayCodeForUid(uid) {
    return 'MCH-' + String(uid || '').slice(0, 6).toUpperCase();
}

export function openSafetyDialog() {
    return new Promise((resolve) => {
        const dialog = document.createElement('dialog');
        dialog.className = 'moderation-dialog';
        dialog.innerHTML = `
            <form method="dialog">
                <h2>Safety options</h2>
                <p>Reports are reviewed privately. Blocking prevents new requests and conversations with this educator.</p>
                <label for="moderationReason">Reason</label>
                <select id="moderationReason">
                    <option value="Inappropriate conduct">Inappropriate conduct</option>
                    <option value="Misleading profile">Misleading profile</option>
                    <option value="Spam or repeated requests">Spam or repeated requests</option>
                    <option value="Safety or privacy concern">Safety or privacy concern</option>
                    <option value="Other">Other</option>
                </select>
                <label for="moderationDetails">Additional details <span>(optional)</span></label>
                <textarea id="moderationDetails" maxlength="1000" placeholder="Do not include passwords, identity documents or unnecessary sensitive information."></textarea>
                <div class="moderation-options">
                    <label><input id="moderationReport" type="checkbox" checked> Send report</label>
                    <label><input id="moderationBlock" type="checkbox"> Block educator</label>
                </div>
                <p id="moderationError" role="alert"></p>
                <div class="moderation-actions">
                    <button class="moderation-cancel" type="button">Cancel</button>
                    <button class="moderation-submit" type="button">Confirm</button>
                </div>
            </form>`;
        document.body.append(dialog);
        const close = (value) => {
            dialog.close();
            dialog.remove();
            resolve(value);
        };
        dialog.querySelector('.moderation-cancel').addEventListener('click', () => close(null));
        dialog.querySelector('.moderation-submit').addEventListener('click', () => {
            const report = dialog.querySelector('#moderationReport').checked;
            const block = dialog.querySelector('#moderationBlock').checked;
            if (!report && !block) {
                dialog.querySelector('#moderationError').textContent = 'Choose report, block, or both.';
                return;
            }
            close({
                report,
                block,
                reason: dialog.querySelector('#moderationReason').value,
                details: dialog.querySelector('#moderationDetails').value.trim()
            });
        });
        dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(null); });
        dialog.showModal();
    });
}

export async function submitSafetyAction(db, reporterUid, reportedUid, requestId, action) {
    const operations = [];
    if (action.report) {
        operations.push(addDoc(collection(db, 'reports'), {
            reporterUid,
            reporterCode: displayCodeForUid(reporterUid),
            reportedUid,
            reportedCode: displayCodeForUid(reportedUid),
            requestId: requestId || '',
            reason: action.reason,
            details: action.details,
            status: 'open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }));
    }
    if (action.block) {
        operations.push(setDoc(doc(db, 'profiles', reporterUid, 'blockedUsers', reportedUid), {
            ownerUid: reporterUid,
            blockedUid: reportedUid,
            createdAt: serverTimestamp()
        }));
    }
    await Promise.all(operations);
}

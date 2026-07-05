const MAYCROSS_ORIGIN = 'https://maycrosshub.co.za';

export const customEmailActionHandlerUrl = `${MAYCROSS_ORIGIN}/auth/action`;

export const emailVerificationActionSettings = {
    url: `${MAYCROSS_ORIGIN}/signin?emailAction=verified`,
    handleCodeInApp: false
};

export const passwordResetActionSettings = {
    url: `${MAYCROSS_ORIGIN}/signin?emailAction=passwordReset`,
    handleCodeInApp: false
};

export function buildCustomEmailActionLink(firebaseActionLink) {
    const source = new URL(firebaseActionLink);
    return `${customEmailActionHandlerUrl}${source.search}`;
}

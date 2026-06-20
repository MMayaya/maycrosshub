export function compactAccountName(user, profile = null) {
    const profileName = [profile?.firstName, profile?.lastName]
        .filter(Boolean)
        .join(' ');
    const fullName = String(user?.displayName || profileName || '').trim();
    const parts = fullName.split(/\s+/).filter(Boolean);

    if (parts.length < 2) return parts[0] || 'Signed in';

    const firstName = profile?.firstName || parts[0];
    const surname = profile?.lastName || parts[parts.length - 1];
    const initial = firstName.charAt(0).toUpperCase();
    return `${initial}. ${surname}`;
}

export function accountInitials(user, profile = null) {
    const profileName = [profile?.firstName, profile?.lastName]
        .filter(Boolean)
        .join(' ');
    const parts = String(user?.displayName || profileName || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) return 'ED';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

import type { ProfileData } from '$lib/types';

export interface SocialLink {
	label: 'GitHub' | 'LinkedIn';
	href: string;
}

/**
 * The profile's social links. Both fields hold usernames, not URLs, and each link comes only
 * from its own field: an empty one is simply left out, never derived from the other. A link
 * whose show switch is off is left out too, while its username stays stored.
 */
export function socialLinks(
	profile: Pick<ProfileData, 'github' | 'linkedin' | 'showGithub' | 'showLinkedin'> | null
): SocialLink[] {
	const github = profile?.showGithub ? profile.github?.trim() : undefined;
	const linkedin = profile?.showLinkedin ? profile.linkedin?.trim() : undefined;
	const links: SocialLink[] = [];
	if (github) links.push({ label: 'GitHub', href: `https://github.com/${github}` });
	if (linkedin) links.push({ label: 'LinkedIn', href: `https://linkedin.com/in/${linkedin}` });
	return links;
}

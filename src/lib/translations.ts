import type { Language } from '$lib/i18n';

/** A count-dependent string: `one` for 1, `other` for anything else; `{n}` is the count. */
export interface Plural {
	one: string;
	other: string;
}

export interface Translations {
	topBar: {
		downloadPdf: string;
		switchTo: string;
		toggleTheme: string;
		menu: string;
		darkMode: string;
		lightMode: string;
	};
	footer: {
		updated: string;
		admin: string;
	};
	resume: {
		present: string;
		available: string;
		empty: string;
	};
	pdf: {
		profile: string;
	};
	admin: {
		title: string;
		signInIntro: string;
		signIn: string;
		accessDenied: string;
	};
	notice: {
		/** Front-page notice for the signed-in admin (R9); `{n}` is the count. */
		needAttention: Plural;
		/** The same when it is exactly one; `{name}` is "Company · Role". */
		needsAttention: string;
	};
	meta: {
		/** Page title suffix: "<name> — Resume". */
		resume: string;
		/** Meta description prefix: "Resume and portfolio of <name>". */
		descriptionOf: string;
	};
}

const translations: Record<Language, Translations> = {
	en: {
		topBar: {
			downloadPdf: 'PDF',
			switchTo: 'Switch to',
			toggleTheme: 'Toggle theme',
			menu: 'Menu',
			darkMode: 'Dark mode',
			lightMode: 'Light mode'
		},
		footer: {
			updated: 'Updated',
			admin: 'Admin'
		},
		resume: {
			present: 'Present',
			available: 'Available',
			empty: 'No profile data found. Run pnpm db:seed to populate.'
		},
		pdf: {
			profile: 'Profile'
		},
		admin: {
			title: 'Admin',
			signInIntro: 'Sign in to manage your resume content.',
			signIn: 'Sign in with GitHub',
			accessDenied: 'Access denied — your account is not authorized.'
		},
		notice: {
			needAttention: {
				one: '1 application needs attention',
				other: '{n} applications need attention'
			},
			needsAttention: '{name} needs attention'
		},
		meta: {
			resume: 'Resume',
			descriptionOf: 'Resume and portfolio of'
		}
	},
	sv: {
		topBar: {
			downloadPdf: 'PDF',
			switchTo: 'Byt till',
			toggleTheme: 'Växla tema',
			menu: 'Meny',
			darkMode: 'Mörkt läge',
			lightMode: 'Ljust läge'
		},
		footer: {
			updated: 'Uppdaterad',
			admin: 'Admin'
		},
		resume: {
			present: 'Nuvarande',
			available: 'Tillgänglig',
			empty: 'Ingen profil hittades. Kör pnpm db:seed för att fylla på.'
		},
		pdf: {
			profile: 'Profil'
		},
		admin: {
			title: 'Admin',
			signInIntro: 'Logga in för att hantera innehållet i ditt CV.',
			signIn: 'Logga in med GitHub',
			accessDenied: 'Åtkomst nekad — ditt konto har inte behörighet.'
		},
		notice: {
			needAttention: {
				one: '1 ansökan behöver åtgärdas',
				other: '{n} ansökningar behöver åtgärdas'
			},
			needsAttention: '{name} behöver åtgärdas'
		},
		meta: {
			resume: 'CV',
			descriptionOf: 'CV och portfolio för'
		}
	}
};

export function getTranslation(lang: Language): Translations {
	return translations[lang];
}

/** Picks the form for `count` and fills in `{n}`. */
export function plural(count: number, forms: Plural): string {
	return (count === 1 ? forms.one : forms.other).replace('{n}', String(count));
}

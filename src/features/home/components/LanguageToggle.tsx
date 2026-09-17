import { LANDING_LANGS, LANG_LABELS, type LandingLang } from '../i18n/landingCopy';

interface LanguageToggleProps {
  value: LandingLang;
  onChange: (lang: LandingLang) => void;
  /** Accessible name for the group, supplied in the active language. */
  groupLabel: string;
}

/**
 * Segmented English / Malayalam switch for the landing-page nav.
 *
 * Each option is labelled in its own language, so a visitor looking for
 * Malayalam finds "മലയാളം" rather than a code they have to decode. The
 * Malayalam option carries lang="ml" so assistive tech announces it with
 * Malayalam pronunciation even while the page is still in English.
 */
const LanguageToggle = ({ value, onChange, groupLabel }: LanguageToggleProps) => (
  <div
    role="group"
    aria-label={groupLabel}
    className="inline-flex items-center gap-0.5 rounded-md border border-brand-line-25 bg-brand-wash-06 p-0.5"
  >
    {LANDING_LANGS.map((lang) => {
      const selected = value === lang;
      return (
        <button
          key={lang}
          type="button"
          lang={lang}
          onClick={() => onChange(lang)}
          aria-pressed={selected}
          className={`rounded-[4px] px-2.5 py-1 text-[12px] sm:text-[12.5px] font-semibold leading-tight transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-teal ${
            selected
              ? 'bg-brand-teal text-white'
              : 'text-brand-on-ink-mute hover:text-brand-bg'
          }`}
        >
          {LANG_LABELS[lang]}
        </button>
      );
    })}
  </div>
);

export default LanguageToggle;

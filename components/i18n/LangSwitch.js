'use client';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function LangSwitch({ className = '' }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex items-center gap-1 rounded-md border border-border bg-cardBg px-1 py-0.5 font-mono text-xs ${className}`}>
      {['pt', 'en'].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2 py-0.5 rounded-sm transition-all ${
            lang === code
              ? 'bg-acidGreen text-bgDark shadow-neon-green'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

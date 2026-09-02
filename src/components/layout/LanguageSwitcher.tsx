import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocaleCode } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Crisp SVG vector flag icons
const FlagRU: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg viewBox="0 0 640 480" className={`${className} rounded-sm shadow-[0_0_1px_rgba(0,0,0,0.4)] shrink-0`}>
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#fff" d="M0 0h640v160H0z" />
      <path fill="#0039a6" d="M0 160h640v160H0z" />
      <path fill="#d52b1e" d="M0 320h640v160H0z" />
    </g>
  </svg>
);

const FlagUS: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg viewBox="0 0 640 480" className={`${className} rounded-sm shadow-[0_0_1px_rgba(0,0,0,0.4)] shrink-0`}>
    <g fillRule="evenodd">
      <path fill="#bd3d44" d="M0 0h640v480H0z" />
      <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640" />
      <path fill="#192f5d" d="M0 0h260v258.5H0z" />
      <circle cx="40" cy="35" r="8" fill="#fff" />
      <circle cx="90" cy="35" r="8" fill="#fff" />
      <circle cx="140" cy="35" r="8" fill="#fff" />
      <circle cx="190" cy="35" r="8" fill="#fff" />
      <circle cx="65" cy="70" r="8" fill="#fff" />
      <circle cx="115" cy="70" r="8" fill="#fff" />
      <circle cx="165" cy="70" r="8" fill="#fff" />
      <circle cx="215" cy="70" r="8" fill="#fff" />
      <circle cx="40" cy="105" r="8" fill="#fff" />
      <circle cx="90" cy="105" r="8" fill="#fff" />
      <circle cx="140" cy="105" r="8" fill="#fff" />
      <circle cx="190" cy="105" r="8" fill="#fff" />
    </g>
  </svg>
);

const FlagUZ: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg viewBox="0 0 640 480" className={`${className} rounded-sm shadow-[0_0_1px_rgba(0,0,0,0.4)] shrink-0`}>
    <path fill="#1eb53a" d="M0 320h640v160H0z" />
    <path fill="#0099b5" d="M0 0h640v160H0z" />
    <path fill="#ce1126" d="M0 153.6h640v172.8H0z" />
    <path fill="#fff" d="M0 163.2h640v153.6H0z" />
    <circle cx="70" cy="80" r="38" fill="#fff" />
    <circle cx="82" cy="80" r="32" fill="#0099b5" />
    <circle cx="125" cy="55" r="5" fill="#fff" />
    <circle cx="145" cy="55" r="5" fill="#fff" />
    <circle cx="165" cy="55" r="5" fill="#fff" />
    <circle cx="125" cy="75" r="5" fill="#fff" />
    <circle cx="145" cy="75" r="5" fill="#fff" />
    <circle cx="165" cy="75" r="5" fill="#fff" />
    <circle cx="125" cy="95" r="5" fill="#fff" />
    <circle cx="145" cy="95" r="5" fill="#fff" />
    <circle cx="165" cy="95" r="5" fill="#fff" />
  </svg>
);

const languages: { code: LocaleCode; label: string; Flag: React.FC<{ className?: string }> }[] = [
  { code: 'ru', label: 'Русский', Flag: FlagRU },
  { code: 'en', label: 'English', Flag: FlagUS },
  { code: 'uz', label: "O'zbekcha", Flag: FlagUZ },
];

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();
  const { user, updateUserPreferences } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (code: LocaleCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem('pft_locale', code);
    setIsOpen(false);
    if (!user) return;
    try {
      await updateUserPreferences({ locale: code });
    } catch (err) {
      // The language already applied locally; failing to persist it to the account is
      // not worth interrupting the user over, but it must not become an unhandled
      // rejection either.
      console.error('Failed to persist locale to profile:', err);
    }
  };

  return (
    <div className={`relative z-50 ${className || ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800/80 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/80 transition-colors shadow-apple-sm"
      >
        <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
        <currentLang.Flag className="w-4 h-3 rounded-[2px]" />
        <span className="hidden sm:inline uppercase tracking-wider font-semibold text-[11px]">{currentLang.code}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1.5 w-40 rounded-2xl bg-white dark:bg-zinc-900 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl py-1.5 z-[100] overflow-hidden"
          >
            {languages.map((lang) => {
              const isSelected = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <lang.Flag className="w-4 h-3 rounded-[2px]" />
                    <span>{lang.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

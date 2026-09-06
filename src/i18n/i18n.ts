import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from './locales/ru.json';
import en from './locales/en.json';
import uz from './locales/uz.json';

const resources = {
  ru: { translation: ru },
  en: { translation: en },
  uz: { translation: uz },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'en', 'uz'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'pft_locale',
    },
  });

// index.html hardcodes lang="ru" for the very first paint (before i18next has
// detected anything), but the app supports en/uz too — a screen reader kept reading
// English or Uzbek text with Russian phonetics for the rest of the session otherwise.
// This fires once init resolves the detected language, and again on every switch.
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;

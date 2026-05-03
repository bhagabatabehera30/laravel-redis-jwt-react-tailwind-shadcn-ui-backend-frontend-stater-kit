import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import de from './locales/de.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      hi: { translation: hi },
      es: { translation: es },
      de: { translation: de },
      ja: { translation: ja },
      ru: { translation: ru },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
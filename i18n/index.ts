
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import en from "./locales/en.json";
import it from "./locales/it.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";

export const supportedLanguages = [
  "en",
  "it",
  "es",
  "fr",
] as const;

export type AppLanguage =
  (typeof supportedLanguages)[number];

const deviceLanguage =
  getLocales()[0]?.languageCode ?? "en";

const initialLanguage =
  supportedLanguages.includes(
    deviceLanguage as AppLanguage
  )
    ? deviceLanguage
    : "en";

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      it: { translation: it },
      es: { translation: es },
      fr: { translation: fr },
    },

    lng: initialLanguage,
    fallbackLng: "en",

    supportedLngs: [...supportedLanguages],

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    initImmediate: false,
  });

export default i18n;

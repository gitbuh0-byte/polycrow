import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      welcome: "Welcome to Poly-Crow",
      dashboard: "Dashboard",
      my_agreements: "My Agreements",
      create_agreement: "Create Agreement",
      profile: "Profile",
      balance: "Wallet Balance",
      reliability: "Reliability Score",
      escrow_active: "Active Escrow",
      agreement_broken: "Agreement Broken",
      agreement_fulfilled: "Agreement Fulfilled",
      participants: "Participants",
      stakes: "Stakes",
      timer: "Timer",
      chat: "Chat",
      breach_claim: "I claim a breach",
      admin: "Admin",
      help: "Help Center",
      settings: "Settings",
      logout: "Logout",
    },
  },
  es: {
    translation: {
      welcome: "Bienvenido a Poly-Crow",
      dashboard: "Panel",
      my_agreements: "Mis Acuerdos",
      create_agreement: "Crear Acuerdo",
      profile: "Perfil",
      balance: "Saldo de Billetera",
      reliability: "Puntuación de Fiabilidad",
      escrow_active: "Escrow Activo",
      agreement_broken: "Acuerdo Roto",
      agreement_fulfilled: "Acuerdo Cumplido",
      participants: "Participantes",
      stakes: "Apuestas",
      timer: "Temporizador",
      chat: "Chat",
      breach_claim: "Reclamo un incumplimiento",
      admin: "Admin",
      help: "Centro de Ayuda",
      settings: "Ajustes",
      logout: "Cerrar sesión",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;


import i18n from "../i18n";

export function validateEmail(email: string): string {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    return i18n.t("validation.emailRequired");
  }

  if (!regex.test(email)) {
    return i18n.t("validation.invalidEmail");
  }

  return "";
}

export function validatePassword(password: string): string {
  if (!password) {
    return i18n.t("validation.passwordRequired");
  }

  if (password.length < 8) {
    return i18n.t("validation.passwordMinLength");
  }

  return "";
}

export function validateFirstName(firstName: string): string {
  if (!firstName.trim()) {
    return i18n.t("validation.firstNameRequired");
  }

  if (firstName.trim().length < 2) {
    return i18n.t("validation.firstNameMinLength");
  }

  return "";
}

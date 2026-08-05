export function validateEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    return "Email is required";
  }

  if (!regex.test(email)) {
    return "Enter a valid email";
  }

  return "";
}

export function validatePassword(password: string) {
  if (!password) {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must contain at least 8 characters";
  }

  return "";
}

export function validateFirstName(firstName: string): string {
  if (!firstName.trim()) {
    return "First name is required";
  }

  if (firstName.trim().length < 2) {
    return "First name must contain at least 2 characters";
  }

  return "";
}
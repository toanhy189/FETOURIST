export function checkPasswordStrength(password) {
  const value = String(password || "");
  const issues = [];

  if (value.length < 6) {
    issues.push("Toi thieu 6 ky tu");
  }

  if (!/[A-Z]/.test(value)) {
    issues.push("Can it nhat 1 chu hoa");
  }

  if (!/[a-z]/.test(value)) {
    issues.push("Can it nhat 1 chu thuong");
  }

  if (!/[0-9]/.test(value)) {
    issues.push("Can it nhat 1 chu so");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function checkPasswordStrength(password) {
  const value = String(password || "");
  const issues = [];

  if (value.length < 6) {
    issues.push("Tối thiểu 6 ký tự");
  }

  if (!/[A-Z]/.test(value)) {
    issues.push("Cần ít nhất 1 chữ hoa");
  }

  if (!/[a-z]/.test(value)) {
    issues.push("Cần ít nhất 1 chữ thường");
  }

  if (!/[0-9]/.test(value)) {
    issues.push("Cần ít nhất 1 chữ số");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

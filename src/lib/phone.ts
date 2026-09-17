const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function normalizePhoneNumber(value: string, defaultCountryCode = "+91") {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!compact) return null;

  const digits = compact.replace(/\D/g, "");
  if (!digits) return null;
  const nationalDigits = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  if (defaultCountryCode === "+91" && !INDIAN_MOBILE_PATTERN.test(nationalDigits)) return null;

  return `${defaultCountryCode}${nationalDigits}`;
}

export function formatPhoneForDisplay(value: string) {
  const normalized = normalizePhoneNumber(value);
  return normalized ?? value;
}

export function formatDisplayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972") && digits.length >= 11) {
    const local = digits.slice(3);
    return `+972 ${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`;
  }
  return digits ? `+${digits}` : phone;
}

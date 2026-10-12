export function parseMoney(value: string): number {
  const normalized = value.trim();
  if (!/^\d{1,8}([.,]\d{1,2})?$/.test(normalized))
    throw new Error("Informe um valor positivo com até duas casas decimais.");
  const [whole, fraction = ""] = normalized.split(/[.,]/);
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 2147483647)
    throw new Error("Valor fora do limite permitido.");
  return cents;
}

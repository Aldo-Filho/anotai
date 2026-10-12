import { BadRequestException } from "@nestjs/common";
import { todayInSaoPaulo, validateDateOnly } from "./calendar";
export function asDate(value: string, allowFuture = false): Date {
  try {
    validateDateOnly(value);
  } catch {
    throw new BadRequestException("Informe uma data válida entre 1900 e 2100.");
  }
  if (!allowFuture && value > todayInSaoPaulo())
    throw new BadRequestException(
      "A data de uma movimentação realizada não pode estar no futuro.",
    );
  return new Date(`${value}T00:00:00Z`);
}
export function monthRange(month: string) {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    month < "1900-01" ||
    month > "2100-12"
  )
    throw new BadRequestException("Informe o mês no formato AAAA-MM.");
  const start = new Date(`${month}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { gte: start, lt: end };
}
export const dateOnly = (value: Date) => value.toISOString().slice(0, 10);

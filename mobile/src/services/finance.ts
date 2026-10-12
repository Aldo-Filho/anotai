import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
export type Kind = "INCOME" | "EXPENSE";
export type Category = {
  id: string;
  name: string;
  type: Kind;
  userId: string | null;
};
export type Transaction = {
  id: string;
  description: string;
  amountCents: number;
  type: Kind;
  categoryId: string;
  category: Category;
  date: string;
  billId: string | null;
};
export type Bill = {
  id: string;
  description: string;
  amountCents: number;
  categoryId: string;
  category: Category;
  dueDate: string;
  status: "PENDING" | "DUE_TODAY" | "OVERDUE" | "PAID";
  payment: Transaction | null;
};
export type List<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
export type Summary = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  pendingCents: number;
};
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const displayDate = (date: string) =>
  date.split("-").reverse().join("/");
export const statusLabel = {
  PENDING: "Pendente",
  DUE_TODAY: "Vence hoje",
  OVERDUE: "Atrasada",
  PAID: "Paga",
};
export function parseAmount(value: string) {
  if (!/^\d{1,8}([.,]\d{1,2})?$/.test(value.trim()))
    throw new Error(
      "Informe o valor sem separador de milhar e com até duas casas decimais.",
    );
  const [whole, fraction = ""] = value.trim().split(/[.,]/);
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents < 1 || cents > 2147483647)
    throw new Error("Informe um valor entre R$ 0,01 e R$ 21.474.836,47.");
  return cents;
}
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loader());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, deps);
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );
  return { data, loading, error, reload };
}

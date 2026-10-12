import { useState } from "react";
import { View, Text } from "react-native";
import { apiRequest } from "../services/api";
import {
  Bill,
  Transaction,
  Kind,
  parseAmount,
  today,
} from "../services/finance";
import { Button, Field, Message } from "./ui";
import { Pills } from "./controls";
import { CategoryPicker } from "./CategoryPicker";
export function FinancialForm({
  kind,
  initial,
  onSaved,
}: {
  kind: "transaction" | "bill";
  initial?: Transaction | Bill;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(initial?.description || ""),
    [amount, setAmount] = useState(
      initial ? (initial.amountCents / 100).toFixed(2).replace(".", ",") : "",
    ),
    [type, setType] = useState<Kind>(
      initial && "type" in initial ? initial.type : "EXPENSE",
    ),
    [category, setCategory] = useState(initial?.categoryId || ""),
    [date, setDate] = useState(
      initial ? ("date" in initial ? initial.date : initial.dueDate) : today(),
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const save = async () => {
    setError("");
    try {
      const amountCents = parseAmount(amount);
      if (!description.trim()) throw new Error("Informe uma descrição.");
      if (!category) throw new Error("Escolha uma categoria.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error("Use a data no formato AAAA-MM-DD.");
      setBusy(true);
      const path = kind === "bill" ? "/bills" : "/transactions";
      const body =
        kind === "bill"
          ? {
              description: description.trim(),
              amountCents,
              categoryId: category,
              dueDate: date,
            }
          : {
              description: description.trim(),
              amountCents,
              type,
              categoryId: category,
              date,
            };
      await apiRequest(`${path}${initial ? `/${initial.id}` : ""}`, {
        method: initial ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View className="gap-5">
      {kind === "transaction" ? (
        <Pills
          value={type}
          onChange={(v) => {
            setType(v as Kind);
            setCategory("");
          }}
          options={[
            { label: "Despesa", value: "EXPENSE" },
            { label: "Receita", value: "INCOME" },
          ]}
        />
      ) : null}
      <Field
        label="Descrição"
        value={description}
        onChangeText={setDescription}
        maxLength={120}
        placeholder={
          kind === "bill" ? "Ex.: internet de casa" : "Ex.: almoço, salário…"
        }
      />
      <Field
        label="Valor (R$)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0,00"
      />
      <CategoryPicker
        type={kind === "bill" ? "EXPENSE" : type}
        value={category}
        onChange={setCategory}
      />
      <Field
        label={kind === "bill" ? "Vencimento" : "Data"}
        value={date}
        onChangeText={setDate}
        placeholder="AAAA-MM-DD"
        maxLength={10}
      />
      <Text className="text-xs leading-5 text-muted">
        {kind === "bill"
          ? "A conta só entra nas despesas realizadas depois de registrar o pagamento."
          : "Registre apenas valores já recebidos ou pagos. Para despesas futuras, use Contas."}
      </Text>
      <Message text={error} />
      <Button
        label={kind === "bill" ? "Salvar conta" : "Salvar lançamento"}
        onPress={save}
        loading={busy}
      />
    </View>
  );
}

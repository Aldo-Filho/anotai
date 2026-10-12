import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Dialog,
  Empty,
  IconAction,
  Message,
  Screen,
} from "../../components/ui";
import {
  LoadState,
  MonthControl,
  Pagination,
  Pills,
} from "../../components/controls";
import { CategoryPicker } from "../../components/CategoryPicker";
import { FinancialForm } from "../../components/FinancialForm";
import { apiRequest } from "../../services/api";
import {
  displayDate,
  Kind,
  List,
  money,
  today,
  Transaction,
  useLoad,
} from "../../services/finance";
export default function Transactions() {
  const [month, setMonth] = useState(today().slice(0, 7)),
    [type, setType] = useState(""),
    [category, setCategory] = useState(""),
    [page, setPage] = useState(1),
    [form, setForm] = useState(false),
    [editing, setEditing] = useState<Transaction>(),
    [removing, setRemoving] = useState<Transaction>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const params = useLocalSearchParams(),
    router = useRouter();
  const query = new URLSearchParams({
    month,
    page: String(page),
    ...(type ? { type } : {}),
    ...(category ? { categoryId: category } : {}),
  });
  const state = useLoad(
    () => apiRequest<List<Transaction>>(`/transactions?${query}`),
    [month, type, category, page],
  );
  useEffect(() => {
    if (params.new === "1") {
      setEditing(undefined);
      setForm(true);
      router.setParams({ new: undefined });
    }
  }, [params.new]);
  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/transactions/${removing.id}`, { method: "DELETE" });
      setRemoving(undefined);
      setPage(1);
      void state.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title="Lançamentos"
      action={
        <IconAction
          label="Novo lançamento"
          icon="plus"
          onPress={() => {
            setEditing(undefined);
            setForm(true);
          }}
        />
      }
    >
      <MonthControl
        month={month}
        onChange={(v) => {
          setMonth(v);
          setPage(1);
        }}
      />
      <Pills
        options={[
          { label: "Todos", value: "" },
          { label: "Receitas", value: "INCOME" },
          { label: "Despesas", value: "EXPENSE" },
        ]}
        value={type}
        onChange={(v) => {
          setType(v);
          setCategory("");
          setPage(1);
        }}
      />
      <CategoryPicker
        allowAll
        type={type ? (type as Kind) : undefined}
        value={category}
        onChange={(v) => {
          setCategory(v);
          setPage(1);
        }}
      />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {!state.loading && !state.error && state.data?.items.length === 0 ? (
        <Empty
          title="Nenhum lançamento por aqui"
          detail="Adicione uma receita ou despesa, ou escolha outro mês."
        />
      ) : null}
      <View className="gap-3">
        {state.data?.items.map((item) => (
          <Card key={item.id}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-ink">
                  {item.description}
                </Text>
                <Text className="text-xs text-muted">
                  {item.category.name} · {displayDate(item.date)}
                </Text>
                <Text
                  className={`mt-1 text-xs font-medium ${item.type === "INCOME" ? "text-positive" : "text-negative"}`}
                >
                  {item.type === "INCOME" ? "Receita recebida" : "Despesa paga"}
                </Text>
              </View>
              <Text
                className={`text-lg font-bold ${item.type === "INCOME" ? "text-positive" : "text-negative"}`}
              >
                {item.type === "INCOME" ? "+" : "−"} {money(item.amountCents)}
              </Text>
            </View>
            {item.billId ? (
              <Text className="text-xs text-muted">
                Vinculada a uma conta paga; alteração indisponível.
              </Text>
            ) : (
              <View className="flex-row justify-end gap-2">
                <IconAction
                  label={`Editar ${item.description}`}
                  icon="edit-2"
                  onPress={() => {
                    setEditing(item);
                    setForm(true);
                  }}
                />
                <IconAction
                  label={`Excluir ${item.description}`}
                  icon="trash-2"
                  onPress={() => {
                    setError("");
                    setRemoving(item);
                  }}
                />
              </View>
            )}
          </Card>
        ))}
      </View>
      <Pagination
        page={page}
        total={state.data?.total || 0}
        onChange={setPage}
      />
      <Dialog
        visible={form}
        title={editing ? "Editar lançamento" : "Novo lançamento"}
        onClose={() => setForm(false)}
      >
        {form ? (
          <FinancialForm
            kind="transaction"
            initial={editing}
            onSaved={() => {
              setForm(false);
              void state.reload();
            }}
          />
        ) : null}
      </Dialog>
      <Dialog
        visible={!!removing}
        title="Excluir lançamento?"
        onClose={() => {
          if (!busy) setRemoving(undefined);
        }}
      >
        <View className="gap-4">
          <Text className="text-base leading-6 text-ink">
            O lançamento “{removing?.description}” será removido. Essa ação não
            pode ser desfeita.
          </Text>
          <Message text={error} />
          <Button
            label="Excluir lançamento"
            kind="danger"
            onPress={remove}
            loading={busy}
          />
          <Button
            label="Cancelar"
            kind="secondary"
            disabled={busy}
            onPress={() => setRemoving(undefined)}
          />
        </View>
      </Dialog>
    </Screen>
  );
}

import { useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Card,
  Dialog,
  Empty,
  Field,
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
import { FinancialForm } from "../../components/FinancialForm";
import { apiRequest } from "../../services/api";
import {
  Bill,
  displayDate,
  List,
  money,
  statusLabel,
  today,
  useLoad,
} from "../../services/finance";
export default function Bills() {
  const [month, setMonth] = useState(today().slice(0, 7)),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [form, setForm] = useState(false),
    [editing, setEditing] = useState<Bill>(),
    [paying, setPaying] = useState<Bill>(),
    [removing, setRemoving] = useState<Bill>(),
    [date, setDate] = useState(today()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const query = new URLSearchParams({
    month,
    page: String(page),
    ...(status ? { status } : {}),
  });
  const state = useLoad(
    () => apiRequest<List<Bill>>(`/bills?${query}`),
    [month, status, page],
  );
  const pay = async () => {
    if (!paying) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/bills/${paying.id}/payment`, {
        method: "POST",
        body: JSON.stringify({ paymentDate: date }),
      });
      setPaying(undefined);
      void state.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/bills/${removing.id}`, { method: "DELETE" });
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
      title="Contas"
      action={
        <IconAction
          label="Nova conta"
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
          { label: "Todas", value: "" },
          { label: "A pagar", value: "UNPAID" },
          { label: "Atrasadas", value: "OVERDUE" },
          { label: "Pagas", value: "PAID" },
        ]}
        value={status}
        onChange={(v) => {
          setStatus(v);
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
          title="Tudo tranquilo por aqui"
          detail="Cadastre suas contas futuras para acompanhar os vencimentos."
        />
      ) : null}
      <View className="gap-3">
        {state.data?.items.map((item) => (
          <Card key={item.id}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-2">
                <Text className="text-base font-semibold text-ink">
                  {item.description}
                </Text>
                <Text className="text-xs text-muted">
                  {item.category.name} · vence {displayDate(item.dueDate)}
                </Text>
                <Text
                  className={`text-xs font-semibold ${item.status === "OVERDUE" ? "text-negative" : item.status === "PAID" ? "text-positive" : "text-muted"}`}
                >
                  {statusLabel[item.status]}
                </Text>
              </View>
              <Text className="text-lg font-bold text-ink">
                {money(item.amountCents)}
              </Text>
            </View>
            {item.payment ? (
              <Text className="text-xs text-muted">
                Paga em {displayDate(item.payment.date)}
              </Text>
            ) : (
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <Button
                    label={`Pagar ${item.description}`}
                    onPress={() => {
                      setPaying(item);
                      setDate(today());
                      setError("");
                    }}
                  />
                </View>
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
                    setRemoving(item);
                    setError("");
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
        title={editing ? "Editar conta" : "Nova conta"}
        onClose={() => setForm(false)}
      >
        {form ? (
          <FinancialForm
            kind="bill"
            initial={editing}
            onSaved={() => {
              setForm(false);
              void state.reload();
            }}
          />
        ) : null}
      </Dialog>
      <Dialog
        visible={!!paying}
        title="Registrar pagamento"
        onClose={() => {
          if (!busy) setPaying(undefined);
        }}
      >
        <View className="gap-4">
          <Text className="text-base text-ink">
            {paying?.description} · {money(paying?.amountCents || 0)}
          </Text>
          <Field
            label="Data do pagamento"
            value={date}
            onChangeText={setDate}
            maxLength={10}
          />
          <Text className="text-sm leading-5 text-muted">
            Uma despesa será registrada na data do pagamento.
          </Text>
          <Message text={error} />
          <Button label="Confirmar pagamento" onPress={pay} loading={busy} />
        </View>
      </Dialog>
      <Dialog
        visible={!!removing}
        title="Excluir conta?"
        onClose={() => {
          if (!busy) setRemoving(undefined);
        }}
      >
        <View className="gap-4">
          <Text className="text-base leading-6 text-ink">
            A conta “{removing?.description}” será excluída. Essa ação não pode
            ser desfeita.
          </Text>
          <Message text={error} />
          <Button
            label="Excluir conta"
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

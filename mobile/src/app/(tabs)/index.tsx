import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  Screen,
  Brand,
  Button,
  Card,
  Empty,
  ThemeSwitch,
} from "../../components/ui";
import { LoadState, MonthControl } from "../../components/controls";
import { apiRequest } from "../../services/api";
import {
  Bill,
  displayDate,
  List,
  money,
  statusLabel,
  Summary,
  today,
  useLoad,
} from "../../services/finance";
export default function Home() {
  const [month, setMonth] = useState(today().slice(0, 7));
  const router = useRouter();
  const state = useLoad(
    () =>
      Promise.all([
        apiRequest<Summary>(`/reports/monthly?month=${month}`),
        apiRequest<List<Bill>>("/bills?status=UNPAID&pageSize=4"),
      ]),
    [month],
  );
  const summary = state.data?.[0],
    bills = state.data?.[1].items;
  return (
    <Screen
      title="Seu mês, em dia"
      action={<ThemeSwitch />}
    >
      <Brand />
      <MonthControl month={month} onChange={setMonth} />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      <View className="gap-5 rounded-[28px] bg-brand p-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-brandInk">
            Saldo do mês
          </Text>
          <Feather name="trending-up" size={22} color="#244c25" />
        </View>
        <Text
          testID="balance-total"
          className="text-[38px] font-bold tracking-tight text-brandInk"
        >
          {summary ? money(summary.balanceCents) : "—"}
        </Text>
        <Text className="text-xs leading-5 text-brandInk">
          Receitas menos despesas já registradas.
        </Text>
        <View className="flex-row gap-4 border-t border-black/10 pt-4">
          <View className="flex-1 gap-1">
            <Text className="text-xs text-brandInk">↗ Receitas</Text>
            <Text
              testID="income-total"
              className="text-lg font-bold text-brandInk"
            >
              {summary ? money(summary.incomeCents) : "—"}
            </Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-xs text-brandInk">↘ Despesas</Text>
            <Text
              testID="expense-total"
              className="text-lg font-bold text-brandInk"
            >
              {summary ? money(summary.expenseCents) : "—"}
            </Text>
          </View>
        </View>
      </View>
      <Button
        label="Novo lançamento"
        icon="plus"
        onPress={() => router.push("/lancamentos?new=1")}
      />
      <Card>
        <View className="flex-row items-center gap-3">
          <Feather name="calendar" size={23} color="#77a16c" />
          <View className="flex-1 gap-1">
            <Text className="text-sm font-medium text-muted">
              Ainda a pagar neste mês
            </Text>
            <Text className="text-2xl font-bold text-ink">
              {summary ? money(summary.pendingCents) : "—"}
            </Text>
          </View>
        </View>
        <Text className="text-xs text-muted">
          Esse valor previsto ainda não foi descontado do saldo.
        </Text>
      </Card>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-ink">
          Próximos vencimentos
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver todas as contas"
          onPress={() => router.push("/contas")}
        >
          <Text className="text-sm font-semibold text-positive">
            Ver todas →
          </Text>
        </Pressable>
      </View>
      {bills?.length === 0 ? (
        <Empty
          title="Nenhuma conta pendente"
          detail="Cadastre contas futuras para se organizar com antecedência."
        />
      ) : (
        <View className="gap-3">
          {bills?.map((bill) => (
            <Pressable
              key={bill.id}
              accessibilityRole="button"
              onPress={() => router.push("/contas")}
              className="flex-row items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
            >
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-ink">
                  {bill.description}
                </Text>
                <Text
                  className={`text-xs ${bill.status === "OVERDUE" ? "text-negative" : "text-muted"}`}
                >
                  {displayDate(bill.dueDate)} · {statusLabel[bill.status]}
                </Text>
              </View>
              <Text className="font-bold text-ink">
                {money(bill.amountCents)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

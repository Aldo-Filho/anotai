import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Button, Field, Message } from "./ui";
export function Pills({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((item) => (
        <Pressable
          key={item.value}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: value === item.value }}
          onPress={() => onChange(item.value)}
          className={`rounded-full px-4 py-2 ${item.value === value ? "bg-brand" : "border border-line bg-surface"}`}
        >
          <Text
            className={`text-sm font-medium ${item.value === value ? "text-brandInk" : "text-muted"}`}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function MonthControl({
  month,
  onChange,
}: {
  month: string;
  onChange: (value: string) => void;
}) {
  const [input, setInput] = useState(month),
    [error, setError] = useState("");
  useEffect(() => setInput(month), [month]);
  const move = (delta: number) => {
    const date = new Date(`${month}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + delta);
    const value = date.toISOString().slice(0, 7);
    if (value >= "1900-01" && value <= "2100-12") onChange(value);
  };
  const commit = () => {
    if (
      /^\d{4}-(0[1-9]|1[0-2])$/.test(input) &&
      input >= "1900-01" &&
      input <= "2100-12"
    ) {
      setError("");
      onChange(input);
    } else {
      setError("Use AAAA-MM, por exemplo 2026-10.");
      setInput(month);
    }
  };
  return (
    <View className="gap-2">
      <View className="flex-row items-end gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => move(-1)}
          className="mb-1 h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface"
        >
          <Text className="text-2xl text-ink">‹</Text>
        </Pressable>
        <View className="flex-1">
          <Field
            label="Mês (AAAA-MM)"
            value={input}
            onChangeText={setInput}
            onBlur={commit}
            maxLength={7}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          onPress={() => move(1)}
          className="mb-1 h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface"
        >
          <Text className="text-2xl text-ink">›</Text>
        </Pressable>
      </View>
      <Message text={error} />
    </View>
  );
}
export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return (
    <View className="gap-3">
      {loading ? <ActivityIndicator color="#57a534" /> : null}
      <Message text={error} />
      {error ? (
        <Button kind="secondary" label="Tentar novamente" onPress={retry} />
      ) : null}
    </View>
  );
}
export function Pagination({
  page,
  total,
  size = 20,
  onChange,
}: {
  page: number;
  total: number;
  size?: number;
  onChange: (page: number) => void;
}) {
  if (total <= size) return null;
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Button
        label="Anterior"
        kind="secondary"
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
      />
      <Text className="text-sm text-muted">
        {page} / {Math.ceil(total / size)}
      </Text>
      <Button
        label="Próxima"
        kind="secondary"
        disabled={page * size >= total}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}

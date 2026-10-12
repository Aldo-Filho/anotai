import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Category, Kind } from "../services/finance";
import { apiRequest } from "../services/api";
import { Button, Dialog, Field, Message } from "./ui";
export function CategoryPicker({
  type,
  value,
  onChange,
  allowAll = false,
}: {
  type?: Kind;
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
}) {
  const [categories, setCategories] = useState<Category[]>([]),
    [open, setOpen] = useState(false),
    [creating, setCreating] = useState(false),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () =>
    apiRequest<Category[]>("/categories")
      .then(setCategories)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  const save = async () => {
    if (!name.trim()) {
      setError("Informe o nome da categoria.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const category = await apiRequest<Category>("/categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), type: type || "EXPENSE" }),
      });
      setCategories((current) => [...current, category]);
      onChange(category.id);
      setOpen(false);
      setCreating(false);
      setName("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink">Categoria</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={allowAll ? "Filtrar por categoria" : "Categoria"}
        onPress={() => {
          setOpen(true);
          setCreating(false);
          setError("");
          void load();
        }}
        className="min-h-[50px] flex-row items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3"
      >
        <Text className="text-base text-ink">
          {categories.find((c) => c.id === value)?.name ||
            (allowAll ? "Todas as categorias" : "Escolha uma categoria")}
        </Text>
        <Text className="text-muted">⌄</Text>
      </Pressable>
      <Dialog
        visible={open}
        title={creating ? "Criar categoria" : "Escolha uma categoria"}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <View className="gap-3">
          {creating ? (
            <>
              <Field
                label="Nome da categoria"
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
              <Text className="text-sm text-muted">
                Categoria de {type === "INCOME" ? "receita" : "despesa"},
                disponível só para você.
              </Text>
              <Message text={error} />
              <Button label="Salvar categoria" onPress={save} loading={busy} />
              <Button
                label="Voltar às categorias"
                kind="secondary"
                onPress={() => setCreating(false)}
              />
            </>
          ) : (
            <>
              {allowAll ? (
                <Button
                  label="Todas as categorias"
                  kind="secondary"
                  onPress={() => {
                    onChange("");
                    setOpen(false);
                  }}
                />
              ) : null}
              {categories
                .filter((c) => !type || c.type === type)
                .map((c) => (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={c.name}
                    onPress={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                    className="rounded-xl bg-app p-4"
                  >
                    <Text className="font-medium text-ink">{c.name}</Text>
                  </Pressable>
                ))}
              <Message text={error} />
              {!allowAll ? (
                <Button
                  label="Criar categoria"
                  icon="plus"
                  onPress={() => {
                    setCreating(true);
                    setError("");
                  }}
                />
              ) : null}
            </>
          )}
        </View>
      </Dialog>
    </View>
  );
}

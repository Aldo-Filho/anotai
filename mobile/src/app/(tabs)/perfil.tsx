import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { Preference, useTheme } from "../../providers/ThemeProvider";
import { apiRequest } from "../../services/api";
import { Category, Kind, useLoad } from "../../services/finance";
import {
  Button,
  Card,
  Dialog,
  Field,
  Message,
  Screen,
} from "../../components/ui";
import { LoadState, Pills } from "../../components/controls";
import { Privacy } from "../../components/Privacy";
export default function Profile() {
  const auth = useAuth(),
    theme = useTheme();
  const [modal, setModal] = useState<
      "privacy" | "email" | "delete" | "category" | null
    >(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [type, setType] = useState<Kind>("EXPENSE"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const categories = useLoad(() => apiRequest<Category[]>("/categories"), []);
  const open = (value: typeof modal) => {
    setModal(value);
    setError("");
    setSuccess("");
    setPassword("");
    setEmail(auth.user?.email || "");
    setName("");
  };
  const perform = async (action: () => Promise<void>) => {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const exportData = () =>
    perform(async () => {
      const data = await apiRequest("/users/me/export");
      if (typeof document === "undefined")
        throw new Error("Use o navegador para exportar os dados.");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `anotai-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSuccess("Seus dados foram exportados. Guarde o arquivo com cuidado.");
    });
  return (
    <Screen title="Perfil">
      <Card>
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted">
            Sua conta
          </Text>
          <Text className="text-base font-semibold text-ink">
            {auth.user?.email}
          </Text>
        </View>
        <Button
          label="Alterar e-mail"
          kind="secondary"
          onPress={() => open("email")}
        />
      </Card>
      <Card>
        <Text className="text-lg font-semibold text-ink">Aparência</Text>
        <Text className="text-sm text-muted">
          Escolha como o Anotaí combina com você.
        </Text>
        <View className="flex-row gap-2">
          {(
            [
              { value: "system", label: "Sistema" },
              { value: "light", label: "Claro" },
              { value: "dark", label: "Escuro" },
            ] as { value: Preference; label: string }[]
          ).map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityLabel={`Tema ${item.label.toLowerCase()}`}
              accessibilityState={{ selected: theme.preference === item.value }}
              onPress={() => theme.setPreference(item.value)}
              className={`flex-1 items-center rounded-2xl px-3 py-4 ${theme.preference === item.value ? "bg-brand" : "border border-line bg-app"}`}
            >
              <Text
                className={`font-medium ${theme.preference === item.value ? "text-brandInk" : "text-ink"}`}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        <Text className="text-lg font-semibold text-ink">
          Minhas categorias
        </Text>
        <Text className="text-sm leading-5 text-muted">
          As categorias prontas já estão disponíveis. Crie outras para seu dia a
          dia.
        </Text>
        <LoadState
          loading={categories.loading}
          error={categories.error}
          retry={categories.reload}
        />
        <View className="flex-row flex-wrap gap-2">
          {categories.data
            ?.filter((c) => c.userId)
            .map((c) => (
              <View
                key={c.id}
                className="rounded-full border border-line bg-app px-3 py-2"
              >
                <Text className="text-xs text-ink">
                  {c.name} · {c.type === "INCOME" ? "receita" : "despesa"}
                </Text>
              </View>
            ))}
        </View>
        <Button
          label="Criar categoria"
          kind="secondary"
          icon="plus"
          onPress={() => open("category")}
        />
      </Card>
      <Card>
        <Text className="text-lg font-semibold text-ink">
          Privacidade e dados
        </Text>
        <Button
          label="Aviso de privacidade"
          kind="secondary"
          onPress={() => open("privacy")}
        />
        <Button
          label="Exportar meus dados"
          kind="secondary"
          loading={busy && modal === null}
          onPress={exportData}
        />
        <Text className="text-xs leading-5 text-muted">
          Projeto acadêmico. Use dados fictícios na demonstração.
        </Text>
      </Card>
      {modal === null ? (
        <>
          <Message text={error} />
          <Message text={success} success />
        </>
      ) : null}
      <Button
        label="Sair da conta"
        kind="secondary"
        onPress={() => perform(auth.logout)}
        disabled={busy}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Excluir minha conta"
        onPress={() => open("delete")}
        className="items-center p-3"
      >
        <Text className="text-sm font-semibold text-negative">
          Excluir minha conta
        </Text>
      </Pressable>
      <Text className="text-center text-xs text-muted">
        Anotaí • versão 1.0
      </Text>
      <Dialog
        visible={modal !== null}
        title={
          modal === "privacy"
            ? "Privacidade"
            : modal === "email"
              ? "Alterar e-mail"
              : modal === "category"
                ? "Criar categoria"
                : "Excluir sua conta?"
        }
        onClose={() => {
          if (!busy) setModal(null);
        }}
      >
        {modal === "privacy" ? (
          <Privacy />
        ) : (
          <View className="gap-4">
            {modal === "category" ? (
              <>
                <Pills
                  value={type}
                  onChange={(v) => setType(v as Kind)}
                  options={[
                    { label: "Despesa", value: "EXPENSE" },
                    { label: "Receita", value: "INCOME" },
                  ]}
                />
                <Field
                  label="Nome da categoria"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                />
                <Message text={error} />
                <Button
                  label="Salvar categoria"
                  loading={busy}
                  onPress={() =>
                    perform(async () => {
                      if (!name.trim())
                        throw new Error("Informe o nome da categoria.");
                      await apiRequest("/categories", {
                        method: "POST",
                        body: JSON.stringify({ name: name.trim(), type }),
                      });
                      setModal(null);
                      void categories.reload();
                    })
                  }
                />
              </>
            ) : (
              <>
                {modal === "email" ? (
                  <Field
                    label="Novo e-mail"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                ) : (
                  <Text className="text-base leading-6 text-ink">
                    Sua conta, lançamentos, contas e categorias pessoais serão
                    excluídos. Essa ação não pode ser desfeita. Confirme sua
                    senha para continuar.
                  </Text>
                )}
                <Field
                  label="Senha atual"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                />
                <Message text={error} />
                <Button
                  label={
                    modal === "email"
                      ? "Salvar e-mail"
                      : "Excluir definitivamente"
                  }
                  kind={modal === "email" ? "primary" : "danger"}
                  loading={busy}
                  onPress={() =>
                    perform(async () => {
                      if (!password)
                        throw new Error("Informe sua senha atual.");
                      if (modal === "email") {
                        await apiRequest("/users/me", {
                          method: "PATCH",
                          body: JSON.stringify({
                            email: email.trim(),
                            password,
                          }),
                        });
                        await auth.reloadUser();
                        setModal(null);
                      } else {
                        await apiRequest("/users/me", {
                          method: "DELETE",
                          body: JSON.stringify({ password, confirm: true }),
                        });
                        auth.clearUser();
                        setModal(null);
                      }
                    })
                  }
                />
              </>
            )}
          </View>
        )}
      </Dialog>
    </Screen>
  );
}

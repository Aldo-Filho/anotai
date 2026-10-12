import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Brand,
  Button,
  Field,
  Message,
  ThemeSwitch,
  Dialog,
} from "../../components/ui";
import { Privacy } from "../../components/Privacy";
import { apiRequest } from "../../services/api";
export default function Cadastro() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [privacy, setPrivacy] = useState(false);
  const router = useRouter();
  const submit = async () => {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError("Use uma senha com 12 a 128 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      router.replace("/login?created=1");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView
      className="flex-1 bg-app"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="mx-auto w-full max-w-[480px] gap-8 px-6 py-8">
        <View className="flex-row items-center justify-between">
          <Brand large />
          <ThemeSwitch />
        </View>
        <View className="mt-8 gap-2">
          <Text
            accessibilityRole="header"
            className="text-3xl font-bold tracking-tight text-ink"
          >
            Crie sua conta
          </Text>
        </View>
        <View className="gap-5 rounded-3xl border border-line bg-surface p-6">
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="voce@exemplo.com"
          />
          <Field
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Pelo menos 12 caracteres"
          />
          <Field
            label="Confirmar senha"
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoComplete="new-password"
            onSubmitEditing={submit}
            placeholder="Repita a senha"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setPrivacy(true)}
          >
            <Text className="text-sm leading-5 text-muted">
              Consulte o{" "}
              <Text className="font-semibold text-positive">
                aviso de privacidade
              </Text>{" "}
              antes de cadastrar. Use dados fictícios na demonstração.
            </Text>
          </Pressable>
          <Message text={error} />
          <Button label="Criar conta" onPress={submit} loading={busy} />
          <Button
            kind="secondary"
            label="Já tenho conta"
            onPress={() => router.replace("/login")}
          />
        </View>
      </View>
      <Dialog
        visible={privacy}
        title="Privacidade"
        onClose={() => setPrivacy(false)}
      >
        <Privacy />
      </Dialog>
    </ScrollView>
  );
}

import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Brand,
  Button,
  Field,
  Message,
  ThemeSwitch,
  Dialog,
} from "../../components/ui";
import { Privacy } from "../../components/Privacy";
import { useAuth } from "../../providers/AuthProvider";
export default function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [privacy, setPrivacy] = useState(false);
  const auth = useAuth(),
    router = useRouter(),
    params = useLocalSearchParams();
  const submit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Preencha seu e-mail e senha.");
      return;
    }
    setBusy(true);
    try {
      await auth.login(email.trim(), password);
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
      <View className="mx-auto w-full max-w-[480px] flex-1 gap-8 px-6 py-8">
        <View className="flex-row items-center justify-between">
          <Brand large />
          <ThemeSwitch />
        </View>
        <View className="mt-12 gap-3">
          <Text
            accessibilityRole="header"
            className="text-[36px] font-bold leading-[42px] tracking-tight text-ink"
          >
            Entrar
          </Text>
        </View>
        <View className="gap-5 rounded-3xl border border-line bg-surface p-6">
          {params.created ? (
            <Message text="Conta criada! Entre para começar." success />
          ) : null}
          {auth.expired ? (
            <Message text="Seu acesso expirou. Entre novamente." />
          ) : null}
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="voce@exemplo.com"
          />
          <Field
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            onSubmitEditing={submit}
            placeholder="Sua senha"
          />
          <Message text={error} />
          <Button label="Entrar" onPress={submit} loading={busy} />
          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-muted">Ainda não tem conta?</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Criar minha conta"
              onPress={() => router.push("/cadastro")}
            >
              <Text className="text-sm font-semibold text-positive">
                Criar minha conta
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setPrivacy(true)}>
          <Text className="text-center text-xs text-muted">
            Aviso de privacidade • Projeto acadêmico
          </Text>
        </Pressable>
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

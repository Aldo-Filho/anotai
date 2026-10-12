import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  kind = "primary",
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  kind?: "primary" | "secondary" | "danger";
  icon?: React.ComponentProps<typeof Feather>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      className={`min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3 ${kind === "primary" ? "bg-brand" : kind === "danger" ? "bg-negative" : "bg-surface border border-line"} ${disabled || loading ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={kind === "primary" ? "#163719" : "#ffffff"} />
      ) : icon ? (
        <Feather
          name={icon}
          size={18}
          color={
            kind === "primary"
              ? "#163719"
              : kind === "danger"
                ? "#ffffff"
                : "#59985a"
          }
        />
      ) : null}
      <Text
        className={`font-semibold text-[15px] ${kind === "primary" ? "text-brandInk" : kind === "danger" ? "text-white" : "text-ink"}`}
      >
        {loading ? "Aguarde…" : label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { resolvedTheme } = useTheme();
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={resolvedTheme === "dark" ? "#adadad" : "#6e8273"}
        className="min-h-[50px] rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink"
      />
    </View>
  );
}
export function Message({
  text,
  success = false,
}: {
  text: string;
  success?: boolean;
}) {
  if (!text) return null;
  return (
    <Text
      accessibilityRole="alert"
      className={`text-sm leading-5 ${success ? "text-positive" : "text-negative"}`}
    >
      {text}
    </Text>
  );
}
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <View className="flex-row items-center gap-3">
      <Image
        source={require("../../../assets/logo.png")}
        style={{
          width: large ? 52 : 36,
          height: large ? 52 : 36,
          borderRadius: large ? 16 : 11,
        }}
        accessibilityLabel="Logo Anotaí"
      />
      <Text
        className={`${large ? "text-3xl" : "text-2xl"} font-bold tracking-tight text-ink`}
      >
        Anotaí<Text className="text-positive">.</Text>
      </Text>
    </View>
  );
}
export function ThemeSwitch() {
  const { setPreference, resolvedTheme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        resolvedTheme === "dark" ? "Tema claro" : "Tema escuro"
      }
      onPress={() => setPreference(resolvedTheme === "dark" ? "light" : "dark")}
      className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface"
    >
      <Feather
        name={resolvedTheme === "dark" ? "sun" : "moon"}
        size={20}
        color={resolvedTheme === "dark" ? "#d4d4d4" : "#3b5744"}
      />
    </Pressable>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <ScrollView
      className="flex-1 bg-app"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="mx-auto w-full max-w-[600px] gap-6 px-5 pt-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 gap-1">
            <Text
              accessibilityRole="header"
              className="text-[28px] font-bold tracking-tight text-ink"
            >
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-sm text-muted">{subtitle}</Text>
            ) : null}
          </View>
          {action}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="gap-4 rounded-3xl border border-line bg-surface p-5">
      {children}
    </View>
  );
}
export function Dialog({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          className="w-full max-w-[480px] rounded-3xl border border-line bg-surface p-5"
          style={{ maxHeight: "90%" }}
        >
          <View className="mb-5 flex-row items-center justify-between gap-4">
            <Text
              accessibilityRole="header"
              className="flex-1 text-xl font-bold text-ink"
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-app"
            >
              <Text className="text-xl text-muted">×</Text>
            </Pressable>
          </View>
          <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <View className="items-center gap-3 rounded-3xl border border-line bg-surface p-8">
      <Feather name="inbox" size={28} color="#77a16c" />
      <Text className="text-center text-base font-semibold text-ink">
        {title}
      </Text>
      <Text className="text-center text-sm leading-5 text-muted">{detail}</Text>
    </View>
  );
}
export function IconAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}) {
  const { resolvedTheme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-xl border border-line"
    >
      <Feather
        name={icon}
        size={16}
        color={resolvedTheme === "dark" ? "#d4d4d4" : "#526b59"}
      />
    </Pressable>
  );
}

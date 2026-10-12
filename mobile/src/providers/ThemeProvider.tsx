import React, { createContext, useContext, useEffect, useState } from "react";
import { View, useColorScheme } from "react-native";
import { vars } from "nativewind";
export type Preference = "system" | "light" | "dark";
const palettes = {
  light: {
    "--app": "247 249 246",
    "--surface": "255 255 255",
    "--ink": "24 39 29",
    "--muted": "95 114 102",
    "--line": "224 232 225",
    "--positive": "36 111 55",
    "--negative": "179 48 42",
  },
  dark: {
    "--app": "20 20 20",
    "--surface": "32 32 32",
    "--ink": "242 242 242",
    "--muted": "173 173 173",
    "--line": "61 61 61",
    "--positive": "132 216 101",
    "--negative": "255 149 142",
  },
};
const Context = createContext<{
  preference: Preference;
  resolvedTheme: "light" | "dark";
  setPreference: (value: Preference) => void;
}>({ preference: "system", resolvedTheme: "light", setPreference: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setValue] = useState<Preference>(() => {
    if (typeof localStorage === "undefined") return "system";
    const stored = localStorage.getItem("anotai-theme");
    return stored === "light" || stored === "dark" ? stored : "system";
  });
  const resolvedTheme =
    preference === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : preference;
  const setPreference = (value: Preference) => {
    setValue(value);
    try {
      localStorage.setItem("anotai-theme", value);
    } catch {}
  };
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.colorScheme = resolvedTheme;
      for (const [key, value] of Object.entries(palettes[resolvedTheme]))
        document.documentElement.style.setProperty(key, value);
      document.title = "Anotaí";
    }
  }, [resolvedTheme]);
  return (
    <Context.Provider value={{ preference, resolvedTheme, setPreference }}>
      <View
        testID="theme-root"
        {...({ dataSet: { theme: resolvedTheme } } as any)}
        style={[{ flex: 1 }, vars(palettes[resolvedTheme])]}
        className="bg-app"
      >
        {children}
      </View>
    </Context.Provider>
  );
}
export const useTheme = () => useContext(Context);

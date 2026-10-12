import "../styles/global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { ThemeProvider } from "../providers/ThemeProvider";
function Navigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    const auth = segments[0] === "(auth)";
    if (!user && !auth) router.replace("/login");
    if (user && auth) router.replace("/");
  }, [user, loading, segments]);
  return <Stack screenOptions={{ headerShown: false, animation: "none" }} />;
}
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </ThemeProvider>
  );
}

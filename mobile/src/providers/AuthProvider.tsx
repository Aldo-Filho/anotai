import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { apiRequest, ApiError } from "../services/api";
export type PublicUser = { id: string; email: string };
const Context = createContext<{
  user: PublicUser | null;
  loading: boolean;
  expired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  clearUser: () => void;
}>({
  user: null,
  loading: true,
  expired: false,
  login: async () => {},
  logout: async () => {},
  reloadUser: async () => {},
  clearUser: () => {},
});
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null),
    [loading, setLoading] = useState(true),
    [expired, setExpired] = useState(false);
  const hadSession = useRef(false);
  const clearUser = () => {
    hadSession.current = false;
    setUser(null);
    setExpired(false);
  };
  const reloadUser = async () => {
    const result = await apiRequest<PublicUser>("/users/me");
    hadSession.current = true;
    setUser(result);
  };
  useEffect(() => {
    reloadUser()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const onExpired = () => {
      if (hadSession.current) {
        hadSession.current = false;
        setUser(null);
        setExpired(true);
      }
    };
    if (typeof window !== "undefined")
      window.addEventListener("anotai:unauthorized", onExpired);
    return () => {
      if (typeof window !== "undefined")
        window.removeEventListener("anotai:unauthorized", onExpired);
    };
  }, []);
  const login = async (email: string, password: string) => {
    const result = await apiRequest<{ user: PublicUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    hadSession.current = true;
    setUser(result.user);
    setExpired(false);
  };
  const logout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
    clearUser();
  };
  return (
    <Context.Provider
      value={{ user, loading, expired, login, logout, reloadUser, clearUser }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);

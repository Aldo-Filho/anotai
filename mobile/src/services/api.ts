const base = process.env.EXPO_PUBLIC_API_URL || "/api";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function csrfToken() {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("anotai_csrf="))
      ?.slice("anotai_csrf=".length) || ""
  );
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method || "GET";
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(!["GET", "HEAD"].includes(method)
          ? { "X-CSRF-Token": decodeURIComponent(csrfToken()) }
          : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar. Confira se o servidor está aberto e tente novamente.",
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (
      response.status === 401 &&
      !path.startsWith("/auth") &&
      typeof window !== "undefined"
    )
      window.dispatchEvent(new Event("anotai:unauthorized"));
    const message = Array.isArray(body?.message)
      ? body.message.join(" · ")
      : body?.message;
    throw new ApiError(
      response.status,
      message || "Não foi possível concluir. Tente novamente.",
    );
  }
  return body;
}

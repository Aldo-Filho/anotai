export function readConfig() {
  const jwtSecret = process.env.JWT_SECRET || "";
  const csrfSecret = process.env.CSRF_SECRET || "";
  const localDemo = process.env.LOCAL_DEMO === "true";
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";
  const port = Number(process.env.PORT || 3000);
  if (
    jwtSecret.length < 32 ||
    csrfSecret.length < 32 ||
    jwtSecret === csrfSecret
  )
    throw new Error(
      "Configure JWT_SECRET e CSRF_SECRET distintos, com pelo menos 32 caracteres.",
    );
  const parsed = new URL(origin);
  if (localDemo && !["localhost", "127.0.0.1"].includes(parsed.hostname))
    throw new Error("LOCAL_DEMO permite apenas localhost.");
  if (!localDemo && parsed.protocol !== "https:")
    throw new Error("HTTPS é obrigatório fora da demonstração local.");
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("PORT deve estar entre 1024 e 65535.");
  return { jwtSecret, csrfSecret, localDemo, origin, port };
}

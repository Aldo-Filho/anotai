import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
export function createEnvironment(root) {
  const target = path.join(root, "backend", ".env");
  if (fs.existsSync(target)) return false;
  const template = fs.readFileSync(
    path.join(root, "backend", ".env.example"),
    "utf8",
  );
  const contents = template
    .replace("CHANGE_ME_JWT", randomBytes(32).toString("hex"))
    .replace("CHANGE_ME_CSRF", randomBytes(32).toString("hex"));
  fs.writeFileSync(target, contents, { flag: "wx" });
  return true;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const created = createEnvironment(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  );
  console.log(
    created
      ? "Arquivo backend/.env criado com chaves únicas. Edite DATABASE_URL com sua conexão PostgreSQL."
      : "backend/.env já existe e foi preservado.",
  );
}

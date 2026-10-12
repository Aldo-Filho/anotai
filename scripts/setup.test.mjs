import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createEnvironment } from "./setup.mjs";
const base = path.resolve("test-results");
fs.mkdirSync(base, { recursive: true });
function fixture() {
  const root = fs.mkdtempSync(path.join(base, "env-setup-"));
  fs.mkdirSync(path.join(root, "backend"));
  fs.writeFileSync(
    path.join(root, "backend", ".env.example"),
    "DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/anotai\nJWT_SECRET=CHANGE_ME_JWT\nCSRF_SECRET=CHANGE_ME_CSRF\n",
  );
  return root;
}
function cleanup(root) {
  assert.equal(path.dirname(root), base);
  assert.ok(path.basename(root).startsWith("env-setup-"));
  fs.rmSync(root, { recursive: true });
}
test("gera chaves distintas e mantém a conexão a configurar", () => {
  const root = fixture();
  try {
    assert.equal(createEnvironment(root), true);
    const text = fs.readFileSync(path.join(root, "backend", ".env"), "utf8");
    assert.match(
      text,
      /DATABASE_URL=postgresql:\/\/postgres:SUA_SENHA@localhost:5432\/anotai/,
    );
    const jwt = text.match(/JWT_SECRET=(.+)/)[1],
      csrf = text.match(/CSRF_SECRET=(.+)/)[1];
    assert.ok(jwt.length >= 64);
    assert.ok(csrf.length >= 64);
    assert.notEqual(jwt, csrf);
  } finally {
    cleanup(root);
  }
});
test("não sobrescreve ambiente existente", () => {
  const root = fixture();
  try {
    fs.writeFileSync(path.join(root, "backend", ".env"), "existing-secret");
    assert.equal(createEnvironment(root), false);
    assert.equal(
      fs.readFileSync(path.join(root, "backend", ".env"), "utf8"),
      "existing-secret",
    );
  } finally {
    cleanup(root);
  }
});

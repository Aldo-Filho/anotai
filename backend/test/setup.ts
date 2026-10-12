import "reflect-metadata";
import { config } from "dotenv";
import path from "node:path";
config({ path: path.resolve(__dirname, "../.env"), quiet: true });
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith("_test"))
  throw new Error(
    "Use TEST_DATABASE_URL com banco separado terminado em _test.",
  );
if (testUrl === process.env.DATABASE_URL)
  throw new Error("Banco de teste não pode ser o banco principal.");
process.env.DATABASE_URL = testUrl;
process.env.LOCAL_DEMO = "true";
process.env.APP_ORIGIN = "http://localhost:3000";

import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./config/app";
import { readConfig } from "./config/env";
import { serveWeb } from "./config/web";
async function bootstrap() {
  const config = readConfig();
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn"],
  });
  configureApp(app);
  serveWeb(app);
  app.enableShutdownHooks();
  await app.listen(config.port, config.localDemo ? "127.0.0.1" : "0.0.0.0");
  console.log(`Anotaí: ${config.origin}`);
}
bootstrap().catch(() => {
  console.error(
    "Não foi possível iniciar. Confira .env, PostgreSQL e a porta configurada.",
  );
  process.exitCode = 1;
});

import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { readConfig } from "./env";
import { Request, Response, NextFunction } from "express";
import { SafeErrorFilter } from "../common/error.filter";
export function configureApp(app: INestApplication): void {
  const config = readConfig();
  const allowedOrigins = new Set([
    config.origin,
    ...(config.localDemo ? ["http://localhost:8081"] : []),
  ]);
  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          upgradeInsecureRequests: config.localDemo ? null : [],
        },
      },
    }),
  );
  app.enableCors({ origin: [...allowedOrigins], credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new SafeErrorFilter());
  const attempts = new Map<string, { count: number; until: number }>();
  const requests = new Map<string, { count: number; until: number }>();
  app.use((req: Request, res: Response, next: NextFunction) => {
    const route = req.path.toLowerCase().replace(/\/+$/, "");
    if (
      !(route === "/api" || route.startsWith("/api/")) ||
      req.method === "OPTIONS"
    )
      return next();
    const now = Date.now();
    const ip = req.ip || "unknown";
    let bucket = requests.get(ip);
    if (!bucket || bucket.until < now) {
      bucket = { count: 0, until: now + 60000 };
      requests.set(ip, bucket);
    }
    if (++bucket.count > 300) {
      res.setHeader("Retry-After", "60");
      return res
        .status(429)
        .json({ message: "Muitas requisições. Aguarde um minuto." });
    }
    if (requests.size > 1000)
      for (const [key, value] of requests)
        if (value.until < now) requests.delete(key);
    if (["GET", "HEAD"].includes(req.method)) return next();
    if (!allowedOrigins.has(req.get("Origin") || ""))
      return res.status(403).json({ message: "Origem não autorizada." });
    if (["/api/auth/login", "/api/auth/register"].includes(route)) {
      const key = `${req.ip}:${route}`;
      const now = Date.now();
      let entry = attempts.get(key);
      if (!entry || entry.until < now) {
        entry = { count: 0, until: now + 60000 };
        attempts.set(key, entry);
      }
      if (++entry.count > 10) {
        res.setHeader("Retry-After", "60");
        return res
          .status(429)
          .json({ message: "Muitas tentativas. Aguarde um minuto." });
      }
      if (attempts.size > 1000)
        for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
    }
    next();
  });
}

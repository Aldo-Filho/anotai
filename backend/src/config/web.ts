import { INestApplication } from "@nestjs/common";
import express from "express";
import path from "node:path";
import fs from "node:fs";
export function serveWeb(app: INestApplication) {
  const directory = path.resolve(__dirname, "../../../mobile/dist");
  if (!fs.existsSync(path.join(directory, "index.html"))) return;
  const server = app.getHttpAdapter().getInstance();
  const files = express.static(directory, { index: false, maxAge: 0 });
  server.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.path === "/api" || req.path.startsWith("/api/")) return next();
      files(req, res, () => {
        if (
          !["GET", "HEAD"].includes(req.method) ||
          req.path.startsWith("/_expo/") ||
          req.path.startsWith("/assets/")
        )
          return next();
        res.sendFile("index.html", { root: directory });
      });
    },
  );
}

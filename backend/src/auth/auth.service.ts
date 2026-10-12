import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { readConfig } from "../config/env";
export type PublicUser = { id: string; email: string };
export const hashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};
@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash = "";
  constructor(private readonly db: PrismaService) {}
  async onModuleInit() {
    this.dummyHash = await argon2.hash(randomBytes(32), hashOptions);
  }
  async register(email: string, password: string): Promise<PublicUser> {
    try {
      return await this.db.user.create({
        data: { email, passwordHash: await argon2.hash(password, hashOptions) },
        select: { id: true, email: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException(
          "Não foi possível cadastrar com esse e-mail.",
        );
      throw error;
    }
  }
  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({ where: { email } });
    const valid = await argon2.verify(
      user?.passwordHash || this.dummyHash,
      password,
    );
    if (!user || !valid)
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    const jti = randomUUID();
    const config = readConfig();
    const token = jwt.sign({ sub: user.id, jti }, config.jwtSecret, {
      algorithm: "HS256",
      expiresIn: 28800,
      issuer: "anotai",
      audience: "anotai-app",
    });
    return {
      user: { id: user.id, email: user.email },
      token,
      csrfToken: this.csrfToken(jti),
    };
  }
  csrfToken(jti: string) {
    return createHmac("sha256", readConfig().csrfSecret)
      .update(jti)
      .digest("hex");
  }
  async validateToken(token: string) {
    try {
      const payload = jwt.verify(token, readConfig().jwtSecret, {
        algorithms: ["HS256"],
        issuer: "anotai",
        audience: "anotai-app",
      }) as jwt.JwtPayload;
      if (typeof payload.sub !== "string" || typeof payload.jti !== "string")
        throw new Error("Invalid claims");
      const user = await this.db.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true },
      });
      if (!user) throw new Error("Missing user");
      return { ...user, jti: payload.jti };
    } catch {
      throw new UnauthorizedException("Entre na sua conta para continuar.");
    }
  }
}

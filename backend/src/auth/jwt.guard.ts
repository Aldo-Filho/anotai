import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request } from "express";
export type AuthRequest = Request & {
  user: { id: string; email: string; jti: string };
};
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    if (typeof req.cookies?.anotai_auth !== "string")
      throw new UnauthorizedException("Entre na sua conta para continuar.");
    req.user = await this.auth.validateToken(req.cookies.anotai_auth);
    return true;
  }
}

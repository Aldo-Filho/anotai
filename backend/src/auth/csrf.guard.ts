import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { AuthService } from "./auth.service";
import { AuthRequest } from "./jwt.guard";
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
    const header = req.get("X-CSRF-Token");
    const cookie = req.cookies?.anotai_csrf;
    const expected = this.auth.csrfToken(req.user.jti);
    if (
      typeof header !== "string" ||
      !/^[a-f0-9]{64}$/.test(header) ||
      header !== cookie ||
      !timingSafeEqual(Buffer.from(header), Buffer.from(expected))
    )
      throw new ForbiddenException("Recarregue a página e tente novamente.");
    return true;
  }
}

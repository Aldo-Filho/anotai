import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
@Catch()
export class SafeErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message =
      status >= 500
        ? "Não foi possível concluir. Tente novamente."
        : exception instanceof HttpException
          ? exception.getResponse()
          : { message: "Requisição inválida." };
    res
      .status(status)
      .json(
        typeof message === "string"
          ? { statusCode: status, message }
          : status >= 500
            ? { statusCode: status, message }
            : message,
      );
  }
}

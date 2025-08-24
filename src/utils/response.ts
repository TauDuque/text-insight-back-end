import { Response } from "express";

export class ApiResponse {
  static success(
    res: Response,
    data: any = null,
    message: string = "Operação realizada com sucesso",
    statusCode: number = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res: Response,
    message: string = "Erro interno do servidor",
    statusCode: number = 500,
    errors: any = null
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  static created(
    res: Response,
    data: any,
    message: string = "Recurso criado com sucesso"
  ) {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static badRequest(res: Response, message: string, errors: any = null) {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = "Não autorizado") {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = "Acesso negado") {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message: string = "Recurso não encontrado") {
    return this.error(res, message, 404);
  }

  static conflict(res: Response, message: string = "Conflito de dados") {
    return this.error(res, message, 409);
  }
}

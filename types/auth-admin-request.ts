import type { Request } from "express";

export interface AuthAdminRequest<
  Params = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  admin?: {
    id: number;
    email?: string;
  }
}

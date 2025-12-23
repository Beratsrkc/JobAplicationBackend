import type { Request } from "express";

export interface AuthRequest<
  Params = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user?: {
    id: number;
    email?: string;
    role?: string;
  }
}

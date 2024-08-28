import { Request } from "express";
import { Session } from "./dto/Session";

export interface Context {
  token?: string;
  req: Request;
  session: Session;
}
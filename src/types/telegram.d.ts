declare module "telegram/errors/RPCErrorList" {
  export class FloodWaitError extends Error {
    seconds: number;
  }
}

declare module "input";


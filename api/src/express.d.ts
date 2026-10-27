import type { User } from "./types.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      guestId?: string;
      /** Raw JSON body, retained for payment webhook signature verification. */
      rawBody?: Buffer;
    }
  }
}

export {};

import { z } from "zod";

/** Le secret gardé par l'app pendant la liaison : 32 octets en base64url. */
export const appTokenRequestSchema = z.strictObject({
  deviceCode: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});

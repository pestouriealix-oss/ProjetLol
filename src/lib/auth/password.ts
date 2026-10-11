import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// Paramètres scrypt recommandés par l'OWASP (N = 2^17, r = 8, p = 1).
const PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
// scrypt a besoin de 128 * N * r octets : on laisse un peu de marge.
const MAX_MEMORY = 128 * PARAMS.N * PARAMS.r * 2;

/**
 * Format stocké : `scrypt$N$r$p$sel$empreinte` (sel et empreinte en base64url).
 * Les paramètres voyagent avec l'empreinte, ce qui permettra de les durcir plus
 * tard sans invalider les mots de passe existants.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAX_MEMORY });
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltPart, keyPart] = stored.split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !saltPart || !keyPart) return false;

  const params = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Object.values(params).every((value) => Number.isSafeInteger(value) && value > 0)) {
    return false;
  }

  const expected = Buffer.from(keyPart, "base64url");
  try {
    const actual = await scryptAsync(
      password,
      Buffer.from(saltPart, "base64url"),
      expected.length,
      {
        ...params,
        maxmem: 128 * params.N * params.r * 2,
      },
    );
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    // Paramètres hors limites : empreinte corrompue, on refuse.
    return false;
  }
}

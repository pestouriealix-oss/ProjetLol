import { randomInt } from "node:crypto";

/**
 * Codes d'invitation du test fermé : 8 caractères faciles à recopier (ni I,
 * L, O, 0 ni 1), affichés en deux groupes (« K7QM-2XPA »). Saisis, ils
 * acceptent minuscules, espaces et tirets.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 8;

/** Un code au hasard (générateur cryptographique, sans biais). */
export function generateInviteCode(pick: (max: number) => number = randomInt): string {
  return Array.from({ length: INVITE_CODE_LENGTH }, () => ALPHABET[pick(ALPHABET.length)]).join("");
}

/** Le code tel qu'il est enregistré, ou `null` s'il ne peut pas en être un. */
export function normalizeInviteCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== INVITE_CODE_LENGTH) return null;
  return [...code].every((char) => ALPHABET.includes(char)) ? code : null;
}

/** « K7QM2XPA » → « K7QM-2XPA ». */
export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

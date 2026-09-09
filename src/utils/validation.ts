import * as z from 'zod';
import { normalizeDecimalInput } from './formatters';

/**
 * Wraps an amount schema so a value typed the way people actually write money — with a
 * decimal comma ("1500,50") or grouped with spaces ("11 000", the exact form this app
 * prints amounts in) — is cleaned up before it is coerced to a number.
 *
 * This has to live in the schema, not in the input's `onChange`. react-hook-form reads
 * `target.value` into its own store *before* it calls a registered `onChange`, so the
 * handler rewriting `e.target.value` only ever changed what the field displayed; the raw
 * string was already stored and went on to fail validation as NaN.
 */
export const fromDecimalInput = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? normalizeDecimalInput(value) : value),
    schema
  );

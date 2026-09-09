import { describe, it, expect } from 'vitest';
import * as z from 'zod';
import { fromDecimalInput } from './validation';

// Mirrors how the four forms build their amount fields.
const amount = fromDecimalInput(
  z.coerce
    .number({ invalid_type_error: 'not-a-number' })
    .finite({ message: 'not-positive' })
    .positive({ message: 'not-positive' })
);

const parse = (value: unknown) => amount.safeParse(value);

describe('fromDecimalInput', () => {
  // The normalizing used to live in the input's onChange, where it never reached the
  // validator: react-hook-form stores target.value before it calls that handler, so the
  // raw string was validated and failed as NaN — surfacing as an untranslated
  // "Expected number, received nan".
  it('accepts an amount grouped with a plain space, the way the app prints it', () => {
    expect(parse('11 000')).toMatchObject({ success: true, data: 11000 });
  });

  it('accepts the non-breaking space Intl actually groups with', () => {
    expect(parse('1 234 567')).toMatchObject({ success: true, data: 1234567 });
  });

  it('accepts a decimal comma', () => {
    expect(parse('1500,50')).toMatchObject({ success: true, data: 1500.5 });
  });

  it('accepts a grouped amount with a decimal comma', () => {
    expect(parse('11 000,50')).toMatchObject({ success: true, data: 11000.5 });
  });

  it('leaves a plain number untouched', () => {
    expect(parse(2000)).toMatchObject({ success: true, data: 2000 });
  });

  it('still rejects text, with the translated message rather than zod’s default', () => {
    const result = parse('11 000 UZS');
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0].message).toBe('not-a-number');
  });

  it('still rejects an empty field as a non-positive amount', () => {
    const result = parse('');
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0].message).toBe('not-positive');
  });
});

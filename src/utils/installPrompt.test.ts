import { describe, it, expect } from 'vitest';
import { shouldOfferInstall, isUpdatePrompt } from './installPrompt';

describe('shouldOfferInstall', () => {
  it('never offers while the app is already running from the home screen', () => {
    expect(shouldOfferInstall({ standalone: true, dismissedVersion: null, currentVersion: 'abc1234' })).toBe(false);
    expect(shouldOfferInstall({ standalone: true, dismissedVersion: 'old', currentVersion: 'abc1234' })).toBe(false);
  });

  it('offers to a first-time visitor in a browser tab', () => {
    expect(shouldOfferInstall({ standalone: false, dismissedVersion: null, currentVersion: 'abc1234' })).toBe(true);
  });

  it('stays quiet after a dismissal on the same build', () => {
    expect(shouldOfferInstall({ standalone: false, dismissedVersion: 'abc1234', currentVersion: 'abc1234' })).toBe(false);
  });

  it('asks again after a new build, because the shortcut still carries the old icon', () => {
    expect(shouldOfferInstall({ standalone: false, dismissedVersion: 'abc1234', currentVersion: 'def5678' })).toBe(true);
  });
});

describe('isUpdatePrompt', () => {
  it('separates "never seen this" from "seen an older build"', () => {
    expect(isUpdatePrompt(null, 'abc1234')).toBe(false);
    expect(isUpdatePrompt('abc1234', 'abc1234')).toBe(false);
    expect(isUpdatePrompt('abc1234', 'def5678')).toBe(true);
  });
});

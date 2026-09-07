import { describe, it, expect } from 'vitest';
import { shouldOfferInstall, isUpdatePrompt, detectPlatform } from './installPrompt';

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
};

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

describe('detectPlatform', () => {
  it('prefers the browser\'s own install dialog whenever it is available', () => {
    // Chrome on Android fires the event; there the card must not fall back to steps.
    expect(detectPlatform({ userAgent: UA.androidChrome, canPrompt: true })).toBe('chromium');
  });

  it('knows that every iPhone browser is WebKit and cannot install', () => {
    expect(detectPlatform({ userAgent: UA.iphoneSafari, canPrompt: false })).toBe('ios-safari');
    // Chrome on iOS keeps its share button somewhere else, so it gets its own steps.
    expect(detectPlatform({ userAgent: UA.iphoneChrome, canPrompt: false })).toBe('ios-other');
  });

  it('falls back to the browser menu on Android when no event arrived', () => {
    expect(detectPlatform({ userAgent: UA.androidChrome, canPrompt: false })).toBe('android');
  });

  it('offers nothing where nothing can be done', () => {
    expect(detectPlatform({ userAgent: UA.macSafari, canPrompt: false })).toBe('none');
  });
});

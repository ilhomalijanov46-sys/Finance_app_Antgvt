// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { InstallPrompt } from './InstallPrompt';
import i18n from '../../i18n/i18n';

afterEach(cleanup);
beforeAll(async () => {
  if (!i18n.isInitialized) await i18n.init();
});
beforeEach(() => {
  // The global `localStorage` under vitest is Node's experimental web storage, not
  // jsdom's, and it is only half-implemented — an in-memory stub keeps the test about the
  // component rather than about the runner.
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
  // jsdom has no matchMedia; the component asks it whether the app already runs standalone.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    // framer-motion still calls the deprecated pair when it checks reduced motion.
    addListener: () => {},
    removeListener: () => {},
  }));
});

const fireInstallEvent = () => {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = async () => {};
  event.userChoice = Promise.resolve({ outcome: 'accepted' });
  fireEvent(window, event);
};

describe('InstallPrompt', () => {
  it('stays out of the way until the browser says the app can be installed', () => {
    render(<InstallPrompt />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('offers installation once the browser fires the event', async () => {
    render(<InstallPrompt />);
    fireInstallEvent();
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined());
    expect(screen.getByText(i18n.t('install.title'))).toBeDefined();
  });

  it('remembers the dismissal against the current build', async () => {
    render(<InstallPrompt />);
    fireInstallEvent();
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.click(screen.getByRole('button', { name: i18n.t('install.later') }));

    // 'test' is the version vitest.config.ts injects for __APP_VERSION__.
    await waitFor(() => expect(localStorage.getItem('pft_install_prompt_dismissed')).toBe('test'));
  });

  it('does not come back on this build once it has been dismissed', async () => {
    localStorage.setItem('pft_install_prompt_dismissed', 'test');
    render(<InstallPrompt />);
    fireInstallEvent();

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('comes back after a new build, with wording about the update', async () => {
    localStorage.setItem('pft_install_prompt_dismissed', 'an-older-build');
    render(<InstallPrompt />);
    fireInstallEvent();

    await waitFor(() => screen.getByRole('dialog'));
    expect(screen.getByText(i18n.t('install.updatedTitle'))).toBeDefined();
  });
});

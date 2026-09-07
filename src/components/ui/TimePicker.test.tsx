// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { TimePicker } from './TimePicker';
import i18n from '../../i18n/i18n';

// Vitest runs without `globals`, so Testing Library's automatic per-test cleanup never
// registers itself — without this every render stacks up in the same document and the
// second test onwards matches two triggers.
afterEach(cleanup);

beforeAll(async () => {
  if (!i18n.isInitialized) await i18n.init();
});

const openPicker = () => fireEvent.click(screen.getByRole('button', { expanded: false }));

/** The component is controlled: without a parent that actually stores what it emits,
 *  a second keystroke is applied against the stale first one. */
const Controlled: React.FC<{ initial: string; onChange: (e: { target: { value: string } }) => void }> = ({
  initial,
  onChange,
}) => {
  const [value, setValue] = React.useState(initial);
  return (
    <TimePicker
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onChange(e);
      }}
    />
  );
};

describe('TimePicker', () => {
  it('shows the current value on the trigger', () => {
    render(<TimePicker value="09:30" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /09:30/ })).toBeDefined();
  });

  it('emits the picked minute with the current hour', async () => {
    const onChange = vi.fn();
    render(<TimePicker value="09:30" onChange={onChange} />);
    openPicker();

    const minutes = await screen.findByRole('listbox', { name: i18n.t('timePicker.minutes') });
    fireEvent.click(within(minutes).getByRole('option', { name: '45' }));

    expect(onChange).toHaveBeenCalledWith({ target: { value: '09:45', name: undefined } });
  });

  it('keeps an off-step minute selectable instead of dropping it', async () => {
    // The minute column offers five-minute steps; a record already saved at :37 must
    // still show its own value as an option rather than silently losing it.
    render(<TimePicker value="09:37" onChange={() => {}} />);
    openPicker();

    const minutes = await screen.findByRole('listbox', { name: i18n.t('timePicker.minutes') });
    const selected = within(minutes).getByRole('option', { selected: true });
    expect(selected.textContent).toBe('37');
  });

  it('builds a time from typed digits', async () => {
    const onChange = vi.fn();
    render(<Controlled initial="09:30" onChange={onChange} />);
    openPicker();
    await waitFor(() => screen.getByRole('listbox', { name: i18n.t('timePicker.hours') }));

    for (const key of ['1', '4', '4', '7']) {
      fireEvent.keyDown(window, { key });
    }

    expect(onChange).toHaveBeenLastCalledWith({ target: { value: '14:47', name: undefined } });
  });
});

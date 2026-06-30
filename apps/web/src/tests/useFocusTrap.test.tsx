import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from '../lib/useFocusTrap';

function Harness({ active, onEscape }: { active: boolean; onEscape?: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>(active, onEscape ? { onEscape } : {});
  return (
    <>
      <button type="button" data-testid="outside">
        outside
      </button>
      {active && (
        <div ref={ref} role="dialog" aria-modal="true">
          <button type="button" data-testid="first">
            first
          </button>
          <button type="button" data-testid="mid">
            mid
          </button>
          <button type="button" data-testid="last">
            last
          </button>
        </div>
      )}
    </>
  );
}

describe('useFocusTrap', () => {
  it('moves focus to the first focusable when activated', async () => {
    const { getByTestId } = render(<Harness active />);
    await waitFor(() => expect(document.activeElement).toBe(getByTestId('first')));
  });

  it('wraps Tab from the last element back to the first', async () => {
    const { getByTestId } = render(<Harness active />);
    const last = getByTestId('last');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('wraps Shift+Tab from the first element to the last', async () => {
    const { getByTestId } = render(<Harness active />);
    const first = getByTestId('first');
    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(getByTestId('last'));
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    render(<Harness active onEscape={onEscape} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the previously focused element on deactivation', async () => {
    const { getByTestId, rerender } = render(<Harness active={false} />);
    const outside = getByTestId('outside');
    outside.focus();
    expect(document.activeElement).toBe(outside);

    rerender(<Harness active />);
    await waitFor(() => expect(document.activeElement).toBe(getByTestId('first')));

    rerender(<Harness active={false} />);
    expect(document.activeElement).toBe(outside);
  });
});

import { describe, expect, it, vi } from 'vitest';
import {
  getPaletteMotionProps,
  handlePaletteKeyDown,
  invokeAsyncCommand,
  isDesktopViewport,
} from './command-palette-helpers';

describe('command-palette-helpers', () => {
  it('returns motion props for reduced motion', () => {
    expect(getPaletteMotionProps(true)).toEqual({
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    });
  });

  it('returns motion props for full motion', () => {
    const props = getPaletteMotionProps(false);
    expect(props.initial).toEqual({ opacity: 0, scale: 0.95, y: -20 });
  });

  it('handles arrow and enter keys', () => {
    const setSelectedIndex = vi.fn();
    const runCommand = vi.fn().mockResolvedValue(undefined);

    handlePaletteKeyDown(
      { key: 'ArrowDown', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      {
        isOpen: true,
        commandCount: 3,
        clampedIndex: 0,
        setSelectedIndex,
        runCommand,
      },
    );
    expect(setSelectedIndex).toHaveBeenCalled();

    handlePaletteKeyDown({ key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent, {
      isOpen: true,
      commandCount: 3,
      clampedIndex: 1,
      setSelectedIndex,
      runCommand,
    });
    expect(runCommand).toHaveBeenCalledWith(1);
  });

  it('handles Home, End, PageUp, PageDown keys', () => {
    const setSelectedIndex = vi.fn();
    const runCommand = vi.fn().mockResolvedValue(undefined);
    const base = {
      isOpen: true,
      commandCount: 20,
      clampedIndex: 5,
      setSelectedIndex,
      runCommand,
    };

    handlePaletteKeyDown(
      { key: 'Home', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      base,
    );
    expect(setSelectedIndex).toHaveBeenLastCalledWith(0);

    handlePaletteKeyDown({ key: 'End', preventDefault: vi.fn() } as unknown as KeyboardEvent, base);
    expect(setSelectedIndex).toHaveBeenLastCalledWith(19);

    handlePaletteKeyDown(
      { key: 'PageDown', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      base,
    );
    let updater = setSelectedIndex.mock.calls[setSelectedIndex.mock.calls.length - 1][0] as (
      prev: number,
    ) => number;
    expect(updater(5)).toBe(13);

    handlePaletteKeyDown(
      { key: 'PageUp', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      base,
    );
    updater = setSelectedIndex.mock.calls[setSelectedIndex.mock.calls.length - 1][0] as (
      prev: number,
    ) => number;
    expect(updater(5)).toBe(0);
  });

  it('toggles favorite on Ctrl/Cmd+D', () => {
    const setSelectedIndex = vi.fn();
    const runCommand = vi.fn().mockResolvedValue(undefined);
    const onToggleFavorite = vi.fn();

    handlePaletteKeyDown(
      { key: 'd', ctrlKey: true, preventDefault: vi.fn() } as unknown as KeyboardEvent,
      {
        isOpen: true,
        commandCount: 3,
        clampedIndex: 0,
        selectedCommandId: 'cmd-1',
        setSelectedIndex,
        runCommand,
        onToggleFavorite,
      },
    );
    expect(onToggleFavorite).toHaveBeenCalledWith('cmd-1');
  });

  it('ignores keys when palette is closed', () => {
    const setSelectedIndex = vi.fn();
    handlePaletteKeyDown(
      { key: 'ArrowDown', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      {
        isOpen: false,
        commandCount: 3,
        clampedIndex: 0,
        setSelectedIndex,
        runCommand: vi.fn(),
      },
    );
    expect(setSelectedIndex).not.toHaveBeenCalled();
  });

  it('swallows rejected async commands', async () => {
    const run = vi.fn().mockRejectedValue(new Error('fail'));
    invokeAsyncCommand(run, 0);
    await Promise.resolve();
    expect(run).toHaveBeenCalledWith(0);
  });

  it('detects desktop viewport when matchMedia matches', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('window', { matchMedia });
    expect(isDesktopViewport()).toBe(true);
    vi.unstubAllGlobals();
  });
});

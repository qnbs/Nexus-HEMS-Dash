import { describe, it, expect, vi } from 'vitest';
import { triggerHaptic, isHapticSupported, hapticClick, hapticSuccess } from '../lib/haptics';

describe('Haptic Feedback', () => {
  it('should check haptic support', () => {
    const supported = isHapticSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('should not throw when triggering haptic on unsupported device', () => {
    const mockNavigator = { vibrate: undefined };
    Object.defineProperty(global, 'navigator', { value: mockNavigator, writable: true });

    expect(() => triggerHaptic('light')).not.toThrow();
    expect(() => hapticClick()).not.toThrow();
    expect(() => hapticSuccess()).not.toThrow();
  });

  it('should call vibrate when supported', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(global.navigator, 'vibrate', { value: vibrateMock, writable: true });

    triggerHaptic('medium');
    expect(vibrateMock).toHaveBeenCalled();
  });
});

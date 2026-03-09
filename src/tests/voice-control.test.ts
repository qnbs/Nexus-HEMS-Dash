import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SpeechSynthesisUtterance which doesn't exist in jsdom
class MockUtterance {
  lang = '';
  rate = 1;
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}
global.SpeechSynthesisUtterance = MockUtterance as unknown as typeof SpeechSynthesisUtterance;

import { VoiceController } from '../lib/voice-control';

describe('VoiceController', () => {
  let controller: VoiceController;

  beforeEach(() => {
    controller = new VoiceController();
  });

  it('should start with offline mode disabled', () => {
    expect(controller.isOffline).toBe(false);
  });

  it('should start inactive', () => {
    expect(controller.isActive()).toBe(false);
  });

  it('should register and execute commands via processText', () => {
    const action = vi.fn();
    controller.registerCommand({
      command: 'dashboard',
      action,
      aliases: ['startseite', 'home'],
    });

    // Mock speechSynthesis to avoid errors
    window.speechSynthesis = { speak: vi.fn() } as unknown as SpeechSynthesis;

    const matched = controller.processText('zeige dashboard');
    expect(matched).toBe(true);
    expect(action).toHaveBeenCalledOnce();
  });

  it('should match aliases', () => {
    const action = vi.fn();
    controller.registerCommand({
      command: 'settings',
      action,
      aliases: ['einstellungen', 'konfiguration'],
    });

    window.speechSynthesis = { speak: vi.fn() } as unknown as SpeechSynthesis;

    const matched = controller.processText('öffne einstellungen');
    expect(matched).toBe(true);
    expect(action).toHaveBeenCalledOnce();
  });

  it('should return false for unrecognized commands', () => {
    window.speechSynthesis = { speak: vi.fn() } as unknown as SpeechSynthesis;

    const matched = controller.processText('random gibberish');
    expect(matched).toBe(false);
  });

  it('should register default commands without throwing', () => {
    expect(() =>
      controller.registerDefaultCommands({
        onNavigate: vi.fn(),
        onToggleTheme: vi.fn(),
        onToggleLanguage: vi.fn(),
        onToggleEV: vi.fn(),
      }),
    ).not.toThrow();
  });
});

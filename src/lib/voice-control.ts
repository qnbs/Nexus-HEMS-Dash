/**
 * Voice Control using Web Speech API
 * Enables hands-free dashboard control
 */

export interface VoiceCommand {
  command: string;
  action: () => void;
  aliases: string[];
}

export class VoiceController {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private commands: VoiceCommand[] = [];

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'de-DE';

      this.recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        this.processCommand(transcript);
      };

      this.recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
      };
    }
  }

  registerCommand(command: VoiceCommand): void {
    this.commands.push(command);
  }

  registerDefaultCommands(callbacks: {
    onNavigate: (page: string) => void;
    onToggleTheme: () => void;
    onToggleLanguage: () => void;
    onToggleEV: () => void;
  }): void {
    this.registerCommand({
      command: 'dashboard',
      action: () => callbacks.onNavigate('/'),
      aliases: ['startseite', 'home', 'übersicht'],
    });

    this.registerCommand({
      command: 'einstellungen',
      action: () => callbacks.onNavigate('/settings'),
      aliases: ['settings', 'konfiguration', 'optionen'],
    });

    this.registerCommand({
      command: 'hilfe',
      action: () => callbacks.onNavigate('/help'),
      aliases: ['help', 'dokumentation', 'info'],
    });

    this.registerCommand({
      command: 'theme wechseln',
      action: callbacks.onToggleTheme,
      aliases: ['design ändern', 'farbe wechseln', 'toggle theme'],
    });

    this.registerCommand({
      command: 'sprache wechseln',
      action: callbacks.onToggleLanguage,
      aliases: ['language', 'toggle language', 'deutsch', 'englisch'],
    });

    this.registerCommand({
      command: 'auto laden',
      action: callbacks.onToggleEV,
      aliases: ['elektroauto laden', 'ev laden', 'charge car', 'wallbox an'],
    });
  }

  private processCommand(transcript: string): void {
    console.log('Voice command:', transcript);

    for (const cmd of this.commands) {
      if (
        transcript.includes(cmd.command) ||
        cmd.aliases.some((alias) => transcript.includes(alias))
      ) {
        this.speak(`Befehl erkannt: ${cmd.command}`);
        cmd.action();
        return;
      }
    }

    this.speak('Befehl nicht verstanden.');
  }

  start(): void {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
      console.log('Voice control activated');
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('Voice control deactivated');
    }
  }

  speak(text: string): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  isActive(): boolean {
    return this.isListening;
  }
}

// Browser type augmentation
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

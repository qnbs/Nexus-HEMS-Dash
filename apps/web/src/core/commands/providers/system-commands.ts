import { Keyboard, Star } from 'lucide-react';
import type { CommandDefinition } from '../types';
import { navigateAndClose } from './provider-utils';

export function createSystemCommands(): CommandDefinition[] {
  return [
    {
      id: 'system.showShortcuts',
      labelKey: 'command.showShortcuts',
      icon: Keyboard,
      category: 'system',
      risk: 'safe',
      keywords: ['keyboard', 'shortcuts', 'help', 'tastatur'],
      source: 'core',
      execute: (ctx) => navigateAndClose(ctx, '/help?tab=shortcuts'),
    },
    {
      id: 'system.toggleFavorite',
      labelKey: 'command.toggleFavorite',
      icon: Star,
      category: 'system',
      risk: 'safe',
      keywords: ['favorite', 'pin', 'star', 'favorit'],
      source: 'core',
      when: () => false, // invoked via modifier in palette UI — not listed
      execute: () => {
        /* handled in palette */
      },
    },
  ];
}

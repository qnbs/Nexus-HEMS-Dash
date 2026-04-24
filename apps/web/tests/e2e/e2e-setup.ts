/**
 * Shared E2E setup: dismiss onboarding + all page tours in localStorage.
 * Call this inside addInitScript() in every test's beforeEach.
 */
export function setupLocalStorage(): void {
  localStorage.setItem(
    'nexus-hems-store',
    JSON.stringify({ state: { onboardingCompleted: true }, version: 0 }),
  );
  // Dismiss all page tours so overlays don't block interactions
  const tourIds = [
    'command-hub',
    'live-energy-flow',
    'devices-automation',
    'optimization-ai',
    'settings',
    'analytics',
    'monitoring',
  ];
  for (const id of tourIds) {
    localStorage.setItem(`nexus-tour-${id}`, '1');
  }
}

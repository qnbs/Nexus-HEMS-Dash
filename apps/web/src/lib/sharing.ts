/**
 * Multi-Household Dashboard Sharing
 * Enables shareable dashboards for community energy projects
 */

export interface SharedDashboard {
  id: string;
  name: string;
  ownerEmail: string;
  permissions: 'view' | 'control' | 'admin';
  shareToken: string;
  expiresAt: Date | null;
  households: string[];
}

export interface ShareInvitation {
  dashboardId: string;
  inviteEmail: string;
  permissions: 'view' | 'control';
  expiresInDays: number;
}

/**
 * Client-side storage shape for demo / offline mode.
 * In production all of this lives server-side; only the minimal ref is
 * sent to localStorage in connected mode (MED-06).
 */
interface StoredDashboard {
  id: string;
  name: string;
  ownerEmail: string;
  permissions: 'view' | 'control' | 'admin';
  /** Demo/offline only — production validates server-side (HIGH-02) */
  shareToken: string;
  households: string[];
}

/**
 * Returns the app's base URL including the deployment base path (e.g. /Nexus-HEMS-Dash/)
 */
function getAppBaseUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const origin = window.location.origin;
  // Ensure no double slashes
  return `${origin}${base.endsWith('/') ? base.slice(0, -1) : base}`;
}

/**
 * Generates a shareable link for the dashboard
 */
export function generateShareLink(dashboardId: string, token: string): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/?shared=${encodeURIComponent(dashboardId)}&token=${encodeURIComponent(token)}`;
}

/**
 * Attempts to share via the Web Share API, returns true if shared, false if not available
 */
export async function shareViaWebShare(title: string, url: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url });
      return true;
    } catch {
      // User cancelled or share failed
      return false;
    }
  }
  return false;
}

/**
 * HIGH-02: Timing-safe string comparison to prevent remote timing attacks on share tokens.
 * Always iterates over the full length of both strings.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const maxLen = Math.max(aBytes.length, bBytes.length);
  // Pad both to the same length to prevent early-exit on length mismatch
  const aPad = new Uint8Array(maxLen);
  const bPad = new Uint8Array(maxLen);
  aPad.set(aBytes);
  bPad.set(bBytes);
  // XOR all bytes — accumulate differences without branching
  let diff = aBytes.length ^ bBytes.length; // non-zero if lengths differ
  for (let i = 0; i < maxLen; i++) diff |= aPad[i] ^ bPad[i];
  return diff === 0;
}

/**
 * Creates a new shared dashboard and persists it locally for demo/offline mode.
 * Production: full data is stored server-side; only a minimal ref lives in localStorage (MED-06).
 */
export async function createSharedDashboard(
  name: string,
  ownerEmail: string,
): Promise<SharedDashboard> {
  const shareToken = generateToken();
  const dashboard: SharedDashboard = {
    id: generateId(),
    name,
    ownerEmail,
    permissions: 'admin',
    shareToken,
    expiresAt: null,
    households: [ownerEmail],
  };

  const stored: StoredDashboard = {
    id: dashboard.id,
    name: dashboard.name,
    ownerEmail: dashboard.ownerEmail,
    permissions: dashboard.permissions,
    shareToken: dashboard.shareToken,
    households: dashboard.households,
  };
  localStorage.setItem(`shared-dashboard-${dashboard.id}`, JSON.stringify(stored));

  return dashboard;
}

/**
 * Sends invitation to join shared dashboard
 */
export async function sendShareInvitation(invitation: ShareInvitation): Promise<boolean> {
  // In production, send email via backend
  const inviteLink = generateShareLink(invitation.dashboardId, generateToken());
  void inviteLink; // will be used when backend email service is implemented

  return true;
}

/**
 * Validates and joins shared dashboard.
 * HIGH-02: Uses constant-time token comparison to prevent timing attacks.
 * Demo/offline mode stores state locally; production validates server-side.
 */
export async function joinSharedDashboard(
  dashboardId: string,
  token: string,
  userEmail: string,
): Promise<SharedDashboard | null> {
  const raw = localStorage.getItem(`shared-dashboard-${dashboardId}`);
  if (!raw) return null;

  const stored: StoredDashboard = JSON.parse(raw) as StoredDashboard;

  // HIGH-02: Constant-time token comparison
  if (!timingSafeEqual(stored.shareToken, token)) {
    throw new Error('Invalid share token');
  }

  // Deduplicate: only add the user if not already a member
  if (!stored.households.includes(userEmail)) {
    stored.households = [...stored.households, userEmail];
    localStorage.setItem(`shared-dashboard-${dashboardId}`, JSON.stringify(stored));
  }

  return {
    id: stored.id,
    name: stored.name,
    ownerEmail: stored.ownerEmail,
    permissions: stored.permissions,
    shareToken: stored.shareToken,
    expiresAt: null,
    households: stored.households,
  };
}

/**
 * Validates a share token in a server-side context (or offline demo mode).
 * HIGH-02: Uses constant-time comparison.
 */
export function validateShareToken(dashboard: SharedDashboard, token: string): boolean {
  if (!dashboard.shareToken) return false;
  // HIGH-02: Timing-safe comparison prevents remote timing attacks
  return timingSafeEqual(dashboard.shareToken, token);
}

/**
 * Lists all dashboards the given user is a member of (owner or joined).
 */
export async function listSharedDashboards(userEmail: string): Promise<StoredDashboard[]> {
  const dashboards: StoredDashboard[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('shared-dashboard-')) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const entry: StoredDashboard = JSON.parse(raw) as StoredDashboard;
          if (entry.households.includes(userEmail)) {
            dashboards.push(entry);
          }
        } catch {
          // Skip malformed entries
        }
      }
    }
  }

  return dashboards;
}

/**
 * Revokes access to shared dashboard (removes local entry)
 */
export async function revokeAccess(dashboardId: string, _userEmail: string): Promise<void> {
  localStorage.removeItem(`shared-dashboard-${dashboardId}`);
  // In production, also call backend revocation endpoint
}

// Helper functions — use crypto.getRandomValues for secure token generation
function generateToken(): string {
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 24);
}

function generateId(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  const suffix = Array.from(array, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 9);
  return `dash-${Date.now()}-${suffix}`;
}

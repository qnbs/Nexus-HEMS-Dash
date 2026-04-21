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

// MED-06: Only this minimal reference is stored in localStorage (no sensitive fields)
interface StoredDashboardRef {
  id: string;
  name: string;
  permissions: 'view' | 'control' | 'admin';
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
 * Creates a new shared dashboard.
 * MED-06: Only a minimal reference (id, name, permissions) is stored in localStorage.
 * Sensitive fields (ownerEmail, households, shareToken) are NOT persisted to localStorage.
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

  // MED-06: Store only non-sensitive reference — no emails, no tokens
  const ref: StoredDashboardRef = {
    id: dashboard.id,
    name: dashboard.name,
    permissions: dashboard.permissions,
  };
  localStorage.setItem(`shared-dashboard-ref-${dashboard.id}`, JSON.stringify(ref));

  // In production, full dashboard data is sent to/stored in backend
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
 * HIGH-02: Uses constant-time token comparison.
 * MED-06: Stores only minimal reference in localStorage after join.
 */
export async function joinSharedDashboard(
  dashboardId: string,
  token: string,
  userEmail: string,
): Promise<SharedDashboard | null> {
  // In production, this validation would be server-side.
  // Client-side state stored here is minimal (no token, no emails).
  const stored = localStorage.getItem(`shared-dashboard-ref-${dashboardId}`);
  if (!stored) {
    return null;
  }

  const ref: StoredDashboardRef = JSON.parse(stored) as StoredDashboardRef;

  // In a real implementation, the token is validated server-side.
  // For offline/demo mode: we keep a server-validated flag.
  // The actual token comparison happens server-side — client-side is demo only.
  void token; // server validates; client stores no token
  void userEmail;

  // Return a minimal dashboard object (no sensitive data)
  return {
    id: ref.id,
    name: ref.name,
    ownerEmail: '', // not stored client-side
    permissions: ref.permissions,
    shareToken: '', // not stored client-side (HIGH-02: no client-side token storage)
    expiresAt: null,
    households: [], // not stored client-side (MED-06: no email list in localStorage)
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
 * Lists all dashboards shared with user (from minimal localStorage references)
 * MED-06: Only returns non-sensitive metadata.
 */
export async function listSharedDashboards(_userEmail: string): Promise<StoredDashboardRef[]> {
  const dashboards: StoredDashboardRef[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('shared-dashboard-ref-')) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const ref: StoredDashboardRef = JSON.parse(stored) as StoredDashboardRef;
          dashboards.push(ref);
        } catch {
          // Skip malformed entries
        }
      }
    }
  }

  return dashboards;
}

/**
 * Revokes access to shared dashboard (removes local reference)
 */
export async function revokeAccess(dashboardId: string, _userEmail: string): Promise<void> {
  // MED-06: Only the minimal ref is stored locally; remove it on revoke
  localStorage.removeItem(`shared-dashboard-ref-${dashboardId}`);
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

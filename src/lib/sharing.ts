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
 * Creates a new shared dashboard
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

  // In production, store in backend
  localStorage.setItem(`shared-dashboard-${dashboard.id}`, JSON.stringify(dashboard));
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
 * Validates and joins shared dashboard
 */
export async function joinSharedDashboard(
  dashboardId: string,
  token: string,
  userEmail: string,
): Promise<SharedDashboard | null> {
  const stored = localStorage.getItem(`shared-dashboard-${dashboardId}`);
  if (!stored) {
    return null;
  }

  const dashboard: SharedDashboard = JSON.parse(stored);

  if (dashboard.shareToken !== token) {
    throw new Error('Invalid share token');
  }

  if (dashboard.expiresAt && new Date() > dashboard.expiresAt) {
    throw new Error('Share link expired');
  }

  // Add user to households
  if (!dashboard.households.includes(userEmail)) {
    dashboard.households.push(userEmail);
    localStorage.setItem(`shared-dashboard-${dashboardId}`, JSON.stringify(dashboard));
  }

  return dashboard;
}

/**
 * Lists all dashboards shared with user
 */
export async function listSharedDashboards(userEmail: string): Promise<SharedDashboard[]> {
  const dashboards: SharedDashboard[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('shared-dashboard-')) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const dashboard: SharedDashboard = JSON.parse(stored);
        if (dashboard.households.includes(userEmail)) {
          dashboards.push(dashboard);
        }
      }
    }
  }

  return dashboards;
}

/**
 * Revokes access to shared dashboard
 */
export async function revokeAccess(dashboardId: string, userEmail: string): Promise<void> {
  const stored = localStorage.getItem(`shared-dashboard-${dashboardId}`);
  if (!stored) {
    throw new Error('Dashboard not found');
  }

  const dashboard: SharedDashboard = JSON.parse(stored);
  dashboard.households = dashboard.households.filter((email) => email !== userEmail);
  localStorage.setItem(`shared-dashboard-${dashboardId}`, JSON.stringify(dashboard));
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

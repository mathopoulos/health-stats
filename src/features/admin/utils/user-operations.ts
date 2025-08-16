import type { UserData, AdminStats } from '../types';
import { DELETE_CONFIRMATION_PREFIX } from './admin-constants';

export function calculateAdminStats(users: UserData[]): AdminStats {
  return {
    totalUsers: users.length,
    publishedDashboards: users.filter(u => u.dashboardPublished).length,
    totalBloodMarkers: users.reduce((sum, u) => sum + u.dataCounts.bloodMarkers, 0),
    totalDataPoints: users.reduce((sum, u) => sum + u.dataCounts.total, 0),
  };
}

export function generateDeleteConfirmationText(user: UserData): string {
  return `${DELETE_CONFIRMATION_PREFIX}${user.name || user.email}`;
}

export function isValidDeleteConfirmation(
  confirmationText: string,
  expectedText: string
): boolean {
  return confirmationText === expectedText;
}

export function getUserDisplayName(user: UserData): string {
  return user.name || 'Unnamed User';
}

export function getUserInitial(user: UserData): string {
  return (user.name || user.email)?.charAt(0)?.toUpperCase() || '?';
}

import { UserStats } from '../types';

const apiUrl = (import.meta as any).env?.VITE_API_URL || '';

export async function getUserSummary(userId: string): Promise<UserStats | null> {
  try {
    const res = await fetch(`${apiUrl}/api/submissions/user/${userId}/summary`);
    const data = await res.json();
    if (!res.ok || !data?.success) return null;
    return data.data as UserStats;
  } catch {
    return null;
  }
}

export async function updateDailyGoal(userId: string, dailyGoal: number): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/api/submissions/user/${userId}/daily-goal`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyGoal }),
    });
    const data = await res.json();
    return Boolean(res.ok && data?.success);
  } catch {
    return false;
  }
}



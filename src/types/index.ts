export interface JaapEntry {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  clickCount: number;
  manualCount: number;
  totalCount: number;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  displayName: string; // "Sevak 1" / "Sevak 2"
  totalJaap: number;
  currentStreak: number;
  dailyTarget: number;
  soundEnabled: boolean;
}

export interface DailyLog {
  type: 'click' | 'manual';
  count: number;
  timestamp: number;
}

export interface DailySummary {
  date: string;
  clickCount: number;
  manualCount: number;
  totalCount: number;
}

export interface Settings {
  dailyTarget: number;
  soundEnabled: boolean;
  displayName: string;
}

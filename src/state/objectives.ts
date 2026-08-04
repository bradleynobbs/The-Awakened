const STORAGE_KEY = "the-awakened:objectives";

interface ObjectivesData {
  dayKey: string;
  matchesPlayedToday: number;
  matchesWonToday: number;
  weekKey: string;
  matchesPlayedWeek: number;
  matchesWonWeek: number;
}

export interface Objective {
  id: string;
  label: string;
  progress: number;
  target: number;
  completed: boolean;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Date string for the Monday of `date`'s week, used as a stable weekly-reset key. */
function weekKey(date: Date): string {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return dayKey(d);
}

function load(): ObjectivesData {
  const now = new Date();
  const currentDayKey = dayKey(now);
  const currentWeekKey = weekKey(now);

  let data: Partial<ObjectivesData> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch {
    data = {};
  }

  const sameDay = data.dayKey === currentDayKey;
  const sameWeek = data.weekKey === currentWeekKey;

  return {
    dayKey: currentDayKey,
    matchesPlayedToday: sameDay ? (data.matchesPlayedToday ?? 0) : 0,
    matchesWonToday: sameDay ? (data.matchesWonToday ?? 0) : 0,
    weekKey: currentWeekKey,
    matchesPlayedWeek: sameWeek ? (data.matchesPlayedWeek ?? 0) : 0,
    matchesWonWeek: sameWeek ? (data.matchesWonWeek ?? 0) : 0,
  };
}

function save(data: ObjectivesData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Call once per finished match (any mode) to update daily/weekly progress. */
export function recordMatchResult(won: boolean): void {
  const data = load();
  data.matchesPlayedToday += 1;
  data.matchesPlayedWeek += 1;
  if (won) {
    data.matchesWonToday += 1;
    data.matchesWonWeek += 1;
  }
  save(data);
}

const DAILY_PLAY_TARGET = 1;
const DAILY_WIN_TARGET = 1;
const WEEKLY_PLAY_TARGET = 5;
const WEEKLY_WIN_TARGET = 3;

export function getObjectives(): { daily: Objective[]; weekly: Objective[] } {
  const data = load();
  const cap = (progress: number, target: number) => Math.min(progress, target);

  return {
    daily: [
      {
        id: "daily-play",
        label: "Play 1 match",
        progress: cap(data.matchesPlayedToday, DAILY_PLAY_TARGET),
        target: DAILY_PLAY_TARGET,
        completed: data.matchesPlayedToday >= DAILY_PLAY_TARGET,
      },
      {
        id: "daily-win",
        label: "Win 1 match",
        progress: cap(data.matchesWonToday, DAILY_WIN_TARGET),
        target: DAILY_WIN_TARGET,
        completed: data.matchesWonToday >= DAILY_WIN_TARGET,
      },
    ],
    weekly: [
      {
        id: "weekly-play",
        label: "Play 5 matches",
        progress: cap(data.matchesPlayedWeek, WEEKLY_PLAY_TARGET),
        target: WEEKLY_PLAY_TARGET,
        completed: data.matchesPlayedWeek >= WEEKLY_PLAY_TARGET,
      },
      {
        id: "weekly-win",
        label: "Win 3 matches",
        progress: cap(data.matchesWonWeek, WEEKLY_WIN_TARGET),
        target: WEEKLY_WIN_TARGET,
        completed: data.matchesWonWeek >= WEEKLY_WIN_TARGET,
      },
    ],
  };
}

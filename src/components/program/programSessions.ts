import { Program, Session, WeekDay, WEEK_DAYS_ORDER } from '../../types';

function findFallbackSessions(program: Program): Session[] {
  const weeks = program.content.weeks ?? [];

  for (const week of weeks) {
    if (Array.isArray(week.sessions) && week.sessions.length > 0) {
      return week.sessions;
    }
  }

  return [];
}

function isValidWeekDay(value: unknown): value is WeekDay {
  return typeof value === 'string' && (WEEK_DAYS_ORDER as string[]).includes(value);
}

export function getProgramSessions(program: Program): Session[] {
  const sourceSessions =
    Array.isArray(program.content.sessions) && program.content.sessions.length > 0
      ? program.content.sessions
      : findFallbackSessions(program);

  const normalized = sourceSessions.map((session, index) => {
    const fallbackDay = WEEK_DAYS_ORDER[index % WEEK_DAYS_ORDER.length];
    const dayOfWeek = isValidWeekDay(session.dayOfWeek) ? session.dayOfWeek : fallbackDay;
    return {
      ...session,
      id: session.id ?? `session-${index + 1}`,
      dayOfWeek,
    };
  });

  normalized.sort(
    (a, b) => WEEK_DAYS_ORDER.indexOf(a.dayOfWeek!) - WEEK_DAYS_ORDER.indexOf(b.dayOfWeek!),
  );

  return normalized.map((session, index) => ({
    ...session,
    recommended: index === 0,
  }));
}

export interface WeeklyScheduleDay {
  dayOfWeek: WeekDay;
  session: Session | null;
}

export function getWeeklySchedule(program: Program): WeeklyScheduleDay[] {
  const sessions = getProgramSessions(program);
  const byDay = new Map<WeekDay, Session>();
  sessions.forEach((session) => {
    if (session.dayOfWeek) {
      byDay.set(session.dayOfWeek, session);
    }
  });

  return WEEK_DAYS_ORDER.map((day) => ({
    dayOfWeek: day,
    session: byDay.get(day) ?? null,
  }));
}

export function getTodayWeekDay(): WeekDay {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 'dimanche' : WEEK_DAYS_ORDER[jsDay - 1];
}

export function getProgramFrequencyLabel(program: Program): string {
  return program.sessionsPerWeek > 0
    ? `${program.sessionsPerWeek} seances / semaine`
    : 'Frequence variable';
}

export const today = (): string => new Date().toISOString().slice(0, 10);

export const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const toISO = (s: string): string | null => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

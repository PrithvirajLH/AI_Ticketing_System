import { getSupabase } from "@/lib/db/supabase";

interface BusinessHoursSchedule {
  [day: string]: { start: string; end: string } | null; // "monday": { start: "09:00", end: "17:00" }
}

interface BusinessHoursSettings {
  timezone: string;
  schedule: BusinessHoursSchedule;
  holidays: string[]; // ISO date strings
}

let cachedSettings: BusinessHoursSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fetch business hours settings from DB (cached for 1 min).
 */
async function getSettings(): Promise<BusinessHoursSettings> {
  if (cachedSettings && Date.now() - cacheTime < CACHE_TTL) return cachedSettings;

  const supabase = getSupabase();
  const { data } = await supabase
    .from("SlaBusinessHoursSetting")
    .select("timezone, schedule, holidays")
    .eq("id", "global")
    .single();

  if (!data) {
    // Default: 24/7 (no business hours restriction)
    cachedSettings = {
      timezone: "UTC",
      schedule: {
        monday: { start: "00:00", end: "23:59" },
        tuesday: { start: "00:00", end: "23:59" },
        wednesday: { start: "00:00", end: "23:59" },
        thursday: { start: "00:00", end: "23:59" },
        friday: { start: "00:00", end: "23:59" },
        saturday: { start: "00:00", end: "23:59" },
        sunday: { start: "00:00", end: "23:59" },
      },
      holidays: [],
    };
  } else {
    cachedSettings = {
      timezone: data.timezone ?? "UTC",
      schedule: (data.schedule as BusinessHoursSchedule) ?? {},
      holidays: (data.holidays as string[]) ?? [],
    };
  }

  cacheTime = Date.now();
  return cachedSettings;
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Calculate the due date by adding business hours to a start time.
 * Respects the business hours schedule and holidays.
 *
 * @param startDate - when the SLA clock starts
 * @param hoursToAdd - number of business hours to add
 * @returns the due date accounting for business hours only
 */
export async function addBusinessHours(startDate: Date, hoursToAdd: number): Promise<Date> {
  const settings = await getSettings();
  const minutesToAdd = hoursToAdd * 60;
  let remainingMinutes = minutesToAdd;
  const current = new Date(startDate);

  // Safety: max 365 days to prevent infinite loop
  for (let safety = 0; safety < 365 * 24 && remainingMinutes > 0; safety++) {
    const dayName = DAYS[current.getDay()];
    const daySchedule = settings.schedule[dayName];
    const dateStr = current.toISOString().slice(0, 10);

    // Skip holidays
    if (settings.holidays.includes(dateStr)) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    // Skip non-working days
    if (!daySchedule) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const [startH, startM] = daySchedule.start.split(":").map(Number);
    const [endH, endM] = daySchedule.end.split(":").map(Number);

    const dayStart = new Date(current);
    dayStart.setHours(startH, startM, 0, 0);

    const dayEnd = new Date(current);
    dayEnd.setHours(endH, endM, 0, 0);

    // If current time is before business hours start, fast-forward to start
    if (current < dayStart) {
      current.setHours(startH, startM, 0, 0);
    }

    // If current time is after business hours end, skip to next day
    if (current >= dayEnd) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    // Calculate available minutes in current day
    const availableMinutes = (dayEnd.getTime() - current.getTime()) / 60000;

    if (remainingMinutes <= availableMinutes) {
      // Done — add remaining minutes
      current.setTime(current.getTime() + remainingMinutes * 60000);
      remainingMinutes = 0;
    } else {
      // Consume this day and move to next
      remainingMinutes -= availableMinutes;
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
  }

  return current;
}

/**
 * Calculate elapsed business hours between two dates.
 */
export async function getElapsedBusinessHours(start: Date, end: Date): Promise<number> {
  const settings = await getSettings();
  let totalMinutes = 0;
  const current = new Date(start);

  for (let safety = 0; safety < 365 * 24 && current < end; safety++) {
    const dayName = DAYS[current.getDay()];
    const daySchedule = settings.schedule[dayName];
    const dateStr = current.toISOString().slice(0, 10);

    if (settings.holidays.includes(dateStr) || !daySchedule) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const [startH, startM] = daySchedule.start.split(":").map(Number);
    const [endH, endM] = daySchedule.end.split(":").map(Number);

    const dayStart = new Date(current);
    dayStart.setHours(startH, startM, 0, 0);

    const dayEnd = new Date(current);
    dayEnd.setHours(endH, endM, 0, 0);

    const effectiveStart = current < dayStart ? dayStart : current;
    const effectiveEnd = end < dayEnd ? end : dayEnd;

    if (effectiveStart < effectiveEnd) {
      totalMinutes += (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000;
    }

    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return totalMinutes / 60;
}

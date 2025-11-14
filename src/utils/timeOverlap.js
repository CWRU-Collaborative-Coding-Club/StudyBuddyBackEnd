/**
 * Check if two availability arrays overlap.
 *
 * Example input format:
 * const availabilityA = ["Mon 14:00-16:00", "Wed 10:00-12:00"];
 * const availabilityB = ["Mon 15:00-17:00", "Thu 09:00-11:00"];
 *
 * Returns true if any overlap exists, false otherwise.
 */
export const hasOverlap = (availabilityA, availabilityB) => {
  if (!availabilityA || !availabilityB) return false;

  const parseTime = (slot) => {
    // Example slot: "Mon 14:00-16:00"
    const [day, timeRange] = slot.split(" ");
    const [start, end] = timeRange.split("-").map((t) => t.trim());
    return { day, start: timeToMinutes(start), end: timeToMinutes(end) };
  };

  const timeToMinutes = (timeStr) => {
    // "14:30" -> 870
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  for (const slotA of availabilityA) {
    const a = parseTime(slotA);
    for (const slotB of availabilityB) {
      const b = parseTime(slotB);
      if (a.day === b.day && Math.max(a.start, b.start) < Math.min(a.end, b.end)) {
        return true; // overlap found
      }
    }
  }

  return false;
};

/**
 * Returns the overlapping time ranges between two users’ availability.
 * Optional utility if you want to show suggested meeting times.
 */
export const getOverlapSlots = (availabilityA, availabilityB) => {
  const parseTime = (slot) => {
    const [day, timeRange] = slot.split(" ");
    const [start, end] = timeRange.split("-").map((t) => t.trim());
    return { day, start: timeToMinutes(start), end: timeToMinutes(end) };
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  const overlaps = [];

  for (const slotA of availabilityA) {
    const a = parseTime(slotA);
    for (const slotB of availabilityB) {
      const b = parseTime(slotB);
      if (a.day === b.day && Math.max(a.start, b.start) < Math.min(a.end, b.end)) {
        overlaps.push({
          day: a.day,
          start: minutesToTime(Math.max(a.start, b.start)),
          end: minutesToTime(Math.min(a.end, b.end)),
        });
      }
    }
  }

  return overlaps;
};
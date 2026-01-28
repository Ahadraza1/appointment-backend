const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// ✅ slot ka start OR end agar break me aaye → reject
const isSlotInBreak = (slotStart, slotEnd, breaks = []) => {
  return breaks.some((b) => {
    const breakStart = timeToMinutes(b.start);
    const breakEnd = timeToMinutes(b.end);

    return (
      (slotStart >= breakStart && slotStart < breakEnd) ||
      (slotEnd > breakStart && slotEnd <= breakEnd) ||
      (slotStart <= breakStart && slotEnd >= breakEnd)
    );
  });
};

const generateSlots = (
  startTime,
  endTime,
  duration,
  breaks = []
) => {
  const slots = [];

  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + duration <= end) {
    const slotStart = current;
    const slotEnd = current + duration;

    // ✅ break ke andar hai → skip
    if (!isSlotInBreak(slotStart, slotEnd, breaks)) {
      slots.push(
        `${minutesToTime(slotStart)} - ${minutesToTime(slotEnd)}`
      );
    }

    current += duration;
  }

  return slots;
};

export default generateSlots;

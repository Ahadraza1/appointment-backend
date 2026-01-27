const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const isInBreak = (time, breaks) => {
  return breaks.some(
    (b) =>
      time >= timeToMinutes(b.start) &&
      time < timeToMinutes(b.end)
  );
};

const generateSlots = (startTime, endTime, duration, breaks = []) => {
  const slots = [];
  let start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (start + duration <= end) {
    if (!isInBreak(start, breaks)) {
      const slot = `${minutesToTime(start)} - ${minutesToTime(start + duration)}`;
      slots.push(slot);
    }
    start += duration;
  }

  return slots;
};

export default generateSlots;

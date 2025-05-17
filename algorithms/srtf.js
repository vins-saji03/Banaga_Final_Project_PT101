export function calculateSRTF(processes) {
  const n = processes.length;

  const remaining = processes.map((p) => ({
    ...p,
    remaining: p.burst,
    start: null,
    end: null,
  }));

  const completed = [];
  const ganttChart = [];

  let currentTime = 0;
  let totalIdle = 0;
  let lastProcessLabel = null;
  let lastSlice = null;

  // Accumulate idle periods
  let idleStart = null;
  let idleEnd = null;

  while (completed.length < n) {
    const available = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)
      .sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);

    const queueBeforeRun = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)
      .sort((a, b) => a.arrival - b.arrival)
      .map((p) => ({
        process: p.process,
        priority: p.priority || null,
      }));

    if (available.length === 0) {
      const futureArrivals = remaining.filter(
        (p) => p.remaining > 0 && p.arrival > currentTime
      );

      const nextArrival = Math.min(...futureArrivals.map((p) => p.arrival));
      totalIdle += nextArrival - currentTime;

      // Merge idle time
      if (idleStart === null) {
        idleStart = currentTime;
      }
      idleEnd = nextArrival;

      currentTime = nextArrival;
      lastProcessLabel = null;
      lastSlice = null;
      continue;
    }

    // Flush merged idle time before proceeding
    if (idleStart !== null && idleEnd !== null) {
      ganttChart.push({
        label: "i",
        start: idleStart,
        end: idleEnd,
        burstUsed: idleEnd - idleStart,
        rbt: null,
        queue: [],
        arrived: remaining
          .filter((p) => p.arrival > idleStart && p.arrival <= idleEnd)
          .map((p) => ({ process: p.process, priority: p.priority || null })),
      });
      idleStart = null;
      idleEnd = null;
    }

    const current = available[0];
    if (current.start === null) current.start = currentTime;

    const isNewSlice = lastProcessLabel !== current.process;

    if (isNewSlice || !lastSlice) {
      lastSlice = {
        label: current.process,
        start: currentTime,
        end: currentTime + 1,
        queue: queueBeforeRun,
        rbt: current.remaining - 1,
        burstUsed: 1,
      };
      ganttChart.push(lastSlice);
    } else {
      lastSlice.end++;
      lastSlice.burstUsed++;
      lastSlice.rbt = current.remaining - 1;
    }

    current.remaining--;
    currentTime++;
    lastProcessLabel = current.process;

    if (current.remaining === 0) {
      current.end = currentTime;
      const turnaround = current.end - current.arrival;
      const waiting = turnaround - current.burst;
      completed.push({
        ...current,
        completion: current.end,
        turnaround,
        waiting,
      });
      lastSlice = null;
    }
  }

  return {
    result: completed,
    ganttChart,
    totalTime: currentTime,
    totalIdle,
  };
}

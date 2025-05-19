export function calculatePP(processes) {
  const n = processes.length;

  const remaining = [...processes]
    .sort((a, b) => a.arrival - b.arrival)
    .map((p) => ({
      ...p,
      remaining: p.burst,
      start: null,
      end: null,
    }));

  const completed = [];
  const ganttChart = [];

  let currentTime = 0;
  let totalIdle = 0;

  while (completed.length < n) {
    const available = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.arrival - b.arrival;
      });

    const allArrived = remaining.every((p) => p.arrival <= currentTime);

    if (available.length === 0) {
      const nextArrival = remaining
        .filter((p) => p.remaining > 0)
        .sort((a, b) => a.arrival - b.arrival)[0]?.arrival;

      if (nextArrival !== undefined && nextArrival > currentTime) {
        ganttChart.push({
          label: "i",
          start: currentTime,
          end: nextArrival,
          queue: [],
          arrived: remaining
            .filter((p) => p.arrival <= nextArrival && p.remaining > 0)
            .map((p) => ({
              process: p.process,
              priority: p.priority,
              arrival: p.arrival,
              rbt: p.remaining,
            })),
          rbt: null,
        });

        totalIdle += nextArrival - currentTime;
        currentTime = nextArrival;
        continue;
      } else {
        break;
      }
    }

    const current = available[0];
    if (current.start === null) current.start = currentTime;

    const start = currentTime;
    let executionTime = 1;

    if (allArrived) {
      // Run to completion
      executionTime = current.remaining;
    }

    current.remaining -= executionTime;
    currentTime += executionTime;
    const end = currentTime;

    const queueSnapshot = remaining
      .filter((p) => p.arrival <= currentTime && p.remaining > 0)
      .sort((a, b) => a.arrival - b.arrival)
      .map((p) => ({
        process: p.process,
        priority: p.priority,
        arrival: p.arrival,
        rbt: p.remaining,
      }));

    const lastGantt = ganttChart[ganttChart.length - 1];
    if (
      lastGantt &&
      lastGantt.label === current.process &&
      lastGantt.end === start
    ) {
      lastGantt.end = end;
      lastGantt.rbt = current.remaining;
      lastGantt.queue = queueSnapshot;
    } else {
      ganttChart.push({
        label: current.process,
        start,
        end,
        queue: queueSnapshot,
        rbt: current.remaining,
      });
    }

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
    }
  }

  return {
    result: completed,
    ganttChart,
    totalTime: currentTime,
    totalIdle,
  };
}

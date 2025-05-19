export function calculateSRTF(processes) {
  const ganttChart = [];
  const completed = [];

  const remaining = processes.map((p) => ({
    ...p,
    remaining: p.burst,
    start: null,
    end: null,
  }));

  let currentTime = 0;
  let totalIdle = 0;

  while (completed.length < processes.length) {
    const arrivedProcesses = remaining.filter(
      (p) => p.arrival <= currentTime && p.remaining > 0
    );

    if (arrivedProcesses.length === 0) {
      // CPU is idle
      const nextArrival = Math.min(
        ...remaining.filter((p) => p.remaining > 0).map((p) => p.arrival)
      );

      ganttChart.push({
        label: "i",
        start: currentTime,
        end: nextArrival,
        queue: [],
        arrived: [],
        rbt: null,
      });

      totalIdle += nextArrival - currentTime;
      currentTime = nextArrival;
      continue;
    }

    const allArrived = remaining.every((p) => p.arrival <= currentTime);

    if (!allArrived) {
      // Preemptive SRTF: run for 1 time unit
      const currentProc = arrivedProcesses.sort(
        (a, b) => a.remaining - b.remaining || a.arrival - b.arrival
      )[0];

      if (currentProc.start === null) currentProc.start = currentTime;

      const start = currentTime;
      currentProc.remaining--;
      currentTime++;
      const end = currentTime;

      const queueSnapshot = remaining
        .filter((p) => p.arrival <= currentTime && p.remaining > 0)
        .sort((a, b) => a.arrival - b.arrival)
        .map((p) => ({
          process: p.process,
          priority: p.priority || null,
          arrival: p.arrival,
          rbt: p.remaining,
        }));

      const lastGantt = ganttChart[ganttChart.length - 1];
      if (
        lastGantt &&
        lastGantt.label === currentProc.process &&
        lastGantt.end === start
      ) {
        lastGantt.end = end;
        lastGantt.rbt = currentProc.remaining;
        lastGantt.queue = queueSnapshot;
      } else {
        ganttChart.push({
          label: currentProc.process,
          start,
          end,
          queue: queueSnapshot,
          arrived: [],
          rbt: currentProc.remaining,
        });
      }

      if (currentProc.remaining === 0) {
        currentProc.end = currentTime;
        const turnaround = currentProc.end - currentProc.arrival;
        const waiting = turnaround - currentProc.burst;
        completed.push({
          ...currentProc,
          completion: currentProc.end,
          turnaround,
          waiting,
        });
      }
    } else {
      // All have arrived — switch to non-preemptive SJF
      const currentProc = arrivedProcesses.sort(
        (a, b) => a.remaining - b.remaining || a.arrival - b.arrival
      )[0];

      if (currentProc.start === null) currentProc.start = currentTime;

      const start = currentTime;
      const runTime = currentProc.remaining;
      const end = currentTime + runTime;

      const queueSnapshot = remaining
        .filter((p) => p.arrival <= currentTime && p.remaining > 0)
        .sort((a, b) => a.arrival - b.arrival)
        .map((p) => ({
          process: p.process,
          priority: p.priority || null,
          arrival: p.arrival,
          rbt: p.remaining,
        }));

      ganttChart.push({
        label: currentProc.process,
        start,
        end,
        queue: queueSnapshot,
        arrived: [],
        rbt: 0,
      });

      currentTime = end;
      currentProc.remaining = 0;
      currentProc.end = currentTime;

      const turnaround = currentProc.end - currentProc.arrival;
      const waiting = turnaround - currentProc.burst;
      completed.push({
        ...currentProc,
        completion: currentProc.end,
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

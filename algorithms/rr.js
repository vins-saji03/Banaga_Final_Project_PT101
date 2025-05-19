export function calculateRR(processes, quantum) {
  const n = processes.length;
  const queue = [];
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
  let i = 0;

  // Sort by arrival time initially
  remaining.sort((a, b) => a.arrival - b.arrival);

  while (completed.length < n) {
    // Enqueue all that arrived at current time
    while (i < n && remaining[i].arrival <= currentTime) {
      queue.push(remaining[i]);
      i++;
    }

    if (queue.length === 0) {
      // CPU is idle, increment time by 1 only
      ganttChart.push({
        label: "i",
        start: currentTime,
        end: currentTime + 1,
        burstUsed: 1,
        rbt: null,
        queue: [],
        arrived: remaining
          .filter((p) => p.arrival === currentTime)
          .map((p) => ({ process: p.process, priority: p.priority || null })),
      });

      totalIdle++;
      currentTime++;
      continue;
    }

    const current = queue.shift();
    const executionTime = Math.min(quantum, current.remaining);
    const sliceStart = currentTime;
    const sliceEnd = sliceStart + executionTime;

    if (current.start === null) current.start = currentTime;

    // Get queue state before execution
    const queueBefore = queue.map((p) => ({
      process: p.process,
      priority: p.priority || null,
    }));

    const arrivedDuring = [];

    // Simulate time unit by unit
    for (let t = 0; t < executionTime; t++) {
      currentTime++;

      // Add processes that arrive during execution
      while (i < n && remaining[i].arrival <= currentTime) {
        queue.push(remaining[i]);
        arrivedDuring.push({
          process: remaining[i].process,
          priority: remaining[i].priority || null,
        });
        i++;
      }
    }

    current.remaining -= executionTime;

    ganttChart.push({
      label: current.process,
      start: sliceStart,
      end: sliceEnd,
      burstUsed: executionTime,
      rbt: current.remaining,
      queue: queueBefore,
      arrived: arrivedDuring,
    });

    if (current.remaining > 0) {
      queue.push(current);
    } else {
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

export function calculateRR(processes, timeQuantum) {
    const n = processes.length;
    const completed = [];
    const remaining = processes.map((p) => ({
      ...p,
      remaining: p.burst,
      start: null,
    }));
    const ganttChart = [];
    const readyQueue = [];
    const addedToQueue = new Set();
  
    let currentTime = 0;
    let totalIdle = 0;
  
    while (completed.length < n && remaining.some((p) => p.remaining > 0)) {
      console.log("Current Time:", currentTime);
      console.log("Remaining Processes:", remaining);
      console.log("Ready Queue:", readyQueue);
  
      // Add newly arrived processes in order of arrival
      remaining
        .filter(
          (p) =>
            p.arrival <= currentTime &&
            !addedToQueue.has(p.process) &&
            p.remaining > 0
        )
        .sort((a, b) => a.arrival - b.arrival)
        .forEach((p) => {
          readyQueue.push(p);
          addedToQueue.add(p.process);
          console.log("Added to queue:", p);
        });
  
      if (readyQueue.length === 0) {
        const future = remaining.filter(
          (p) => p.remaining > 0 && p.arrival > currentTime
        );
        if (future.length > 0) {
          const nextArrival = Math.min(...future.map((p) => p.arrival));
          ganttChart.push({
            label: "i",
            start: currentTime,
            end: nextArrival,
            rbt: null,
            queue: [],
            arrived: future
              .filter((p) => p.arrival <= nextArrival)
              .map((p) => ({ process: p.process })),
          });
          totalIdle += nextArrival - currentTime;
          currentTime = nextArrival;
          continue;
        } else {
          break;
        }
      }
  
      const p = readyQueue.shift();
      if (p.start === null) {
        p.start = currentTime;
      }
  
      const execTime = Math.min(timeQuantum, p.remaining);
      const start = currentTime;
      const end = currentTime + execTime;
      p.remaining -= execTime;
      currentTime = end;
  
      // Add newly arrived processes DURING execution
      remaining
        .filter(
          (proc) =>
            proc.arrival > start &&
            proc.arrival <= end &&
            proc.remaining > 0 &&
            !addedToQueue.has(proc.process)
        )
        .sort((a, b) => a.arrival - b.arrival)
        .forEach((proc) => {
          readyQueue.push(proc);
          addedToQueue.add(proc.process);
          console.log("Added during execution:", proc);
        });
  
      const displayQueue = [...readyQueue]
        .filter((proc) => proc.remaining > 0)
        .sort((a, b) => a.arrival - b.arrival)
        .map((proc) => ({
          process: proc.process,
          remaining: proc.remaining,
          arrival: proc.arrival,
        }));
  
      ganttChart.push({
        label: p.process,
        start,
        end,
        rbt: p.remaining,
        queue: displayQueue,
      });
  
      if (p.remaining > 0) {
        readyQueue.push(p); // Re-queue for next round
      } else {
        const turnaround = currentTime - p.arrival;
        const waiting = turnaround - p.burst;
        completed.push({
          ...p,
          completion: currentTime,
          turnaround,
          waiting,
        });
      }
    }
  
    console.table(ganttChart);
  
    return {
      result: completed,
      ganttChart,
      totalTime: currentTime,
      totalIdle,
    };
  }
  
import {
    renderResultTableTurnaround,
    renderResultTableWaiting,
    renderGanttChart,
    generateTimeline,
    renderCPUUtilization,
    getProcessData,
    addRow,
    deleteRow,
    onAlgorithmChange,
  } from "./algorithms/render.js";
  
  import { calculateFCFS } from "./algorithms/fcfs.js";
  import { calculateSJF } from "./algorithms/SJF.js";
  import { calculateNPP } from "./algorithms/npp.js";
  import { calculateRR } from "./algorithms/rr.js";
  import { calculateSRTF } from "./algorithms/srtf.js";
  import { calculatePP } from "./algorithms/pp.js";
  
  function scheduleAndRender(algorithm, options = {}, mode) {
    resetUI();
    const { processes, timeQuantum } = getProcessData("#jobsTable", mode);
    if (!processes || !processes.length) return;
  
    try {
      const output =
        options.algorithm === "RR"
          ? algorithm(processes, timeQuantum)
          : algorithm(processes);
  
      const { result, totalTime, totalIdle, ganttChart } = output;
  
      renderResultTableTurnaround(result);
      renderResultTableWaiting(result);
      renderGanttChart(options, ganttChart);
      generateTimeline(result);
      renderCPUUtilization(totalIdle, totalTime, ganttChart);
    } catch (error) {
      console.error("Error during scheduling or rendering:", error);
    }
  }
  
 
  
  export function updateTableColumns(selectedValue) {
    const table = document.getElementById("jobsTable");
    const headerRow = table.querySelector("thead tr");
    const bodyRows = table.querySelectorAll("tbody tr");
  
    const hasPriorityColumn = table.querySelector("th.priority-col");
    const hasTimeQuantumColumn = table.querySelector("th.timeQuantum-col");
  
    const needsPriority = selectedValue === "NPP" || selectedValue === "PP";
    const needsTimeQuantum = selectedValue === "RR";
  
    // Remove Priority column if not needed
    if (!needsPriority && hasPriorityColumn) {
      hasPriorityColumn.remove();
      bodyRows.forEach((row) => {
        const priorityCell = row.querySelector("td.priority-col");
        if (priorityCell) priorityCell.remove();
      });
    }
  
    // Remove Time Quantum column if not needed
    if (!needsTimeQuantum && hasTimeQuantumColumn) {
      hasTimeQuantumColumn.remove();
      bodyRows.forEach((row) => {
        const tqCell = row.querySelector("td.timeQuantum-col");
        if (tqCell) tqCell.remove();
      });
    }
  
    // Add Priority column if needed and not already present
    if (needsPriority && !hasPriorityColumn) {
      const priorityHeader = document.createElement("th");
      priorityHeader.classList.add("priority-col");
      priorityHeader.innerHTML = `<div class="title-yellow flex-fill text-center">Priority</div>`;
      headerRow.appendChild(priorityHeader);
  
      bodyRows.forEach((row) => {
        const newCell = document.createElement("td");
        newCell.classList.add("priority-col");
        newCell.innerHTML = `<input type="number" min="0" class="input-yellow flex-fill form-control shadow-none" />`;
        row.appendChild(newCell);
      });
    }
  
    // Add Time Quantum column if needed and not already present (as last column)
    if (needsTimeQuantum && !hasTimeQuantumColumn) {
      const tqHeader = document.createElement("th");
      tqHeader.classList.add("timeQuantum-col");
      tqHeader.innerHTML = `<div class="title-yellow flex-fill text-center">Time Quantum</div>`;
      headerRow.appendChild(tqHeader);
    }
  }
  
  let algorithmValue = "FCFS";
  const algorithmSelect = document.getElementById("algorithm");

  if (algorithmSelect) {
    algorithmValue = algorithmSelect.value; // Initialize value

    algorithmSelect.addEventListener("change", () => {
      algorithmValue = algorithmSelect.value;
      updateTableColumns(algorithmValue);
      onAlgorithmChange(algorithmValue);
    });
  }
  
  
  function validateTableInputs(algorithm, options = {}, mode) {
    let invalid = false;
    let firstInvalidInput = null;
  
    // Get all number inputs inside the table
    const inputs = document.querySelectorAll(
      "#jobsTable input[type='number']"
    );
  
    invalid = [...inputs].some((input) => {
      if (!input.value) {
        input.classList.add("is-invalid");
        if (!firstInvalidInput) {
          firstInvalidInput = input;
        }
        return true; // Stop as soon as one invalid input is found
      }
      input.classList.remove("is-invalid");
      return false;
    });
  
    if (invalid) {
      firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalidInput.focus();
  
      const modal = new bootstrap.Toast(document.getElementById("liveToast"));
      modal.show();
      return false;
    }
  
    // If valid, run your computation
    scheduleAndRender(algorithm, options, mode);
  }
  
  function resetUI() {
    ["head", "gbody", "tail", "queue", "turnaroundTable", "waitingTable"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
      }
    );
  }

document.addEventListener("DOMContentLoaded", function () {

  const addRowBtn = document.getElementById("addJobBtn");
  if (addRowBtn) {
    addRowBtn.addEventListener("click", () => {
      addRow("#jobsTable", algorithmValue);
    });
  }

  const deleteRowBtn = document.getElementById("removeJobBtn");
  if (deleteRowBtn) {
    deleteRowBtn.addEventListener("click", () => {
      deleteRow("#jobsTable");
    });
  }

  const calculate = document.getElementById("calculateBtn");
  calculate.addEventListener("click", () => {
    switch (algorithmValue) {
      case "FCFS":
        validateTableInputs(calculateFCFS, {
          showQueue: true,
          algorithm: "FCFS",
        });
        break;

      case "SJF":
        validateTableInputs(calculateSJF, {
          showQueue: true,
          algorithm: "SJF",
        });
        break;

      case "NPP":
        validateTableInputs(
          calculateNPP,
          { showQueue: true, algorithm: "NPP" },
          "priority"
        );
        break;

      case "PP":
        validateTableInputs(
          calculatePP,
          { showQueue: true, algorithm: "PP" },
          "priority"
        );
        break;

      case "SRTF":
        validateTableInputs(calculateSRTF, {
          showQueue: true,
          algorithm: "SRTF",
        });
        break;

      case "RR":
        validateTableInputs(
          calculateRR,
          { showQueue: true, algorithm: "RR" },
          "roundrobin"
        );
        break;

      default:
        alert("Please select a scheduling algorithm.");
        break;
    }
  });
});

  
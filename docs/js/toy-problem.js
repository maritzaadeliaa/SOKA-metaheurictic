/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/toy-problem.js
 * Pemilik : [Orang 1]
 * Tujuan  : Model Toy Problem Bersama (8 Task, 3 VM), Evaluator Fitness,
 *           LPT Warm-Start, Seeded PRNG & Helper Visualisasi Gambar Solusi.
 * ============================================================================
 * 
 * Modul ini diekspor ke objek global `window.TOY` dan digunakan bersama oleh:
 * - Slide Intro & Problem Statement [Orang 1]
 * - Slide Fungsi Objektif [Orang 1]
 * - Slide Tabu Search [Orang 2]
 * - Slide Flower Pollination Algorithm [Orang 3]
 */

(function () {
  'use strict';

  // 1. PRNG Seeded (Mulberry32) untuk reproduksibilitas animasi
  function createMulberry32(seed = 42) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 2. Data Task (8 Task dalam satuan Million Instructions / MI)
  const tasks = [12000, 45000, 30000, 8000, 50000, 22000, 38000, 15000];

  // Palet warna unik untuk setiap task (T0 s/d T7) agar pergerakan terlihat jelas
  const taskColors = [
    '#38bdf8', // T0: Sky Blue
    '#f43f5e', // T1: Rose Red
    '#a855f7', // T2: Purple
    '#34d399', // T3: Mint
    '#fb923c', // T4: Orange
    '#fbbf24', // T5: Amber
    '#818cf8', // T6: Indigo
    '#2dd4bf'  // T7: Teal
  ];

  // 3. Data Mesin Virtual (3 VM Heterogen)
  const vms = [
    {
      id: 0,
      name: 'VM 0: Compute',
      type: 'Compute-Intensive',
      mips: 2500,
      costRate: 150, // G$/detik
      color: 'var(--color-vm-compute, #ef4444)',
      hexColor: '#ef4444',
      badge: '2500 MIPS • 150 G$/s'
    },
    {
      id: 1,
      name: 'VM 1: Standard',
      type: 'Standard',
      mips: 1500,
      costRate: 40,  // G$/detik
      color: 'var(--color-vm-standard, #3b82f6)',
      hexColor: '#3b82f6',
      badge: '1500 MIPS • 40 G$/s'
    },
    {
      id: 2,
      name: 'VM 2: Light',
      type: 'Light-weight',
      mips: 800,
      costRate: 18,  // G$/detik
      color: 'var(--color-vm-light, #10b981)',
      hexColor: '#10b981',
      badge: '800 MIPS • 18 G$/s'
    }
  ];

  // Objek Utama TOY
  const TOY = {
    tasks,
    taskColors,
    vms,
    refMakespan: 48.0, // Default sebelum dihitung dinamis dari LPT
    refCost: 9675.0,   // Default sebelum dihitung dinamis dari LPT
    rand: createMulberry32(42),
    createRng: createMulberry32,

    /**
     * Membangun solusi awal menggunakan heuristik Longest Processing Time (LPT).
     * Task diurutkan menurun berdasarkan MI, lalu dialokasikan ke VM yang
     * menghasilkan waktu selesai paling awal (Minimum Completion Time).
     * @returns {number[]} Array assignment sepanjang 8 task
     */
    lptInitial() {
      const n = tasks.length;
      const assignment = new Array(n).fill(0);
      const vmFinishTimes = [0, 0, 0];

      // Urutkan indeks task berdasarkan MI menurun
      const order = tasks.map((_, i) => i).sort((a, b) => tasks[b] - tasks[a]);

      for (const taskIdx of order) {
        const taskLen = tasks[taskIdx];
        let bestVm = 0;
        let bestFinish = Infinity;

        for (let j = 0; j < vms.length; j++) {
          const finish = vmFinishTimes[j] + taskLen / vms[j].mips;
          if (finish < bestFinish) {
            bestFinish = finish;
            bestVm = j;
          }
        }

        vmFinishTimes[bestVm] = bestFinish;
        assignment[taskIdx] = bestVm;
      }

      return assignment;
    },

    /**
     * Evaluasi analitis alokasi task ke VM:
     * - waktu VM = total MI task di VM / MIPS
     * - makespan = max(waktu VM)
     * - cost = sum(waktu VM * tarif VM)
     * - fitness = 0.5 * (makespan / refMakespan) + 0.5 * (cost / refCost)
     * 
     * @param {number[]} assignment Array assignment [vmIdx_T0, ..., vmIdx_T7]
     * @param {boolean} isBaseline Jika true, jangan gunakan ref untuk normalisasi (dipakai inisialisasi ref)
     * @returns {Object} { makespan, cost, fitness, vmTimes, bottleneckVm, vmTaskLists }
     */
    evaluate(assignment, isBaseline = false) {
      const numVms = vms.length;
      const vmMiTotal = [0, 0, 0];
      const vmTaskLists = [[], [], []];

      for (let i = 0; i < tasks.length; i++) {
        const vmIdx = assignment[i];
        if (vmIdx >= 0 && vmIdx < numVms) {
          vmMiTotal[vmIdx] += tasks[i];
          vmTaskLists[vmIdx].push(i);
        }
      }

      // Hitung waktu selesai masing-masing VM
      const vmTimes = vmMiTotal.map((mi, j) => mi / vms[j].mips);

      // Makespan = waktu VM paling lambat
      let makespan = 0;
      let bottleneckVm = 0;
      for (let j = 0; j < numVms; j++) {
        if (vmTimes[j] > makespan) {
          makespan = vmTimes[j];
          bottleneckVm = j;
        }
      }

      // Total Cost = sum(waktu VM * tarif sewa per detik)
      let cost = 0;
      for (let j = 0; j < numVms; j++) {
        cost += vmTimes[j] * vms[j].costRate;
      }

      // Normalisasi Fitness gabungan (Bi-Objective: 50% Makespan, 50% Cost)
      let fitness = 1.0;
      if (!isBaseline) {
        const refM = this.refMakespan > 0 ? this.refMakespan : makespan;
        const refC = this.refCost > 0 ? this.refCost : cost;
        fitness = 0.5 * (makespan / refM) + 0.5 * (cost / refC);
      }

      return {
        makespan,
        cost,
        fitness,
        vmTimes,
        bottleneckVm,
        vmTaskLists,
        vmMiTotal
      };
    },

    /**
     * Helper visualisasi alokasi task ke 3 VM menggunakan SVG
     * Digunakan bersama di slide Intro, Fitness, Tabu Search, dan FPA.
     * 
     * @param {Object} ctx Slide context { root, svg }
     * @param {number[]} assignment Array alokasi task [0..2]
     * @param {Object} options Opsi rendering (highlightTask, highlightVm, title, dll)
     * @returns {SVGElement} Elemen SVG yang dirender
     */
    drawAssignment(ctx, assignment, options = {}) {
      const svg = ctx.svg;
      const evalRes = this.evaluate(assignment);

      const width = options.width || 1080;
      const height = options.height || 420;
      const svgContainer = svg.initContainer(width, height);

      // Background canvas
      const bg = svg.rect(0, 0, width, height, {
        fill: '#0f172a',
        rx: 16,
        ry: 16,
        stroke: 'rgba(148, 163, 184, 0.15)',
        'stroke-width': 1.5
      });
      svgContainer.appendChild(bg);

      // Konfigurasi Grid 3 Kolom untuk 3 VM
      const lanePadding = 24;
      const topOffset = 80;
      const laneWidth = (width - lanePadding * 4) / 3;
      const laneHeight = height - topOffset - 70;
      const maxTimeRef = 65.0; // Skala detik maksimum untuk visualisasi tinggi bar

      // Gambar 3 Kolom VM
      for (let j = 0; j < vms.length; j++) {
        const vm = vms[j];
        const laneX = lanePadding + j * (laneWidth + lanePadding);
        const isBottleneck = j === evalRes.bottleneckVm;
        const isHighlight = options.highlightVm === j;

        // Container kolom VM
        const laneBg = svg.rect(laneX, topOffset, laneWidth, laneHeight, {
          fill: isHighlight ? 'rgba(51, 65, 85, 0.6)' : 'rgba(30, 41, 59, 0.45)',
          rx: 12,
          ry: 12,
          stroke: isBottleneck ? '#ef4444' : vm.hexColor,
          'stroke-width': isBottleneck ? 2.5 : 1.5,
          'stroke-dasharray': isBottleneck ? 'none' : 'none'
        });
        svgContainer.appendChild(laneBg);

        // Header Kolom VM
        const headerG = svg.group();
        const headerBadge = svg.rect(laneX + 12, topOffset + 12, laneWidth - 24, 38, {
          fill: `${vm.hexColor}22`,
          rx: 8,
          stroke: `${vm.hexColor}66`,
          'stroke-width': 1
        });
        const headerTitle = svg.text(laneX + laneWidth / 2, topOffset + 28, vm.name, {
          fill: '#f8fafc',
          'font-size': 13,
          'font-weight': 700,
          'text-anchor': 'middle'
        });
        const headerSpec = svg.text(laneX + laneWidth / 2, topOffset + 43, vm.badge, {
          fill: '#94a3b8',
          'font-size': 11,
          'font-weight': 500,
          'text-anchor': 'middle'
        });
        headerG.appendChild(headerBadge);
        headerG.appendChild(headerTitle);
        headerG.appendChild(headerSpec);
        svgContainer.appendChild(headerG);

        // Susun Task di dalam kolom VM dari bawah ke atas
        const taskList = evalRes.vmTaskLists[j];
        const taskStartY = topOffset + laneHeight - 16;
        let currentY = taskStartY;

        for (const tIdx of taskList) {
          const mi = tasks[tIdx];
          const execTime = mi / vm.mips;
          // Tinggi proporsional terhadap durasi waktu eksekusi task
          const blockH = Math.max(26, (execTime / maxTimeRef) * (laneHeight - 90));
          const blockY = currentY - blockH;

          const isTaskHighlight = options.highlightTask === tIdx;

          const blockG = svg.group({
            className: isTaskHighlight ? 'highlight' : ''
          });

          // Kotak Task
          const taskRect = svg.rect(laneX + 16, blockY, laneWidth - 32, blockH, {
            fill: taskColors[tIdx],
            rx: 6,
            ry: 6,
            stroke: isTaskHighlight ? '#ffffff' : 'rgba(0, 0, 0, 0.4)',
            'stroke-width': isTaskHighlight ? 2.5 : 1,
            filter: isTaskHighlight ? 'drop-shadow(0 0 8px #fff)' : 'none'
          });

          // Label Task
          const taskLabel = svg.text(
            laneX + 26,
            blockY + blockH / 2 + 4,
            `T${tIdx} (${(mi / 1000).toFixed(0)}k MI)`,
            {
              fill: '#0f172a',
              'font-size': 11,
              'font-weight': 800
            }
          );

          // Waktu eksekusi task di kanan
          const timeLabel = svg.text(
            laneX + laneWidth - 26,
            blockY + blockH / 2 + 4,
            `${execTime.toFixed(1)}s`,
            {
              fill: '#0f172a',
              'font-size': 11,
              'font-weight': 700,
              'text-anchor': 'end'
            }
          );

          blockG.appendChild(taskRect);
          blockG.appendChild(taskLabel);
          blockG.appendChild(timeLabel);
          svgContainer.appendChild(blockG);

          currentY = blockY - 6; // Jarak antar blok
        }

        // Indikator Waktu Aktif VM di Bagian Bawah Kolom
        const vmTime = evalRes.vmTimes[j];
        const timeBox = svg.group();
        const timeBadge = svg.rect(laneX + 16, topOffset + laneHeight + 10, laneWidth - 32, 28, {
          fill: isBottleneck ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.7)',
          rx: 6,
          stroke: isBottleneck ? '#ef4444' : 'rgba(148, 163, 184, 0.2)',
          'stroke-width': 1
        });
        const timeText = svg.text(
          laneX + laneWidth / 2,
          topOffset + laneHeight + 28,
          `Waktu: ${vmTime.toFixed(1)}s ${isBottleneck ? '(Bottleneck)' : ''}`,
          {
            fill: isBottleneck ? '#fca5a5' : '#cbd5e1',
            'font-size': 12,
            'font-weight': isBottleneck ? 700 : 500,
            'text-anchor': 'middle'
          }
        );
        timeBox.appendChild(timeBadge);
        timeBox.appendChild(timeText);
        svgContainer.appendChild(timeBox);
      }

      // Garis Batas Makespan (Bottleneck)
      const makespanY = topOffset + laneHeight - (evalRes.makespan / maxTimeRef) * (laneHeight - 90);
      const makespanLine = svg.line(lanePadding, makespanY, width - lanePadding, makespanY, {
        stroke: '#ef4444',
        'stroke-width': 1.8,
        'stroke-dasharray': '5,4'
      });
      const makespanTag = svg.text(width - lanePadding - 4, makespanY - 6, `Makespan: ${evalRes.makespan.toFixed(1)}s`, {
        fill: '#ef4444',
        'font-size': 11,
        'font-weight': 700,
        'text-anchor': 'end'
      });
      svgContainer.appendChild(makespanLine);
      svgContainer.appendChild(makespanTag);

      // Header Bar Evaluasi Fitness di Atas
      const topBar = svg.group();
      const topTitle = svg.text(28, 42, options.title || 'Alokasi Task & Evaluasi Beban VM', {
        fill: '#f8fafc',
        'font-size': 18,
        'font-weight': 800
      });

      // Metric Pills (Makespan, Cost, Fitness)
      const metricsText = `Makespan: ${evalRes.makespan.toFixed(1)}s  |  Biaya: ${evalRes.cost.toFixed(0)} G$  |  Fitness F(S): ${evalRes.fitness.toFixed(4)}`;
      const metricsPill = svg.text(width - 28, 42, metricsText, {
        fill: '#fbbf24',
        'font-size': 14,
        'font-family': 'var(--font-mono, monospace)',
        'font-weight': 700,
        'text-anchor': 'end'
      });

      topBar.appendChild(topTitle);
      topBar.appendChild(metricsPill);
      svgContainer.appendChild(topBar);

      return svgContainer;
    }
  };

  // Inisialisasi awal nilai referensi LPT
  const initLpt = TOY.lptInitial();
  const initEval = TOY.evaluate(initLpt, true);
  TOY.refMakespan = initEval.makespan; // 48.0s
  TOY.refCost = initEval.cost;         // 9675.0 G$

  // Ekspor ke global
  window.TOY = TOY;
})();

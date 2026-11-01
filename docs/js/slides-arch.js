/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/slides-arch.js
 * Pemilik : [Orang 4]
 * Tujuan  : Slide 3: Arsitektur Cloud & Dataset (4 step)
 * ============================================================================
 * 
 * PANDUAN ORANG 4 (Sesuai PDF Hal. 6):
 * 4 step:
 * (1) 2 datacenter, 10 host: 4 High Performance (8 core, 3000 MIPS) dan 6 Standard (4 core, 1500 MIPS).
 * (2) 16 VM masuk ke host: 4 Compute (2500 MIPS, 150 G$/s), 6 Standard (1500 MIPS, 40 G$/s), 6 Light (800 MIPS, 18 G$/s).
 * (3) Dataset GoCJ: 19 file, 100-1000 task, workload nyata, ada task sangat besar.
 * (4) Dataset sintetik: 100-10.000 task, distribusi 30% kecil / 40% sedang / 30% besar.
 */

// STUB SAJA - Dikerjakan oleh Orang 4
Slides.register({
  id: 'slide-3',
  title: 'Arsitektur Cloud & Dataset',
  steps: [
    {
      label: '2 Datacenter & 10 Host Fisik',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 3: Arsitektur Cloud & Dataset (Step 1/4)</h2>
            <div class="stub-box">
              <div class="stub-icon">☁️</div>
              <p class="stub-text"><strong>Step 1:</strong> 2 Datacenter, 10 Host (4 High Performance @ 3000 MIPS, 6 Standard @ 1500 MIPS).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: '16 VM Heterogen (3-Tier)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 3: Arsitektur Cloud & Dataset (Step 2/4)</h2>
            <div class="stub-box">
              <div class="stub-icon">🖥️</div>
              <p class="stub-text"><strong>Step 2:</strong> 16 VM (4 Compute @ 150 G$/s, 6 Standard @ 40 G$/s, 6 Light @ 18 G$/s).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Dataset Nyata GoCJ (100-1000 Task)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 3: Arsitektur Cloud & Dataset (Step 3/4)</h2>
            <div class="stub-box">
              <div class="stub-icon">📁</div>
              <p class="stub-text"><strong>Step 3:</strong> Dataset nyata GoCJ: 19 file, 100-1000 task trace Google cluster.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Dataset Sintetik 30/40/30 (Hingga 10.000 Task)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 3: Arsitektur Cloud & Dataset (Step 4/4)</h2>
            <div class="stub-box">
              <div class="stub-icon">📊</div>
              <p class="stub-text"><strong>Step 4:</strong> Dataset sintetik 100 s/d 10.000 task (distribusi 30% kecil / 40% sedang / 30% besar).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    }
  ]
});

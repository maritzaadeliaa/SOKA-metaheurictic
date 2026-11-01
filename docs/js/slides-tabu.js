/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/slides-tabu.js
 * Pemilik : [Orang 2]
 * Tujuan  : Slide 4 (TS A: Inspirasi & Pergerakan) dan Slide 5 (TS B: Tabu List & Hasil)
 * ============================================================================
 * 
 * PANDUAN ORANG 2 (Sesuai PDF Hal. 4):
 * Slide 4 (5 step):
 * (1) Inspirasi orang di labirin menandai jalan buntu (X).
 * (2) Solusi awal LPT lewat TOY.drawAssignment.
 * (3) Critical VM move: blok dari bottleneck pindah ke VM lain.
 * (4) Cost move: blok dari VM Compute pindah ke VM murah.
 * (5) Swap: dua blok bertukar VM.
 * 
 * Slide 5 (5 step):
 * (1) Panel tabu list (task, VM asal, sisa tenure).
 * (2) Usaha kembali ke VM asal ditandai X merah (dilarang).
 * (3) Kasus langkah tabu memecahkan rekor: X berubah hijau (aspirasi).
 * (4) Putar frame iterasi, kurva fitness turun.
 * (5) Solusi akhir vs LPT (blok VM + makespan/cost) & kondisi berhenti (max 150 / stop 40).
 */

// STUB SAJA - Dikerjakan oleh Orang 2

// SLIDE 4: Tabu Search A
Slides.register({
  id: 'slide-4',
  title: 'Tabu Search A: Inspirasi & Pergerakan',
  steps: [
    {
      label: 'Inspirasi Labirin Memori',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 4: Tabu Search A (Step 1/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🧭</div>
              <p class="stub-text"><strong>Inspirasi:</strong> Orang di labirin menandai jalan buntu (X). <em>"Ingat langkah terakhir, jangan diulang."</em></p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Solusi Awal LPT',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 4: Tabu Search A (Step 2/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">📋</div>
              <p class="stub-text"><strong>Solusi Awal LPT:</strong> Tampilkan makespan/cost/fitness dan sorot VM bottleneck via TOY.drawAssignment.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Critical VM Move',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 4: Tabu Search A (Step 3/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">⚡</div>
              <p class="stub-text"><strong>Critical Move:</strong> Blok dari VM bottleneck pindah ke VM lain untuk memperpendek makespan.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Cost Reduction Move',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 4: Tabu Search A (Step 4/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">💰</div>
              <p class="stub-text"><strong>Cost Move:</strong> Blok dari VM Compute (mahal) turun ke VM murah (Standard/Light).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Swap Move',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 4: Tabu Search A (Step 5/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🔄</div>
              <p class="stub-text"><strong>Swap Move:</strong> Dua blok task bertukar VM untuk menyeimbangkan beban.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    }
  ]
});

// SLIDE 5: Tabu Search B
Slides.register({
  id: 'slide-5',
  title: 'Tabu Search B: Tabu List & Hasil',
  steps: [
    {
      label: 'Panel Tabu List (Tenure 15)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 5: Tabu Search B (Step 1/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">📝</div>
              <p class="stub-text"><strong>Tabu List:</strong> Tabel memori (task, VM asal, sisa tenure). Nilai asli simulasi: tenure 15.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Larangan Kembali (Status Tabu)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 5: Tabu Search B (Step 2/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">❌</div>
              <p class="stub-text"><strong>Status Tabu:</strong> Usaha kembali ke VM asal ditandai X merah (dilarang berputar-putar).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Aspiration Criterion',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 5: Tabu Search B (Step 3/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">⭐</div>
              <p class="stub-text"><strong>Aspirasi:</strong> Jika langkah tabu mencetak rekor Global Best, X berubah hijau dan diterima.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Iterasi & Konvergensi',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 5: Tabu Search B (Step 4/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">📉</div>
              <p class="stub-text"><strong>Konvergensi:</strong> Frame iterasi berputar, kurva fitness menurun menuju optimal.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Hasil Akhir vs LPT',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-ts">Bagian Orang 2 (Stub)</div>
            <h2 class="stub-title">Slide 5: Tabu Search B (Step 5/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🏆</div>
              <p class="stub-text"><strong>Solusi Akhir vs LPT:</strong> Perbandingan blok VM + makespan/cost. Kondisi henti: 150 iterasi / 40 stagnan.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 2</strong>.</p>
            </div>
          </div>
        `;
      }
    }
  ]
});

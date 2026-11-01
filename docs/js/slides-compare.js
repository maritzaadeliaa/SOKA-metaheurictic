/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/slides-compare.js
 * Pemilik : [Orang 4]
 * Tujuan  : Slide 8 (Studi Kasus Nyata) dan Slide 9 (Komparasi 6 Metrik)
 * ============================================================================
 * 
 * PANDUAN ORANG 4 (Sesuai PDF Hal. 6):
 * Slide 8 (4 step):
 * Studi kasus GoCJ_Dataset_500 (alur masalah -> proses -> solusi):
 * (1) 500 task masuk ke 16 VM.
 * (2) TS berjalan.
 * (3) FPA berjalan.
 * (4) Hasil akhir TS vs FPA (makespan, cost) bar yang tumbuh dari results.json.
 * 
 * Slide 9 (6 step):
 * Satu grafik per step:
 * (1) Makespan (s)
 * (2) Throughput (task/s)
 * (3) Total Cost (G$)
 * (4) Resource Utilization (%)
 * (5) Degree of Imbalance (DI)
 * (6) Scheduling Time / Konvergensi (ms)
 */

// STUB SAJA - Dikerjakan oleh Orang 4

// SLIDE 8: Studi Kasus
Slides.register({
  id: 'slide-8',
  title: 'Studi Kasus (GoCJ_Dataset_500)',
  steps: [
    {
      label: '500 Task Masuk ke 16 VM',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 8: Studi Kasus GoCJ_Dataset_500 (Step 1/4)</h2>
            <div class="stub-box">
              <div class="stub-icon">📥</div>
              <p class="stub-text"><strong>Masalah:</strong> 500 task riil Google trace masuk ke cluster 16 VM heterogen.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong> menggunakan data dari <code>results.json</code>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Proses Tabu Search',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 8: Studi Kasus GoCJ_Dataset_500 (Step 2/4)</h2>
            <div class="stub-box">
              <div class="stub-icon">📋</div>
              <p class="stub-text"><strong>Proses TS:</strong> Tabu Search menata alokasi task kritis untuk memangkas makespan.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Proses Flower Pollination',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 8: Studi Kasus GoCJ_Dataset_500 (Step 3/4)</h2>
            <div class="stub-box">
              <div class="stub-icon">🌸</div>
              <p class="stub-text"><strong>Proses FPA:</strong> FPA mengeksplorasi variasi penugasan via penyerbukan global & lokal.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Hasil Akhir TS vs FPA (Bar Tumbuh)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 8: Studi Kasus GoCJ_Dataset_500 (Step 4/4)</h2>
            <div class="stub-box">
              <div class="stub-icon">📊</div>
              <p class="stub-text"><strong>Solusi Akhir:</strong> Komparasi bar makespan & cost TS vs FPA dari <code>results.json</code>.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    }
  ]
});

// SLIDE 9: Komparasi 6 Metrik
Slides.register({
  id: 'slide-9',
  title: 'Komparasi Kinerja TS vs FPA',
  steps: [
    {
      label: 'Metrik 1: Makespan (s)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 9: Komparasi Kinerja (Step 1/6: Makespan)</h2>
            <div class="stub-box">
              <div class="stub-icon">⏱️</div>
              <p class="stub-text"><strong>Makespan:</strong> TS umumnya menghasilkan waktu selesai lebih singkat pada dataset kecil, mendekati seimbang di dataset besar.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong> via Chart.js / SVG bar.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Metrik 2: Throughput (task/s)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 9: Komparasi Kinerja (Step 2/6: Throughput)</h2>
            <div class="stub-box">
              <div class="stub-icon">🚀</div>
              <p class="stub-text"><strong>Throughput:</strong> Sejalan dengan makespan, produktivitas task per detik meningkat seiring bertambahnya beban.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Metrik 3: Total Cost (G$)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 9: Komparasi Kinerja (Step 3/6: Total Cost)</h2>
            <div class="stub-box">
              <div class="stub-icon">💰</div>
              <p class="stub-text"><strong>Total Cost:</strong> Selisih biaya sewa sangat tipis (< 2%), membuktikan kedua algoritma berhasil memangkas pemakaian VM mahal.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Metrik 4: Resource Utilization (%)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 9: Komparasi Kinerja (Step 4/6: Utilization)</h2>
            <div class="stub-box">
              <div class="stub-icon">⚡</div>
              <p class="stub-text"><strong>CPU Utilization:</strong> Keduanya mencapai utilisasi sangat tinggi (> 98-99%) pada dataset skala besar.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Metrik 5: Degree of Imbalance (DI)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 9: Komparasi Kinerja (Step 5/6: Imbalance)</h2>
            <div class="stub-box">
              <div class="stub-icon">⚖️</div>
              <p class="stub-text"><strong>Degree of Imbalance:</strong> TS unggul stabil mendekati 0.000 berkat mekanisme Critical Move.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Metrik 6: Scheduling Time (ms)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge">Bagian Orang 4 (Stub)</div>
            <h2 class="stub-title">Slide 9: Komparasi Kinerja (Step 6/6: Convergence Time)</h2>
            <div class="stub-box">
              <div class="stub-icon">⏱️</div>
              <p class="stub-text"><strong>Scheduling Time:</strong> FPA stabil berbasis generasi populasi, sedangkan TS sangat efisien pada dataset berukuran moderat.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 4</strong>.</p>
            </div>
          </div>
        `;
      }
    }
  ]
});

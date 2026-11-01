/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/slides-fpa.js
 * Pemilik : [Orang 3]
 * Tujuan  : Slide 6 (FPA A: Inspirasi & Global) dan Slide 7 (FPA B: Lokal & Hasil)
 * ============================================================================
 * 
 * PANDUAN ORANG 3 (Sesuai PDF Hal. 5):
 * Slide 6 (5 step):
 * (1) Inspirasi bunga di taman: lebah terbang jauh (biotik) & angin dekat (abiotik).
 * (2) Populasi 5 bunga (tiap bunga berisi mini-diagram alokasi & fitness).
 * (3) Bunga terbaik g* diberi tanda bintang.
 * (4) Switch probability bar: 80% global / 20% lokal (p = 0.8).
 * (5) Global pollination: lintasan Lévy flight & bunga melompat ke arah g*.
 * 
 * Slide 7 (5 step):
 * (1) Local pollination: pilih dua bunga acak j dan k.
 * (2) Crossover: sebagian task diganti dari j atau k.
 * (3) Seleksi greedy: lebih baik ganti (hijau), lebih buruk buang (merah).
 * (4) g* ter-update jika memecahkan rekor, kurva fitness turun.
 * (5) Solusi akhir vs LPT (blok VM + makespan/cost).
 */

// STUB SAJA - Dikerjakan oleh Orang 3

// SLIDE 6: FPA A
Slides.register({
  id: 'slide-6',
  title: 'FPA A: Inspirasi, Populasi, Global',
  steps: [
    {
      label: 'Inspirasi Penyerbukan Bunga',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 6: FPA A (Step 1/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🌸</div>
              <p class="stub-text"><strong>Inspirasi:</strong> Bunga di taman, polinator lebah terbang jauh (biotik) & angin geser serbuk sari dekat (abiotik).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Populasi 5 Bunga (Toy)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 6: FPA A (Step 2/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🌺</div>
              <p class="stub-text"><strong>Populasi Bunga:</strong> 5 bunga (tiap bunga berisi mini-diagram alokasi task-VM dan nilai fitness).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Bunga Terbaik Global (g*)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 6: FPA A (Step 3/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">⭐</div>
              <p class="stub-text"><strong>Best Flower (g*):</strong> Bunga dengan fitness terendah ditandai bintang sebagai pemandu arah populasi.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Switch Probability (p = 0.8)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 6: FPA A (Step 4/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">⚖️</div>
              <p class="stub-text"><strong>Switch Probability:</strong> Bar rasio 80% Global Pollination (Lévy flight) / 20% Local Pollination.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Global Pollination & Lévy Flight',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 6: FPA A (Step 5/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🐝</div>
              <p class="stub-text"><strong>Lévy Flight:</strong> Lintasan terbang dengan sesekali lompatan panjang menuju g* (algoritma Mantegna, beta = 1.5).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    }
  ]
});

// SLIDE 7: FPA B
Slides.register({
  id: 'slide-7',
  title: 'FPA B: Lokal, Greedy, Hasil',
  steps: [
    {
      label: 'Local Pollination (Abiotik)',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 7: FPA B (Step 1/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">💨</div>
              <p class="stub-text"><strong>Local Pollination:</strong> Pilih dua bunga acak j dan k dari populasi.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Crossover Antar Bunga',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 7: FPA B (Step 2/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🧬</div>
              <p class="stub-text"><strong>Crossover:</strong> Sebagian task bunga diganti dari j atau k (blok berubah warna) dan fitness dihitung.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Seleksi Greedy',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 7: FPA B (Step 3/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🎯</div>
              <p class="stub-text"><strong>Greedy Selection:</strong> Lebih baik = terima (hijau), lebih buruk = tolak/buang (merah).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Update g* & Kurva Konvergensi',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 7: FPA B (Step 4/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">📉</div>
              <p class="stub-text"><strong>Update Rekor:</strong> g* ter-update jika memecahkan rekor terbaik, kurva fitness menurun.</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    },
    {
      label: 'Hasil Akhir FPA vs LPT',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content stub-slide">
            <div class="stub-badge badge-fpa">Bagian Orang 3 (Stub)</div>
            <h2 class="stub-title">Slide 7: FPA B (Step 5/5)</h2>
            <div class="stub-box">
              <div class="stub-icon">🏆</div>
              <p class="stub-text"><strong>Solusi Akhir vs LPT:</strong> Blok penugasan VM akhir + makespan/cost (parameter: pop 20, iter 80, p=0.8).</p>
              <p class="stub-subtext">File ini akan diimplementasikan oleh <strong>Orang 3</strong>.</p>
            </div>
          </div>
        `;
      }
    }
  ]
});

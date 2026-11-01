/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/slides-end.js
 * Pemilik : [Orang 1]
 * Tujuan  : Slide 10 (Kesimpulan & Rekomendasi Penggunaan)
 * ============================================================================
 */

/* ==========================================================================
   SLIDE 10: KESIMPULAN & PENUTUP (3 Step Sesuai PDF)
   ========================================================================== */
Slides.register({
  id: 'slide-10',
  title: 'Kesimpulan & Rekomendasi',
  steps: [
    // Step 1: Karakteristik Tabu Search (Intensifikasi)
    {
      label: 'Karakteristik Tabu Search',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content slide-up">
            <div class="slide-header-box">
              <div class="slide-category">Kesimpulan (1/3)</div>
              <h2 class="slide-heading">Tabu Search: Intensifikasi Pencarian Berbasis Memori</h2>
              <p class="slide-subheading">Sangat kuat menelusuri lingkungan lokal dan menjaga kestabilan alokasi beban antar VM.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; flex: 1; align-items: center;">
              <div class="glass-card" style="border-left: 4px solid var(--color-ts); padding: 32px;">
                <div style="font-size: 32px; margin-bottom: 12px;">📋</div>
                <h3 style="font-size: 24px; font-weight: 800; color: var(--color-ts); margin-bottom: 12px;">Keunggulan Tabu Search</h3>
                <ul style="color: var(--text-main); font-size: 16px; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Single-Solution Trajectory:</strong> Fokus memperbaiki satu solusi jadwal secara terarah.</li>
                  <li><strong>Tabu Memory (Tenure 15):</strong> Mencegah siklus pencarian berulang secara deterministik.</li>
                  <li><strong>Degree of Imbalance Mendekati 0:</strong> Paling konsisten menyeimbangkan beban VM kritis.</li>
                </ul>
              </div>

              <div class="glass-card" style="text-align: center; padding: 32px;">
                <div style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Profil Kinerja TS</div>
                <div style="font-size: 36px; font-family: var(--font-mono); font-weight: 900; color: var(--color-ts); margin: 16px 0;">
                  DI ≈ 0.000 - 0.035
                </div>
                <p style="font-size: 14px; color: var(--text-muted);">Makespan terendah pada beban kerja kritis berkat Critical VM Move.</p>
              </div>
            </div>
          </div>
        `;
      }
    },

    // Step 2: Karakteristik FPA (Diversifikasi)
    {
      label: 'Karakteristik Flower Pollination',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content slide-up">
            <div class="slide-header-box">
              <div class="slide-category">Kesimpulan (2/3)</div>
              <h2 class="slide-heading">Flower Pollination Algorithm: Diversifikasi Swarm Global</h2>
              <p class="slide-subheading">Populasi multi-bunga dan lompatan Lévy flight mencegah terjebak dalam local optima.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; flex: 1; align-items: center;">
              <div class="glass-card" style="border-left: 4px solid var(--color-fpa); padding: 32px;">
                <div style="font-size: 32px; margin-bottom: 12px;">🌸</div>
                <h3 style="font-size: 24px; font-weight: 800; color: var(--color-fpa); margin-bottom: 12px;">Keunggulan Flower Pollination</h3>
                <ul style="color: var(--text-main); font-size: 16px; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Population-Based Swarm:</strong> Menjelajahi banyak daerah ruang pencarian sekaligus.</li>
                  <li><strong>Lévy Flight (Mantegna):</strong> Lompatan sesekali jarak jauh untuk keluar dari lembah lokal.</li>
                  <li><strong>Local Pollination (p = 0.8):</strong> Eksploitasi crossover acak yang sangat fleksibel menekan biaya.</li>
                </ul>
              </div>

              <div class="glass-card" style="text-align: center; padding: 32px;">
                <div style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Profil Kinerja FPA</div>
                <div style="font-size: 36px; font-family: var(--font-mono); font-weight: 900; color: var(--color-fpa); margin: 16px 0;">
                  Util > 99.8%
                </div>
                <p style="font-size: 14px; color: var(--text-muted);">Sangat kompetitif pada skala task masif dengan utilisasi CPU optimal.</p>
              </div>
            </div>
          </div>
        `;
      }
    },

    // Step 3: Rekomendasi & Penutup (Terima Kasih)
    {
      label: 'Rekomendasi & Terima Kasih',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content highlight" style="justify-content: center; align-items: center; text-align: center;">
            <div class="slide-category" style="margin-bottom: 10px;">Kesimpulan (3/3)</div>
            <h2 class="slide-heading" style="font-size: 36px; margin-bottom: 24px;">Rekomendasi Penggunaan di Lingkungan Cloud</h2>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; max-width: 960px; margin-bottom: 36px;">
              <div class="glass-card" style="border: 2px solid var(--color-ts); padding: 24px; text-align: left;">
                <h4 style="font-size: 18px; font-weight: 800; color: var(--color-ts); margin-bottom: 8px;">Pilih Tabu Search jika:</h4>
                <p style="font-size: 14px; color: var(--text-main); line-height: 1.6;">
                  Sistem membutuhkan <strong>jadwal waktu selesai terketat (Makespan minimum)</strong> dan keseimbangan beban absolut pada cluster heterogen.
                </p>
              </div>

              <div class="glass-card" style="border: 2px solid var(--color-fpa); padding: 24px; text-align: left;">
                <h4 style="font-size: 18px; font-weight: 800; color: var(--color-fpa); margin-bottom: 8px;">Pilih Flower Pollination jika:</h4>
                <p style="font-size: 14px; color: var(--text-main); line-height: 1.6;">
                  Sistem menghadapi <strong>variasi job dinamis skala besar</strong> dan membutuhkan eksplorasi luas yang tahan terhadap jebakan local optima.
                </p>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2)); border: 1px solid rgba(255, 255, 255, 0.2); padding: 20px 48px; border-radius: 16px;">
              <h3 style="font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 6px;">Terima Kasih</h3>
              <p style="font-size: 15px; color: var(--text-muted);">Sistem Komputasi Awan (SOKA) • Presentasi Metaheuristik Task Scheduling</p>
            </div>
          </div>
        `;
      }
    }
  ]
});

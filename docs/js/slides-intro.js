/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/slides-intro.js
 * Pemilik : [Orang 1]
 * Tujuan  : Slide 1 (Judul) dan Slide 2 (Problem & Fungsi Objektif)
 * ============================================================================
 */

/* ==========================================================================
   SLIDE 1: JUDUL PRESENTASI (1 Step, Staggered Intro Animation)
   ========================================================================== */
Slides.register({
  id: 'slide-1',
  title: 'Metaheuristik pada Task Scheduling',
  steps: [
    {
      label: 'Metaheuristik pada Task Scheduling - Kelompok 3',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content" style="justify-content: center; align-items: center; text-align: center;">
            <!-- Badge row -->
            <div class="intro-stagger-1" style="display: flex; gap: 12px; margin-bottom: 24px; justify-content: center; flex-wrap: wrap;">
              <span class="course-badge">Sistem Komputasi Awan (SOKA)</span>
              <span style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); color: #a5b4fc; font-size: clamp(10px, 1.2vw, 12px); font-weight: 600; padding: 6px 14px; border-radius: 6px;">
                Task Scheduling Metaheuristics
              </span>
            </div>

            <!-- Title -->
            <h1 class="intro-stagger-2 intro-title-shimmer" style="font-size: clamp(28px, 3.5vw, 44px); font-weight: 900; line-height: 1.25; max-width: 980px; margin-bottom: 20px;">
              Optimasi Task Scheduling Komputasi Awan Heterogen
            </h1>

            <!-- Subtitle -->
            <p class="intro-stagger-3" style="font-size: clamp(16px, 1.8vw, 22px); font-weight: 500; color: #cbd5e1; max-width: 860px; margin-bottom: 40px;">
              Komparasi Metaheuristik <strong style="color: var(--color-ts);">Tabu Search (TS)</strong> vs <strong style="color: var(--color-fpa);">Flower Pollination Algorithm (FPA)</strong>
            </p>

            <!-- Member cards grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: clamp(8px, 1.2vw, 16px); width: 100%; max-width: 880px;">
              <div class="glass-card intro-member-card intro-stagger-4" style="border-top: 3px solid #6366f1; --card-idx: 0;">
                <div style="font-size: clamp(9px, 1vw, 11px); color: var(--text-muted); text-transform: uppercase;">5027231076</div>
                <div style="font-size: clamp(13px, 1.3vw, 16px); font-weight: 700; margin-top: 4px; color: #fff;">Syela Zeruya Tandi Lalong</div>
              </div>
              <div class="glass-card intro-member-card intro-stagger-5" style="border-top: 3px solid var(--color-ts); --card-idx: 1;">
                <div style="font-size: clamp(9px, 1vw, 11px); color: var(--text-muted); text-transform: uppercase;">5027241047</div>
                <div style="font-size: clamp(13px, 1.3vw, 16px); font-weight: 700; margin-top: 4px; color: #fff;">Jonathan Zelig Sutopo</div>
              </div>
              <div class="glass-card intro-member-card intro-stagger-6" style="border-top: 3px solid var(--color-fpa); --card-idx: 2;">
                <div style="font-size: clamp(9px, 1vw, 11px); color: var(--text-muted); text-transform: uppercase;">5027241085</div>
                <div style="font-size: clamp(13px, 1.3vw, 16px); font-weight: 700; margin-top: 4px; color: #fff;">Ahmad Syauqi Reza</div>
              </div>
              <div class="glass-card intro-member-card intro-stagger-7" style="border-top: 3px solid #10b981; --card-idx: 3;">
                <div style="font-size: clamp(9px, 1vw, 11px); color: var(--text-muted); text-transform: uppercase;">5027241111</div>
                <div style="font-size: clamp(13px, 1.3vw, 16px); font-weight: 700; margin-top: 4px; color: #fff;">Maritza Adelia Sucipto</div>
              </div>
              <div class="glass-card intro-member-card intro-stagger-8" style="border-top: 3px solid #14B8A6; --card-idx: 4;">
                <div style="font-size: clamp(9px, 1vw, 11px); color: var(--text-muted); text-transform: uppercase;">5027241117</div>
                <div style="font-size: clamp(13px, 1.3vw, 16px); font-weight: 700; margin-top: 4px; color: #fff;">Adinda Cahya Pramesti</div>
              </div>
            </div>
          </div>
        `;
      }
    }
  ]
});

/* ==========================================================================
   SLIDE 2: PROBLEM & FUNGSI OBJEKTIF (4 Step Sesuai PDF)
   ========================================================================== */
Slides.register({
  id: 'slide-2',
  title: 'Problem & Fungsi Objektif',
  steps: [
    // Step 1: Task berjatuhan tanpa strategi (menumpuk & kosong)
    {
      label: 'Alokasi Tanpa Strategi',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content slide-up">
            <div class="slide-header-box s2-enter s2-enter-d1" style="margin-bottom: 12px;">
              <div class="slide-category">Problem Statement (1/4)</div>
              <h2 class="slide-heading">Alokasi Task Tanpa Strategi Terarah</h2>
              <p class="slide-subheading">Task masuk secara acak ke VM heterogen, menyebabkan beban menumpuk di satu mesin sementara mesin lain menganggur.</p>
            </div>
            <div id="slide2-canvas" class="s2-canvas-enter" style="flex: 1; display: flex; align-items: center; justify-content: center;"></div>
          </div>
        `;

        const canvas = ctx.root.querySelector('#slide2-canvas');
        if (!canvas) return;
        // Alokasi kacau tanpa strategi: task menumpuk di VM Compute
        const randomUnscheduled = [0, 0, 0, 0, 0, 1, 1, 2];
        const svgEl = window.TOY.drawAssignment(ctx, randomUnscheduled, {
          title: 'Alokasi Task Acak: Penumpukan Beban Parah di VM Compute',
          highlightVm: 0,
          width: 1100,
          height: 440
        });
        canvas.appendChild(svgEl);
      }
    },

    // Step 2: Sorot VM bottleneck (makespan)
    {
      label: 'Sorot VM Bottleneck',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content slide-up">
            <div class="slide-header-box s2-enter s2-enter-d1" style="margin-bottom: 12px;">
              <div class="slide-category">Problem Statement (2/4)</div>
              <h2 class="slide-heading">VM Bottleneck Menentukan Waktu Selesai (Makespan)</h2>
              <p class="slide-subheading">Makespan sistem ditentukan oleh VM paling lambat selesai, sehingga utilisasi sumber daya menjadi sangat timpang.</p>
            </div>
            <div id="slide2-canvas" class="s2-canvas-enter" style="flex: 1; display: flex; align-items: center; justify-content: center;"></div>
          </div>
        `;

        const canvas = ctx.root.querySelector('#slide2-canvas');
        if (!canvas) return;
        const bottleneckAssignment = [0, 0, 0, 1, 0, 1, 0, 2];
        const svgEl = window.TOY.drawAssignment(ctx, bottleneckAssignment, {
          title: 'Garis Merah Menunjukkan Batas Kritis Makespan Sistem',
          highlightVm: 0,
          highlightTask: 4,
          width: 1100,
          height: 440
        });
        canvas.appendChild(svgEl);
      }
    },

    // Step 3: Dilema cepat vs murah (VM Compute cepat tapi mahal)
    {
      label: 'Dilema Cepat vs Murah',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content slide-up">
            <div class="slide-header-box s2-enter s2-enter-d1" style="margin-bottom: 16px;">
              <div class="slide-category">Problem Statement (3/4)</div>
              <h2 class="slide-heading">Dilema: Kecepatan Eksekusi vs Efisiensi Biaya</h2>
              <p class="slide-subheading">Memilih VM Compute mempercepat waktu namun tarif 150 G$/s melipatgandakan total biaya sewa.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: clamp(12px, 2vw, 24px); flex: 1; align-items: center;">
              <!-- VM Compute -->
              <div class="glass-card s2-card-enter" style="border: 2px solid var(--color-vm-compute); padding: clamp(16px, 2.5vw, 28px); text-align: center;">
                <div style="font-size: clamp(24px, 3vw, 36px); margin-bottom: 10px;">🚀</div>
                <h3 style="font-size: clamp(16px, 1.8vw, 22px); font-weight: 800; color: #fff;">VM Compute</h3>
                <div style="font-size: clamp(11px, 1.1vw, 13px); font-weight: 700; color: #fca5a5; margin: 8px 0;">2500 MIPS (Sangat Cepat)</div>
                <div style="font-size: clamp(20px, 2.3vw, 28px); font-family: var(--font-mono); font-weight: 900; color: #ef4444; margin: 12px 0;">150 G$/s</div>
                <p style="font-size: clamp(11px, 1.1vw, 13px); color: var(--text-muted);">Biaya 8.3x lebih mahal dari VM Light.</p>
              </div>

              <!-- VM Standard -->
              <div class="glass-card s2-card-enter" style="border: 2px solid var(--color-vm-standard); padding: clamp(16px, 2.5vw, 28px); text-align: center;">
                <div style="font-size: clamp(24px, 3vw, 36px); margin-bottom: 10px;">⚖️</div>
                <h3 style="font-size: clamp(16px, 1.8vw, 22px); font-weight: 800; color: #fff;">VM Standard</h3>
                <div style="font-size: clamp(11px, 1.1vw, 13px); font-weight: 700; color: #93c5fd; margin: 8px 0;">1500 MIPS (Moderat)</div>
                <div style="font-size: clamp(20px, 2.3vw, 28px); font-family: var(--font-mono); font-weight: 900; color: #3b82f6; margin: 12px 0;">40 G$/s</div>
                <p style="font-size: clamp(11px, 1.1vw, 13px); color: var(--text-muted);">Keseimbangan performa umum.</p>
              </div>

              <!-- VM Light -->
              <div class="glass-card s2-card-enter" style="border: 2px solid var(--color-vm-light); padding: clamp(16px, 2.5vw, 28px); text-align: center;">
                <div style="font-size: clamp(24px, 3vw, 36px); margin-bottom: 10px;">🍃</div>
                <h3 style="font-size: clamp(16px, 1.8vw, 22px); font-weight: 800; color: #fff;">VM Light</h3>
                <div style="font-size: clamp(11px, 1.1vw, 13px); font-weight: 700; color: #6ee7b7; margin: 8px 0;">800 MIPS (Lambat)</div>
                <div style="font-size: clamp(20px, 2.3vw, 28px); font-family: var(--font-mono); font-weight: 900; color: #10b981; margin: 12px 0;">18 G$/s</div>
                <p style="font-size: clamp(11px, 1.1vw, 13px); color: var(--text-muted);">Paling hemat biaya sewa.</p>
              </div>
            </div>
          </div>
        `;
      }
    },

    // Step 4: Grafik 2 sumbu makespan vs cost & rumus F(S) singkat
    {
      label: 'Fungsi Objektif F(S) 2 Sumbu',
      enter(ctx) {
        ctx.root.innerHTML = `
          <div class="slide-content slide-up">
            <div class="slide-header-box s2-enter s2-enter-d1" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px;">
              <div>
                <div class="slide-category">Fungsi Objektif (4/4)</div>
                <h2 class="slide-heading" style="font-size: clamp(20px, 2.2vw, 26px);">Trade-off Makespan vs Cost: Minimize F(S)</h2>
                <p class="slide-subheading" style="font-size: clamp(12px, 1.2vw, 14px);">Titik solusi diarahkan menuju pojok kiri-bawah (Utopian Point).</p>
              </div>
              <div class="s2-enter s2-enter-d2" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(251, 191, 36, 0.4); padding: 8px 18px; border-radius: 8px; font-family: var(--font-mono); font-size: clamp(11px, 1.2vw, 15px); font-weight: 700; color: #fbbf24;">
                F(S) = 0.5 · (Makespan / RefM) + 0.5 · (Cost / RefC)
              </div>
            </div>
            <div id="slide2-canvas" class="s2-canvas-enter" style="flex: 1; display: flex; align-items: center; justify-content: center;"></div>
          </div>
        `;

        const canvas = ctx.root.querySelector('#slide2-canvas');
        if (!canvas) return;

        const svg = ctx.svg;
        const w = 1050;
        const h = 420;
        const svgEl = svg.initContainer(w, h);

        const bg = svg.rect(0, 0, w, h, {
          fill: '#0f172a',
          rx: 14,
          stroke: 'rgba(148, 163, 184, 0.15)',
          'stroke-width': 1.5
        });
        svgEl.appendChild(bg);

        const ox = 110;
        const oy = 350;
        const axW = 820;
        const axH = 270;

        // Grid
        for (let s = 1; s <= 4; s++) {
          const gx = ox + (s / 4) * axW;
          const gy = oy - (s / 4) * axH;
          svgEl.appendChild(svg.line(gx, oy, gx, oy - axH, { stroke: 'rgba(255, 255, 255, 0.05)', 'stroke-width': 1 }));
          svgEl.appendChild(svg.line(ox, gy, ox + axW, gy, { stroke: 'rgba(255, 255, 255, 0.05)', 'stroke-width': 1 }));
        }

        // Isoline kontur F(S) = 1.0 & F(S) = 0.80
        svgEl.appendChild(svg.line(ox + 0.15 * axW, oy - 0.95 * axH, ox + 0.95 * axW, oy - 0.15 * axH, {
          stroke: 'rgba(245, 158, 11, 0.4)',
          'stroke-width': 1.5,
          'stroke-dasharray': '6,5'
        }));
        svgEl.appendChild(svg.text(ox + 0.85 * axW, oy - 0.28 * axH, 'Kontur F(S) = 1.00 (LPT Baseline)', {
          fill: '#f59e0b',
          'font-size': 11,
          'font-weight': 600
        }));

        svgEl.appendChild(svg.line(ox + 0.1 * axW, oy - 0.75 * axH, ox + 0.75 * axW, oy - 0.1 * axH, {
          stroke: 'rgba(16, 185, 129, 0.6)',
          'stroke-width': 2,
          'stroke-dasharray': '6,5'
        }));
        svgEl.appendChild(svg.text(ox + 0.65 * axW, oy - 0.23 * axH, 'Kontur F(S) = 0.85 (Optimal)', {
          fill: '#10b981',
          'font-size': 11,
          'font-weight': 700
        }));

        // Sumbu X & Y
        svgEl.appendChild(svg.line(ox, oy, ox + axW + 20, oy, { stroke: '#94a3b8', 'stroke-width': 2 }));
        svgEl.appendChild(svg.line(ox, oy, ox, oy - axH - 20, { stroke: '#94a3b8', 'stroke-width': 2 }));
        svgEl.appendChild(svg.text(ox + axW / 2, oy + 38, 'Makespan / Waktu Penyelesaian (s) → [Lebih cepat ke kiri]', {
          fill: '#38bdf8',
          'font-size': 12,
          'font-weight': 700,
          'text-anchor': 'middle'
        }));
        svgEl.appendChild(svg.text(ox - 30, oy - axH / 2, 'Total Cost / Biaya Sewa (G$) → [Lebih hemat ke bawah]', {
          fill: '#f87171',
          'font-size': 12,
          'font-weight': 700,
          'text-anchor': 'middle',
          transform: `rotate(-90, ${ox - 30}, ${oy - axH / 2})`
        }));

        // Titik LPT (Baseline)
        const lptX = ox + 0.52 * axW;
        const lptY = oy - 0.85 * axH;
        svgEl.appendChild(svg.circle(lptX, lptY, 9, { fill: '#ef4444', stroke: '#fff', 'stroke-width': 2 }));
        svgEl.appendChild(svg.text(lptX + 16, lptY + 4, '🔴 Solusi Awal LPT (Cepat tapi Mahal) [F = 1.000]', {
          fill: '#fca5a5',
          'font-size': 12,
          'font-weight': 700
        }));

        // Titik Metaheuristik (Optimal)
        const optX = ox + 0.56 * axW;
        const optY = oy - 0.42 * axH;
        svgEl.appendChild(svg.circle(optX, optY, 11, { fill: '#10b981', stroke: '#fff', 'stroke-width': 2.5 }));
        svgEl.appendChild(svg.text(optX + 18, optY + 5, '⭐ Solusi Metaheuristik (Hemat 37%) [F = 0.849]', {
          fill: '#6ee7b7',
          'font-size': 13,
          'font-weight': 800
        }));

        // Panah pergerakan ke pojok kiri-bawah
        svgEl.appendChild(svg.path(`M ${lptX} ${lptY + 16} Q ${lptX - 25} ${(lptY + optY) / 2} ${optX - 14} ${optY - 6}`, {
          stroke: '#fbbf24',
          'stroke-width': 2.5,
          fill: 'none',
          'stroke-dasharray': '5,4'
        }));

        // Titik Ideal
        svgEl.appendChild(svg.circle(ox, oy, 5, { fill: '#6366f1' }));
        svgEl.appendChild(svg.text(ox + 8, oy - 8, 'Utopian Point (0,0)', { fill: '#818cf8', 'font-size': 10 }));

        canvas.appendChild(svgEl);
      }
    }
  ]
});

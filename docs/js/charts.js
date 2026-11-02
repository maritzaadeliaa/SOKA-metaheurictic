/**
 * charts.js [O4]
 * Tujuan:
 *  (1) Inject CSS berprefix `o4-` -> style.css milik O1 tidak boleh diedit.
 *  (2) Charts.renderComparisonBar: bar chart TS vs FPA, dark theme, DPR-aware.
 *
 * Urutan load (index.html): slides-arch.js -> ... -> charts.js -> slides-compare.js
 * Aman: Slides.init() baru jalan di DOMContentLoaded, seluruh script sudah termuat,
 * jadi CSS yang di-inject di sini sudah ada sebelum enter() slide manapun dipanggil.
 */
(function () {
  "use strict";

  /* ========================================================================
     1. CSS (semua class berawalan o4-). Reuse class milik O1 yang sudah ada:
        .slide-content .slide-header-box .slide-category .slide-heading
        .slide-subheading .glass-card .fade-in .slide-up
     ======================================================================== */
  const CSS = `
    .o4-body{flex:1;display:flex;gap:22px;min-height:0;align-items:center}
    .o4-col{flex:1;min-width:0;display:flex;flex-direction:column;gap:14px}
    .o4-card{background:rgba(30,41,59,.6);border:1px solid var(--border-subtle);border-radius:14px;padding:16px 20px}
    .o4-card.ts{border-left:4px solid var(--color-ts)}
    .o4-card.fpa{border-left:4px solid var(--color-fpa)}
    .o4-k{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:700;margin-bottom:6px}
    .o4-sub{font-size:14px;color:var(--text-muted);margin-top:4px;line-height:1.5}
    .o4-sub b{color:var(--text-main)}
    .o4-big{font-family:var(--font-mono);font-size:28px;font-weight:800;color:var(--text-main)}
    .o4-ts{color:var(--color-ts)} .o4-fpa{color:var(--color-fpa)}
    .o4-good{color:#34d399} .o4-bad{color:#f87171}

    .o4-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:100%}
    .o4-stat{background:rgba(30,41,59,.6);border:1px solid var(--border-subtle);border-radius:14px;padding:22px 16px;text-align:center}
    .o4-stat b{display:block;font-family:var(--font-mono);font-size:44px;font-weight:800;color:var(--text-main)}
    .o4-stat span{display:block;margin-top:6px;font-size:13px;color:var(--text-muted);font-weight:600}

    .o4-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;border:1px solid var(--border-subtle);font-size:13px;font-weight:700;color:var(--text-muted)}
    .o4-chip.ts{border-color:var(--color-ts);color:var(--color-ts);background:rgba(245,158,11,.12)}
    .o4-chip.fpa{border-color:var(--color-fpa);color:var(--color-fpa);background:rgba(236,72,153,.12)}
    .o4-chips{display:flex;gap:8px;flex-wrap:wrap}

    .o4-toggle{display:inline-flex;gap:6px}
    .o4-toggle button{background:rgba(30,41,59,.8);border:1px solid var(--border-subtle);color:var(--text-muted);padding:6px 14px;border-radius:999px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
    .o4-toggle button.on{border-color:var(--color-primary);color:#fff;background:rgba(99,102,241,.3)}

    .o4-table{width:100%;border-collapse:separate;border-spacing:0 6px;font-size:15px;color:var(--text-main)}
    .o4-table th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);text-align:left;padding:0 14px;font-weight:700}
    .o4-table td{background:rgba(30,41,59,.6);padding:10px 14px;font-family:var(--font-mono);font-size:14px}
    .o4-table td:first-child{border-radius:10px 0 0 10px;font-family:var(--font-family);font-weight:700}
    .o4-table td:last-child{border-radius:0 10px 10px 0}
    .o4-table tr.win td{box-shadow:inset 0 0 0 1px rgba(52,211,153,.35)}

    .o4-hostgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;width:100%}
    .o4-host{background:rgba(30,41,59,.6);border:1.5px solid var(--border-subtle);border-radius:12px;padding:10px;text-align:center;font-size:12px;color:var(--text-muted)}
    .o4-host b{display:block;font-size:14px;color:var(--text-main);margin-bottom:2px}
    .o4-host.hp{border-color:var(--color-vm-compute)}
    .o4-host.std{border-color:var(--color-vm-standard)}
    .o4-vms{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-top:8px;min-height:22px}
    .o4-vm{width:22px;height:22px;border-radius:5px;font-size:11px;font-weight:800;color:#0f172a;display:flex;align-items:center;justify-content:center}
    .o4-vm.c{background:var(--color-vm-compute)}
    .o4-vm.s{background:var(--color-vm-standard)}
    .o4-vm.l{background:var(--color-vm-light)}

    .o4-hist{display:flex;align-items:flex-end;gap:18px;height:180px;padding:0 10px}
    .o4-hist .bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%;font-size:13px;color:var(--text-muted);font-weight:700}
    .o4-hist .bar i{display:block;width:100%;border-radius:8px 8px 0 0;height:0;transition:height 1s cubic-bezier(.16,1,.3,1)}

    .o4-chart{background:#0f172a;border:1px solid var(--border-subtle);border-radius:16px;padding:8px;display:flex;justify-content:center}
    .o4-chart canvas{display:block}

    .o4-in{opacity:0;animation:o4In .5s cubic-bezier(.16,1,.3,1) forwards;animation-delay:var(--d,0s)}
    @keyframes o4In{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  `;
  if (!document.getElementById("o4-style")) {
    const st = document.createElement("style");
    st.id = "o4-style";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ========================================================================
     2. CHART
     ======================================================================== */
  // Warna disinkronkan dengan variabel CSS tim (--color-ts / --color-fpa)
  const css = getComputedStyle(document.documentElement);
  const COLOR = {
    ts: (css.getPropertyValue("--color-ts") || "#f59e0b").trim(),
    fpa: (css.getPropertyValue("--color-fpa") || "#ec4899").trim(),
    text: "#f8fafc",
    muted: "#94a3b8",
    grid: "rgba(148,163,184,0.15)",
    axis: "rgba(148,163,184,0.45)",
  };
  const FONT = "'Inter', -apple-system, 'Segoe UI', sans-serif";

  // Format angka lokal id-ID; presisi menyesuaikan magnitudo (throughput 0.24, imbalance 0.0057)
  function fmt(v) {
    if (!Number.isFinite(v)) return "n/a";
    const a = Math.abs(v);
    const d = a >= 1000 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.1 ? 3 : 4;
    return v.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: d,
    });
  }

  window.Charts = {
    fmt,
    colors: COLOR,

    /**
     * @param {string} canvasId
     * @param {string[]} labels
     * @param {number[]} dataTS
     * @param {number[]} dataFPA
     * @param {string} unit   label satuan, ditampilkan di pojok kiri-atas
     * @param {{showDelta?:boolean}} opts  showDelta: tampilkan selisih FPA vs TS (%) di bawah label
     */
    renderComparisonBar(
      canvasId,
      labels,
      dataTS,
      dataFPA,
      unit = "",
      opts = {},
    ) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      // Ukuran logis disimpan di dataset: canvas.width akan ditimpa oleh skala DPR,
      // sehingga re-render tanpa dataset akan membaca ukuran yang sudah dikali DPR.
      const W = +canvas.dataset.w || canvas.width;
      const H = +canvas.dataset.h || canvas.height;
      canvas.dataset.w = W;
      canvas.dataset.h = H;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      const g = canvas.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Token: animasi lama berhenti sendiri jika step berpindah / canvas dirender ulang
      const token = (canvas._o4tok = (canvas._o4tok || 0) + 1);
      const showDelta = opts.showDelta !== false;
      const L = 84,
        R = 24,
        T = 46,
        B = showDelta ? 70 : 46;
      const cw = W - L - R;
      const ch = H - T - B;
      const safe = (v) => (Number.isFinite(v) ? v : 0);
      const maxVal =
        Math.max(...dataTS.map(safe), ...dataFPA.map(safe), 1e-9) * 1.2;
      const t0 = performance.now();
      const DUR = 700;

      function frame(now) {
        if (canvas._o4tok !== token || !canvas.isConnected) return;
        const p = Math.min(1, (now - t0) / DUR);
        const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        g.clearRect(0, 0, W, H);

        // Grid + label sumbu Y
        const ticks = 4;
        g.font = `11px ${FONT}`;
        g.textAlign = "right";
        for (let i = 0; i <= ticks; i++) {
          const y = T + ch - (ch / ticks) * i;
          g.strokeStyle = i === 0 ? COLOR.axis : COLOR.grid;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(L, y);
          g.lineTo(W - R, y);
          g.stroke();
          g.fillStyle = COLOR.muted;
          g.fillText(fmt((maxVal / ticks) * i), L - 8, y + 4);
        }

        // Satuan sumbu Y
        if (unit) {
          g.textAlign = "left";
          g.fillStyle = COLOR.muted;
          g.font = `700 12px ${FONT}`;
          g.fillText(`Satuan: ${unit}`, L, 22);
        }

        // Batang
        const n = labels.length;
        const gw = cw / n;
        const bw = Math.min(gw * 0.3, 56);
        const gap = 8;
        labels.forEach((lab, i) => {
          const gx = L + i * gw + (gw - (bw * 2 + gap)) / 2;
          [
            [dataTS[i], COLOR.ts, gx],
            [dataFPA[i], COLOR.fpa, gx + bw + gap],
          ].forEach(([v, col, x]) => {
            const val = safe(v);
            const h = (val / maxVal) * ch * e;
            const y = T + ch - h;
            g.fillStyle = col;
            g.beginPath();
            // rounded top corners
            const r = Math.min(6, bw / 2, h);
            g.moveTo(x, T + ch);
            g.lineTo(x, y + r);
            g.quadraticCurveTo(x, y, x + r, y);
            g.lineTo(x + bw - r, y);
            g.quadraticCurveTo(x + bw, y, x + bw, y + r);
            g.lineTo(x + bw, T + ch);
            g.closePath();
            g.fill();

            if (p > 0.6) {
              g.globalAlpha = (p - 0.6) / 0.4;
              g.fillStyle = COLOR.text;
              g.font = `700 11px ${FONT}`;
              g.textAlign = "center";
              g.fillText(fmt(v), x + bw / 2, y - 6);
              g.globalAlpha = 1;
            }
          });

          // Label kategori
          const cx = gx + bw + gap / 2;
          g.fillStyle = COLOR.text;
          g.font = `600 12px ${FONT}`;
          g.textAlign = "center";
          g.fillText(lab, cx, T + ch + 20);

          // Delta FPA relatif terhadap TS (netral: tidak menyatakan baik/buruk,
          // karena arah "baik" tergantung metrik)
          if (
            showDelta &&
            Number.isFinite(dataTS[i]) &&
            Number.isFinite(dataFPA[i]) &&
            dataTS[i] !== 0
          ) {
            const d = ((dataFPA[i] - dataTS[i]) / Math.abs(dataTS[i])) * 100;
            g.fillStyle = COLOR.muted;
            g.font = `11px ${FONT}`;
            g.fillText(
              `FPA vs TS: ${d > 0 ? "+" : ""}${d.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`,
              cx,
              T + ch + 38,
            );
          }
        });

        // Legend
        const lx = W - R - 190;
        g.textAlign = "left";
        g.font = `700 12px ${FONT}`;
        g.fillStyle = COLOR.ts;
        g.fillRect(lx, 12, 12, 12);
        g.fillStyle = COLOR.text;
        g.fillText("Tabu Search", lx + 18, 22);
        g.fillStyle = COLOR.fpa;
        g.fillRect(lx + 108, 12, 12, 12);
        g.fillStyle = COLOR.text;
        g.fillText("FPA", lx + 126, 22);

        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    },
  };
})();

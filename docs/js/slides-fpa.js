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

/**
 * ----------------------------------------------------------------------------
 * CATATAN IMPLEMENTASI
 * ----------------------------------------------------------------------------
 * POLA: fpaToy() dijalankan SEKALI (lazy) dengan RNG berseed lokal (TOY.createRng),
 * semua kejadian disimpan sebagai events/snaps, slide hanya memutar hasilnya.
 * Slide 6 dan 7 memakai satu run yang sama, jadi bunga yang tampil adalah bunga yang sama.
 *
 * Parameter toy (disederhanakan)      vs   parameter asli simulasi:
 *   populasi : 5 bunga                     20 bunga
 *   iterasi  : 12                          80
 *   p, gamma, beta: 0.8, 0.1, 1.5          sama
 *   awal     : bunga 0 = LPT, lainnya LPT + 3 task diacak
 * Debug di console: FPA_TOY.run(FPA_TOY.params)
 * ----------------------------------------------------------------------------
 */
(function () {
  "use strict";

  const TOY = window.TOY;
  const P = {
    pop: 5,
    iters: 12,
    p: 0.8,
    gamma: 0.1,
    beta: 1.5,
    mutations: 3,
    seed: 14,
  };
  const SIGMA_U = 0.6965745;
  const PINK = "#ec4899";
  const CYAN = "#22d3ee";
  const GOLD = "#fbbf24";
  const GREEN = "#10b981";
  const RED = "#ef4444";
  const VM_CHIP = ["C", "S", "L"];
  const VM_NAME = ["Compute", "Standard", "Light"];
  const f4 = (x) => x.toFixed(4);
  const f2 = (x) => x.toFixed(2);
  const clone = (a) => a.map((x) => x.slice());
  const argmin = (a) => a.reduce((m, x, i) => (x < a[m] ? i : m), 0);

  /* ======================================================================
     1. LOGIKA TOY: FLOWER POLLINATION (rujukan: FlowerPollinationScheduler)
     ====================================================================== */
  function makeLevy(rng, beta) {
    const gauss = () => {
      const u = rng() || 1e-12;
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
    };
    return () => {
      const u = gauss() * SIGMA_U;
      let v = gauss();
      if (Math.abs(v) < 1e-10) v = 1e-10;
      return u / Math.pow(Math.abs(v), 1 / beta); // Mantegna
    };
  }

  function fpaToy(opt) {
    const rng = TOY.createRng(opt.seed);
    const levy = makeLevy(rng, opt.beta);
    const n = TOY.tasks.length;
    const m = TOY.vms.length;
    const lpt = TOY.lptInitial();
    const pop = [lpt.slice()];

    for (let i = 1; i < opt.pop; i++) {
      const c = lpt.slice();
      const picked = new Set();
      while (picked.size < opt.mutations) picked.add(Math.floor(rng() * n));
      picked.forEach((t) => {
        c[t] = (c[t] + 1 + Math.floor(rng() * (m - 1))) % m;
      });
      pop.push(c);
    }

    const fit = pop.map((a) => TOY.evaluate(a).fitness);
    let gIdx = argmin(fit);
    let g = pop[gIdx].slice();
    let gF = fit[gIdx];
    let records = 0;
    const snaps = [
      {
        iter: 0,
        pop: clone(pop),
        fit: fit.slice(),
        g: g.slice(),
        gF,
        gIdx,
        record: false,
      },
    ];
    const events = [];

    for (let it = 1; it <= opt.iters; it++) {
      let record = false;
      for (let i = 0; i < opt.pop; i++) {
        const ev = {
          iter: it,
          i,
          popBefore: clone(pop),
          fitBefore: fit.slice(),
          gBefore: g.slice(),
          gFBefore: gF,
          gIdxBefore: gIdx,
          old: pop[i].slice(),
          fOld: fit[i],
        };
        const r = rng();
        const cand = pop[i].slice();
        ev.r = r;
        ev.glob = r < opt.p;
        ev.src = new Array(n).fill("keep");

        if (ev.glob) {
          const L = levy();
          const ip = Math.min(1, Math.abs(L) * opt.gamma + 0.35);
          ev.levy = L;
          ev.ip = ip;
          for (let d = 0; d < n; d++) {
            if (rng() < ip) {
              cand[d] = g[d];
              ev.src[d] = "g";
            }
          }
        } else {
          const j = Math.floor(rng() * opt.pop);
          let k = Math.floor(rng() * opt.pop);
          while (k === j) k = Math.floor(rng() * opt.pop);
          const eps = rng();
          ev.j = j;
          ev.k = k;
          ev.eps = eps;
          for (let d = 0; d < n; d++) {
            if (pop[j][d] === pop[k][d]) {
              cand[d] = pop[j][d];
              ev.src[d] = "same";
            } else if (eps < 0.5) {
              cand[d] = pop[j][d];
              ev.src[d] = "j";
            } else {
              cand[d] = pop[k][d];
              ev.src[d] = "k";
            }
          }
        }

        ev.cand = cand;
        ev.fNew = TOY.evaluate(cand).fitness;
        ev.changed = cand
          .map((v, d) => (v !== ev.old[d] ? d : -1))
          .filter((d) => d >= 0);
        ev.acc = ev.fNew < fit[i] - 1e-12;
        ev.newRecord = false;
        if (ev.acc) {
          pop[i] = cand;
          fit[i] = ev.fNew;
          if (ev.fNew < gF - 1e-12) {
            g = cand.slice();
            gF = ev.fNew;
            gIdx = i;
            ev.newRecord = true;
            record = true;
            records++;
          }
        }
        events.push(ev);
      }
      snaps.push({
        iter: it,
        pop: clone(pop),
        fit: fit.slice(),
        g: g.slice(),
        gF,
        gIdx,
        record,
      });
    }

    const lrng = TOY.createRng(opt.seed + 101);
    const lv = makeLevy(lrng, opt.beta);
    const steps = [];
    for (let s = 0; s < 46; s++)
      steps.push({ len: Math.abs(lv()), ang: lrng() * Math.PI * 2 });
    return { events, snaps, best: g, bestF: gF, records, lpt, steps };
  }

  let _run = null;
  const getRun = () => _run || (_run = fpaToy(P));

  function pickDemos(run) {
    const ev = run.events;
    const gl =
      ev.find(
        (e) => e.glob && e.acc && e.i !== e.gIdxBefore && e.changed.length >= 2,
      ) ||
      ev.find((e) => e.glob && e.i !== e.gIdxBefore && e.changed.length >= 1);
    const lo =
      ev.find((e) => !e.glob && e.acc && e.changed.length >= 2) ||
      ev.find((e) => !e.glob && e.changed.length >= 1);
    const rj =
      ev.find((e) => !e.glob && !e.acc && e.changed.length >= 2) ||
      ev.find((e) => !e.acc && e.changed.length >= 2) ||
      ev.find((e) => !e.acc && e.changed.length >= 1);
    return { gl, lo, rj };
  }

  window.FPA_TOY = { run: fpaToy, params: P, pickDemos };

  /* ======================================================================
     2. CSS (semua kelas berawalan fp-)
     ====================================================================== */
  (function injectStyle() {
    if (document.getElementById("fp-style")) return;
    const st = document.createElement("style");
    st.id = "fp-style";
    st.textContent = `
      .fp-cap{font-size:19px;color:var(--text-muted);margin:0 0 10px;min-height:28px}
      .fp-cap b{color:var(--color-fpa)}
      .fp-body{flex:1;display:flex;gap:20px;min-height:0;align-items:center}
      .fp-foot{position:absolute;left:56px;right:56px;bottom:12px;font-size:12.5px;color:var(--text-dim);font-family:var(--font-mono);display:flex;gap:16px;flex-wrap:wrap}
      .fp-foot b{color:var(--color-fpa);font-weight:700}
      .fp-board{background:#0f172a;border:1px solid var(--border-subtle);border-radius:16px;padding:8px}
      .fp-board svg{display:block;width:100%;height:auto}
      .fp-in{opacity:0;animation:fpIn .5s cubic-bezier(.16,1,.3,1) forwards;animation-delay:var(--d,0s)}
      @keyframes fpIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
      @keyframes fpPop{0%{transform:scale(0) rotate(-40deg);opacity:0}70%{transform:scale(1.25) rotate(8deg)}100%{transform:scale(1);opacity:1}}
      @keyframes fpPulse{0%,100%{box-shadow:0 0 0 rgba(251,191,36,0)}50%{box-shadow:0 0 22px rgba(251,191,36,.55)}}
      .fp-cards{display:flex;gap:14px;width:100%;justify-content:center;align-items:stretch}
      .fp-card{flex:1;max-width:232px;background:rgba(30,41,59,.65);border:1.5px solid var(--border-subtle);border-radius:14px;padding:12px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;transition:opacity .4s,border-color .4s}
      .fp-card .nm{font-size:14px;font-weight:800;color:var(--text-main);display:flex;align-items:center;gap:6px}
      .fp-card .fv{font-family:var(--font-mono);font-size:15px;font-weight:800;color:#fbbf24}
      .fp-card.gbest{border-color:${GOLD};animation:fpPulse 2s infinite}
      .fp-card.dim{opacity:.5}
      .fp-card.ri{border-color:${PINK};background:rgba(236,72,153,.12)}
      .fp-card.rj{border-color:${CYAN};background:rgba(34,211,238,.1)}
      .fp-star{position:absolute;top:-14px;right:-8px;font-size:32px;color:${GOLD};filter:drop-shadow(0 0 8px ${GOLD});animation:fpPop .6s forwards}
      .fp-role{position:absolute;top:-12px;left:10px;font-size:13px;font-weight:800;padding:2px 10px;border-radius:999px;color:#0f172a;animation:fpPop .5s forwards}
      .fp-chips{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px;font-size:13px;color:var(--text-muted)}
      .fp-chips span{display:inline-flex;align-items:center;gap:6px}
      .fp-vm{display:inline-flex;align-items:center;justify-content:center;border-radius:7px;font-weight:800;color:#0f172a;width:30px;height:30px;font-size:14px}
      .fp-vm.s{width:22px;height:22px;font-size:12px;border-radius:5px}
      .fp-bar{position:relative;display:flex;height:64px;border-radius:14px;overflow:hidden;border:1px solid var(--border-subtle);background:#0f172a}
      .fp-seg{display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#0f172a;width:0;transition:width 1s cubic-bezier(.16,1,.3,1);white-space:nowrap;overflow:hidden}
      .fp-seg.g{background:${PINK}}.fp-seg.l{background:${CYAN}}
      .fp-track{position:relative;height:100px;margin-top:6px}
      .fp-mark{position:absolute;top:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;font-size:13px;font-weight:700}
      .fp-mark i{width:3px;height:44px;border-radius:2px}
      .fp-mark .dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#0f172a;margin-top:-2px}
      .fp-ticks{position:relative;height:18px;font-size:12px;color:var(--text-dim);font-family:var(--font-mono)}
      .fp-ticks span{position:absolute;transform:translateX(-50%)}
      .fp-res{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}
      .fp-res div{flex:1;min-width:150px;padding:10px 12px;border-radius:10px;background:rgba(30,41,59,.6);border:1px solid var(--border-subtle);font-size:14px;color:var(--text-main)}
      .fp-res b{font-family:var(--font-mono)}
      .fp-side{flex:1;display:flex;flex-direction:column;gap:12px;min-width:0}
      .fp-card2{background:rgba(30,41,59,.6);border:1px solid var(--border-subtle);border-radius:14px;padding:14px 16px}
      .fp-k{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:700;margin-bottom:6px}
      .fp-big{font-family:var(--font-mono);font-size:28px;font-weight:800;color:var(--text-main)}
      .fp-sub{font-size:14px;color:var(--text-muted);margin-top:4px}
      .fp-trio{display:flex;align-items:center;gap:6px;justify-content:center}
      .fp-trio .it{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--text-main)}
      .fp-trio .ar{font-size:30px;color:${PINK};font-weight:800}
      .fp-trio .fv{font-family:var(--font-mono);font-size:14px;color:#fbbf24}
      .fp-tag{display:inline-block;min-width:28px;text-align:center;padding:1px 7px;border-radius:6px;color:#0f172a;font-weight:800;font-size:12px}
      .fp-tbl{width:100%;border-collapse:separate;border-spacing:6px;font-size:15px}
      .fp-tbl th{font-size:13px;color:var(--text-muted);font-weight:700;text-align:center}
      .fp-tbl td.lab{text-align:right;font-weight:800;color:var(--text-main);padding-right:6px;white-space:nowrap}
      .fp-tbl td{text-align:center;position:relative}
      .fp-tbl td .fp-vm{width:52px;height:52px;font-size:20px;border-radius:10px}
      .fp-tbl td small{display:block;font-size:11px;font-weight:800;margin-top:2px}
      .fp-pair{display:flex;gap:18px;width:100%}
      .fp-case{flex:1;border-radius:16px;padding:16px;background:rgba(30,41,59,.6);border:2px solid var(--border-subtle);display:flex;flex-direction:column;gap:12px;align-items:center}
      .fp-case.ok{border-color:${GREEN};background:rgba(16,185,129,.1)}
      .fp-case.no{border-color:${RED};background:rgba(239,68,68,.1)}
      .fp-case .hd{font-size:14px;font-weight:700;color:var(--text-muted)}
      .fp-case .vd{font-size:22px;font-weight:800}
      .fp-case.ok .vd{color:#34d399}.fp-case.no .vd{color:#f87171}
      .fp-case .fm{font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-main)}
      .fp-metrics{display:flex;gap:8px;margin-top:8px}
      .fp-metrics .m{flex:1;background:rgba(15,23,42,.7);border:1px solid var(--border-subtle);border-radius:10px;padding:8px 8px;text-align:center}
      .fp-metrics .m span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);font-weight:700}
      .fp-metrics .m b{font-family:var(--font-mono);font-size:16px;color:var(--text-main)}
      .fp-ttl{font-size:16px;font-weight:800;margin:2px 4px 6px}
      .fp-pill{display:inline-block;margin:0 auto;padding:8px 22px;border-radius:999px;border:2px solid ${GREEN};background:rgba(16,185,129,.14);color:#6ee7b7;font-family:var(--font-mono);font-weight:800;font-size:20px}
    `;
    document.head.appendChild(st);
  })();

  /* ======================================================================
     3. HELPER
     ====================================================================== */
  let TOKEN = 0;
  const FOOT = `<span><b>Toy</b> ${P.pop} bunga · ${P.iters} iterasi</span><span><b>Simulasi asli</b> 20 bunga · 80 iterasi · p = 0.8 · γ = 0.1 · β = 1.5 (Mantegna)</span>`;

  function tween(ms, fn, alive) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      function frame(now) {
        if (alive && !alive()) return resolve();
        const p = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        fn(e, p);
        if (p < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function scaffold(ctx, cat, title, caption) {
    ctx.root.innerHTML = `
      <div class="slide-content fade-in">
        <div class="slide-header-box" style="margin-bottom:8px;">
          <div class="slide-category" style="color:var(--color-fpa)">${cat}</div>
          <h2 class="slide-heading" style="font-size:30px">${title}</h2>
        </div>
        <div class="fp-cap">${caption}</div>
        <div class="fp-body"></div>
        <div class="fp-foot">${FOOT}</div>
      </div>`;
    const body = ctx.root.querySelector(".fp-body");
    const tok = ++TOKEN;
    return { body, alive: () => tok === TOKEN && body.isConnected };
  }

  const taskTag = (t) =>
    `<span class="fp-tag" style="background:${TOY.taskColors[t]}">T${t}</span>`;
  const vmChip = (j, small) =>
    `<span class="fp-vm${small ? " s" : ""}" style="background:${TOY.vms[j].hexColor}">${VM_CHIP[j]}</span>`;

  function flowerSvg(size, color) {
    const r = size / 2;
    let petals = "";
    for (let k = 0; k < 6; k++) {
      petals += `<ellipse cx="${r}" cy="${r * 0.55}" rx="${r * 0.3}" ry="${r * 0.48}" fill="${color}" fill-opacity=".92" transform="rotate(${k * 60} ${r} ${r})"/>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${petals}<circle cx="${r}" cy="${r}" r="${r * 0.26}" fill="${GOLD}"/></svg>`;
  }

  /** Mini diagram penugasan: 3 kolom VM, balok task setinggi waktu eksekusi. */
  function miniSvg(assign, W, H, hl) {
    const e = TOY.evaluate(assign);
    const pad = 4,
      gap = 4;
    const colW = (W - pad * 2 - gap * 2) / 3;
    const area = H - 20;
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#0f172a;border-radius:10px">`;
    for (let j = 0; j < 3; j++) {
      const x = pad + j * (colW + gap);
      s += `<rect x="${x}" y="4" width="${colW}" height="${H - 8}" rx="6" fill="rgba(30,41,59,.55)" stroke="${j === e.bottleneckVm ? RED : "rgba(148,163,184,.2)"}" stroke-width="${j === e.bottleneckVm ? 1.6 : 1}"/>`;
      s += `<rect x="${x}" y="4" width="${colW}" height="11" rx="5" fill="${TOY.vms[j].hexColor}"/>`;
      let y = H - 8;
      for (const t of e.vmTaskLists[j]) {
        const h = Math.max(
          6,
          (TOY.tasks[t] / TOY.vms[j].mips / Math.max(90, e.makespan)) * area,
        );
        y -= h;
        const on = hl && hl.includes(t);
        s += `<rect x="${x + 4}" y="${y}" width="${colW - 8}" height="${h - 2}" rx="3" fill="${TOY.taskColors[t]}" stroke="${on ? "#fff" : "none"}" stroke-width="${on ? 2 : 0}"/>`;
      }
    }
    return s + "</svg>";
  }

  function cardsHTML(pop, fit, o) {
    o = o || {};
    return pop
      .map((a, i) => {
        const cls = ["fp-card"];
        let role = "";
        if (o.gIdx === i && o.star) cls.push("gbest");
        else if (o.dimOthers) cls.push("dim");
        if (o.roles && o.roles[i]) {
          const r = o.roles[i];
          cls.push(r === "i" ? "ri" : "rj");
          role = `<span class="fp-role" style="background:${r === "i" ? PINK : CYAN};animation-delay:${0.2 + i * 0.05}s">${r === "i" ? "i" : r}</span>`;
        }
        const star =
          o.gIdx === i && o.star
            ? `<span class="fp-star" style="animation-delay:.3s">★</span>`
            : "";
        const delay = o.stagger ? `style="--d:${i * 0.12}s"` : "";
        return `<div class="${cls.join(" ")}${o.stagger ? " fp-in" : ""}" ${delay}>
        ${star}${role}
        <div class="nm">${flowerSvg(24, PINK)} Bunga ${i + 1}${i === 0 && o.lptTag ? ' <small style="color:var(--text-muted);font-weight:600">(LPT)</small>' : ""}</div>
        ${miniSvg(a, 196, 176, o.hl && o.hl[i])}
        <div class="fv">F = ${f4(fit[i])}</div>
      </div>`;
      })
      .join("");
  }

  const vmLegend = `<div class="fp-chips">${TOY.vms.map((v, j) => `<span>${vmChip(j, true)} VM ${j} ${VM_NAME[j]}</span>`).join("")}<span>balok = task, tinggi = waktu eksekusi</span></div>`;

  /* ======================================================================
     4. SLIDE 6
     ====================================================================== */
  function petalGroup(x, y, r, color) {
    let p = "";
    for (let k = 0; k < 6; k++)
      p += `<ellipse cx="${x}" cy="${y - r * 0.55}" rx="${r * 0.3}" ry="${r * 0.5}" fill="${color}" fill-opacity=".92" transform="rotate(${k * 60} ${x} ${y})"/>`;
    return `<g>${p}<circle cx="${x}" cy="${y}" r="${r * 0.26}" fill="${GOLD}"/></g>`;
  }

  function stepGarden(ctx) {
    const S = scaffold(
      ctx,
      "FPA · Inspirasi alam",
      "Penyerbukan bunga",
      "Bunga tidak bisa berjalan. Serbuk sarinya yang berpindah, jauh atau dekat.",
    );
    const fl = [
      [170, 290, 32],
      [360, 322, 28],
      [560, 300, 32],
      [706, 332, 28],
      [860, 300, 32],
    ];
    let stems = "";
    let flowers = "";
    fl.forEach(([x, y, r]) => {
      stems += `<line x1="${x}" y1="${y + r * 0.6}" x2="${x}" y2="372" stroke="#166534" stroke-width="5"/>`;
      flowers += petalGroup(x, y, r, PINK);
    });
    stems += `<line x1="940" y1="216" x2="940" y2="372" stroke="#166534" stroke-width="7"/>`;
    S.body.innerHTML = `
      <div class="fp-board" style="flex:1"><svg viewBox="0 0 1100 400">
        <defs><linearGradient id="fpSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#172554"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>
        <rect width="1100" height="400" rx="14" fill="url(#fpSky)"/>
        <path d="M0 362 Q300 336 550 356 T1100 344 L1100 400 L0 400Z" fill="#14532d" opacity=".6"/>
        ${stems}${flowers}${petalGroup(940, 170, 46, PINK)}
        <path d="M940 112 l7 15 17 2 -12 12 3 17 -15 -8 -15 8 3 -17 -12 -12 17 -2z" fill="${GOLD}"/>
        <path id="fpBee1" d="M170 268 C 330 30, 760 30, 930 150" fill="none" stroke="${PINK}" stroke-width="3" stroke-dasharray="10 8"/>
        <path id="fpBee2" d="M360 300 C 500 110, 700 120, 896 168" fill="none" stroke="${PINK}" stroke-width="3" stroke-dasharray="10 8"/>
        <path id="fpWnd1" d="M205 296 q16 -20 32 0 t32 0 t32 0 t32 0 t32 0" fill="none" stroke="${CYAN}" stroke-width="3"/>
        <path id="fpWnd2" d="M590 306 q16 -20 32 0 t32 0 t32 0" fill="none" stroke="${CYAN}" stroke-width="3"/>
        <g id="fpBeeA"><ellipse rx="11" ry="8" fill="${GOLD}"/><ellipse cx="-4" cy="-9" rx="8" ry="5" fill="#fff" opacity=".8"/></g>
        <g id="fpBeeB"><ellipse rx="11" ry="8" fill="${GOLD}"/><ellipse cx="-4" cy="-9" rx="8" ry="5" fill="#fff" opacity=".8"/></g>
        <circle id="fpDustA" r="6" fill="${CYAN}"/><circle id="fpDustB" r="6" fill="${CYAN}"/>
        <rect x="26" y="22" width="22" height="6" rx="3" fill="${PINK}"/>
        <text x="58" y="30" fill="#f8fafc" font-size="17" font-weight="700">Biotik: lebah, burung, terbang jauh (Lévy flight)</text>
        <rect x="26" y="52" width="22" height="6" rx="3" fill="${CYAN}"/>
        <text x="58" y="60" fill="#f8fafc" font-size="17" font-weight="700">Abiotik: angin, air, hanya ke sekitar</text>
        <text x="990" y="100" fill="${GOLD}" font-size="16" font-weight="800">g*</text>
      </svg></div>`;
    const q = (id) => S.body.querySelector("#" + id);
    const items = [
      { path: q("fpBee1"), el: q("fpBeeA"), per: 3600, off: 0 },
      { path: q("fpBee2"), el: q("fpBeeB"), per: 3600, off: 0.5 },
      { path: q("fpWnd1"), el: q("fpDustA"), per: 2000, off: 0 },
      { path: q("fpWnd2"), el: q("fpDustB"), per: 2000, off: 0.4 },
    ].map((it) => ({ ...it, len: it.path.getTotalLength() }));
    const t0 = performance.now();
    (function loop(now) {
      if (!S.alive()) return;
      items.forEach((it) => {
        const f = ((now - t0) / it.per + it.off) % 1;
        const pt = it.path.getPointAtLength(f * it.len);
        it.el.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
      });
      requestAnimationFrame(loop);
    })(t0);
  }

  function stepPopulation(ctx, withStar) {
    const run = getRun();
    const s0 = run.snaps[0];
    const S = scaffold(
      ctx,
      "FPA · Populasi",
      withStar ? "Bunga terbaik g*" : "Satu bunga = satu jadwal",
      withStar
        ? "g* = bunga dengan fitness F terkecil. Ia jadi arah lompatan."
        : `${P.pop} bunga (toy). Tiap bunga menugaskan 8 task ke 3 VM.`,
    );
    S.body.innerHTML = `<div style="width:100%"><div class="fp-cards">${cardsHTML(s0.pop, s0.fit, { gIdx: s0.gIdx, star: withStar, dimOthers: withStar, stagger: !withStar, lptTag: true })}</div>${vmLegend}</div>`;
  }

  function stepSwitch(ctx) {
    const run = getRun();
    const evs = run.events.filter((e) => e.iter === 1);
    const S = scaffold(
      ctx,
      "FPA · Switch probability",
      "Global atau lokal?",
      "Tiap bunga mengundi r. Jika r < p = 0.8, penyerbukan global, jika tidak lokal.",
    );
    S.body.innerHTML = `
      <div style="width:100%;padding:6px 8px">
        <div class="fp-bar"><div class="fp-seg g" id="fpSegG">Global (biotik) 80%</div><div class="fp-seg l" id="fpSegL">Lokal 20%</div></div>
        <div class="fp-ticks"><span style="left:0">0</span><span style="left:20%">0.2</span><span style="left:40%">0.4</span><span style="left:60%">0.6</span><span style="left:80%;color:${GOLD};font-weight:800">p = 0.8</span><span style="left:100%">1.0</span></div>
        <div class="fp-track" id="fpTrack">${evs
          .map(
            (e, k) => `
          <div class="fp-mark fp-in" style="left:${(e.r * 100).toFixed(1)}%;--d:${0.9 + k * 0.28}s"><i style="background:${e.glob ? PINK : CYAN}"></i><span class="dot" style="background:${e.glob ? PINK : CYAN}">${e.i + 1}</span></div>`,
          )
          .join("")}</div>
        <div class="fp-res">${evs.map((e, k) => `<div class="fp-in" style="--d:${1.0 + k * 0.28}s;border-color:${e.glob ? PINK : CYAN}"><b>Bunga ${e.i + 1}</b> · r = ${f2(e.r)}<br><span style="color:${e.glob ? "#f9a8d4" : "#67e8f9"};font-weight:800">${e.glob ? "Global" : "Lokal"}</span></div>`).join("")}</div>
      </div>`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const g = S.body.querySelector("#fpSegG");
        const l = S.body.querySelector("#fpSegL");
        if (g && l) {
          g.style.width = "80%";
          l.style.width = "20%";
        }
      }),
    );
  }

  function stepGlobal(ctx) {
    const run = getRun();
    const { gl } = pickDemos(run);
    const S = scaffold(
      ctx,
      "FPA · Global pollination",
      "Lévy flight menuju g*",
      "Banyak lompatan pendek, sesekali satu lompatan jauh. Task meniru VM milik g*.",
    );
    const steps = run.steps;
    let x = 0,
      y = 0;
    const pts = [[0, 0]];
    steps.forEach((s) => {
      const L = Math.min(s.len, 6) * 40;
      x += Math.cos(s.ang) * L;
      y += Math.sin(s.ang) * L;
      pts.push([x, y]);
    });
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const W = 520,
      H = 400,
      pad = 34;
    const sc = Math.min(
      (W - pad * 2) / Math.max(1, maxX - minX),
      (H - pad * 2) / Math.max(1, maxY - minY),
    );
    const px = (v) =>
      pad + (v - minX) * sc + (W - pad * 2 - (maxX - minX) * sc) / 2;
    const py = (v) =>
      pad + (v - minY) * sc + (H - pad * 2 - (maxY - minY) * sc) / 2;
    const lens = steps.map((s) => Math.min(s.len, 6) * 40 * sc);
    const med = lens.slice().sort((a, b) => a - b)[Math.floor(lens.length / 2)];
    const thr = Math.max(med * 3.2, 40);
    let longest = 0;
    lens.forEach((l, k) => {
      if (l > lens[longest]) longest = k;
    });
    let lines = "";
    steps.forEach((s, k) => {
      const big = lens[k] >= thr;
      lines += `<line class="fpL" x1="${px(pts[k][0]).toFixed(1)}" y1="${py(pts[k][1]).toFixed(1)}" x2="${px(pts[k + 1][0]).toFixed(1)}" y2="${py(pts[k + 1][1]).toFixed(1)}" stroke="${big ? PINK : "#94a3b8"}" stroke-width="${big ? 4 : 2}" stroke-linecap="round" opacity="0"/>`;
    });
    const lx = (px(pts[longest][0]) + px(pts[longest + 1][0])) / 2;
    const ly = (py(pts[longest][1]) + py(pts[longest + 1][1])) / 2;
    const tx = lx > W - 150 ? lx - 150 : lx + 12;
    const ty = Math.max(24, Math.min(H - 12, ly - 8));
    const changed = gl.changed;
    S.body.innerHTML = `
      <div class="fp-board" style="flex:0 0 520px"><svg viewBox="0 0 ${W} ${H}">
        <rect width="${W}" height="${H}" rx="12" fill="#0b1220"/>
        ${lines}
        <circle cx="${px(0)}" cy="${py(0)}" r="6" fill="${GOLD}"/>
        <text id="fpJump" x="${tx}" y="${ty}" fill="#f9a8d4" font-size="16" font-weight="800" opacity="0" stroke="#0b1220" stroke-width="5" paint-order="stroke">lompatan jauh</text>
        <text x="14" y="22" fill="#94a3b8" font-size="13">lintasan Lévy flight (β = 1.5)</text>
      </svg></div>
      <div class="fp-side">
        <div class="fp-card2 fp-in" style="--d:.2s">
          <div class="fp-k">Bunga ${gl.i + 1} meniru g*</div>
          <div class="fp-trio">
            <div class="it">${miniSvg(gl.old, 170, 150)}<span>Bunga ${gl.i + 1}</span><span class="fv">F = ${f4(gl.fOld)}</span></div>
            <div class="ar">+</div>
            <div class="it">${miniSvg(gl.gBefore, 170, 150)}<span style="color:${GOLD}">★ g* (bunga ${gl.gIdxBefore + 1})</span><span class="fv">F = ${f4(gl.gFBefore)}</span></div>
            <div class="ar">→</div>
            <div class="it">${miniSvg(gl.cand, 170, 150, changed)}<span>Bunga ${gl.i + 1} baru</span><span class="fv" style="color:${gl.acc ? "#34d399" : "#f87171"}">F = ${f4(gl.fNew)}</span></div>
          </div>
        </div>
        <div class="fp-card2 fp-in" style="--d:.5s">
          <div class="fp-k">Peluang tiap task meniru VM g*</div>
          <div class="fp-big">${f2(gl.ip)}</div>
          <div class="fp-sub">|L| = ${f2(Math.abs(gl.levy))}, γ = 0.1 → min(1, |L|·γ + 0.35)</div>
        </div>
        <div class="fp-card2 fp-in" style="--d:.8s">
          <div class="fp-k">Task yang pindah VM</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">${changed.map((t) => `<span style="display:inline-flex;align-items:center;gap:6px">${taskTag(t)} ${vmChip(gl.old[t], true)} → ${vmChip(gl.cand[t], true)}</span>`).join("") || '<span class="fp-sub">tidak ada</span>'}</div>
        </div>
      </div>`;
    const ln = [...S.body.querySelectorAll(".fpL")];
    const jump = S.body.querySelector("#fpJump");
    tween(
      1700,
      (e) => {
        const k = Math.floor(e * ln.length);
        ln.forEach((l, i) => {
          l.setAttribute("opacity", i <= k ? "1" : "0");
        });
        if (jump && k >= longest) jump.setAttribute("opacity", "1");
      },
      S.alive,
    );
  }

  /* ======================================================================
     5. SLIDE 7
     ====================================================================== */
  function stepLocalPick(ctx) {
    const run = getRun();
    const { lo } = pickDemos(run);
    const S = scaffold(
      ctx,
      "FPA · Local pollination",
      "Angin membawa serbuk sari ke dekat",
      `Peluang 20% (r = ${f2(lo.r)} ≥ 0.8). Pilih dua bunga acak, <b>j</b> dan <b>k</b>. Iterasi ${lo.iter}.`,
    );
    const roles = {};
    roles[lo.i] = "i";
    roles[lo.j] = "j";
    roles[lo.k] = "k";
    S.body.innerHTML = `<div style="width:100%"><div class="fp-cards">${cardsHTML(lo.popBefore, lo.fitBefore, { gIdx: lo.gIdxBefore, star: true, roles, lptTag: false, stagger: true })}</div>${vmLegend}</div>`;
  }

  function stepCrossover(ctx) {
    const run = getRun();
    const { lo } = pickDemos(run);
    const S = scaffold(
      ctx,
      "FPA · Crossover",
      "Task diambil dari j atau k",
      `ε = ${f2(lo.eps)}: bila VM j dan k berbeda, ambil ${lo.eps < 0.5 ? "dari <b>j</b> (ε < 0.5)" : "dari <b>k</b> (ε ≥ 0.5)"}.`,
    );
    const n = TOY.tasks.length;
    const A = lo.popBefore[lo.j];
    const B = lo.popBefore[lo.k];
    const head = Array.from(
      { length: n },
      (_, t) => `<th>${taskTag(t)}</th>`,
    ).join("");
    const row = (arr, who) =>
      `<tr><td class="lab" style="color:${CYAN}">${who}</td>${arr.map((v) => `<td>${vmChip(v)}</td>`).join("")}</tr>`;
    const newCells = lo.cand
      .map((v, d) => {
        const s = lo.src[d];
        const lab =
          s === "same" ? "=" : s === "j" ? "← j" : s === "k" ? "← k" : "";
        const col = s === "j" || s === "k" ? CYAN : "#94a3b8";
        return `<td class="fp-in" style="--d:${0.35 + d * 0.16}s">${vmChip(v)}<small style="color:${col}">${lab}</small></td>`;
      })
      .join("");
    S.body.innerHTML = `
      <div style="flex:1;min-width:0">
        <table class="fp-tbl"><tr><th></th>${head}</tr>
          ${row(A, `Bunga ${lo.j + 1} (j)`)}
          ${row(B, `Bunga ${lo.k + 1} (k)`)}
          <tr><td class="lab" style="color:${PINK}">Bunga baru</td>${newCells}</tr>
        </table>
      </div>
      <div class="fp-side" style="flex:0 0 280px">
        <div class="fp-card2 fp-in" style="--d:1.2s;text-align:center">
          <div class="fp-k">Bunga ${lo.i + 1} baru</div>
          <div style="display:flex;justify-content:center">${miniSvg(lo.cand, 220, 180, lo.changed)}</div>
          <div class="fp-big" style="font-size:22px;margin-top:8px">F = ${f4(lo.fNew)}</div>
          <div class="fp-sub">${lo.changed.length} task berubah dari bunga lama</div>
        </div>
      </div>`;
  }

  function caseHTML(e, d) {
    const ok = e.acc;
    return `<div class="fp-case ${ok ? "ok" : "no"} fp-in" style="--d:${d}s">
      <div class="hd">Iterasi ${e.iter} · Bunga ${e.i + 1} · ${e.glob ? "global" : "lokal"}</div>
      <div class="fp-trio">
        <div class="it">${miniSvg(e.old, 190, 160)}<span>lama</span><span class="fv">F = ${f4(e.fOld)}</span></div>
        <div class="ar" style="color:${ok ? "#34d399" : "#f87171"}">→</div>
        <div class="it">${miniSvg(e.cand, 190, 160, e.changed)}<span>baru</span><span class="fv" style="color:${ok ? "#34d399" : "#f87171"}">F = ${f4(e.fNew)}</span></div>
      </div>
      <div class="fm">${f4(e.fNew)} ${ok ? "&lt;" : "≥"} ${f4(e.fOld)}</div>
      <div class="vd">${ok ? "Bunga diganti" : "Dibuang"}</div>
    </div>`;
  }

  function stepGreedy(ctx) {
    const run = getRun();
    const { lo, rj } = pickDemos(run);
    const S = scaffold(
      ctx,
      "FPA · Seleksi greedy",
      "Lebih baik diganti, lebih buruk dibuang",
      "Bunga baru hanya menggantikan bunga lama jika F-nya lebih kecil.",
    );
    S.body.innerHTML = `<div class="fp-pair">${caseHTML(lo, 0.1)}${rj ? caseHTML(rj, 0.7) : ""}</div>`;
  }

  function stepConverge(ctx) {
    const run = getRun();
    const S = scaffold(
      ctx,
      "FPA · Update g*",
      "Rekor baru memperbarui g*",
      `Kurva F terbaik turun tiap kali g* diperbarui (${run.records} kali dalam ${P.iters} iterasi toy).`,
    );
    const W = 740,
      H = 410,
      L = 74,
      R = 26,
      T = 26,
      B = 52;
    const gf = run.snaps.map((s) => s.gF);
    const mean = run.snaps.map(
      (s) => s.fit.reduce((a, b) => a + b, 0) / s.fit.length,
    );
    const lo = Math.min(...gf) - 0.01;
    const hi = Math.max(1.0, ...mean) + 0.04;
    const x = (i) => L + ((W - L - R) * i) / P.iters;
    const y = (f) => T + ((H - T - B) * (hi - f)) / (hi - lo);
    let grid = "";
    for (let k = 0; k <= 4; k++) {
      const f = lo + ((hi - lo) * k) / 4;
      grid += `<line x1="${L}" x2="${W - R}" y1="${y(f)}" y2="${y(f)}" stroke="rgba(148,163,184,.18)"/><text x="${L - 8}" y="${y(f) + 4}" fill="#94a3b8" font-size="12" text-anchor="end" font-family="monospace">${f.toFixed(3)}</text>`;
    }
    for (let i = 0; i <= P.iters; i += 2)
      grid += `<text x="${x(i)}" y="${H - 26}" fill="#94a3b8" font-size="12" text-anchor="middle" font-family="monospace">${i}</text>`;
    grid += `<text x="${(L + W - R) / 2}" y="${H - 6}" fill="#94a3b8" font-size="13" text-anchor="middle">iterasi</text>`;
    let d = `M ${x(0)} ${y(gf[0])}`;
    for (let i = 1; i < gf.length; i++) d += ` H ${x(i)} V ${y(gf[i])}`;
    let dm = `M ${x(0)} ${y(mean[0])}`;
    for (let i = 1; i < mean.length; i++) dm += ` L ${x(i)} ${y(mean[i])}`;
    const marks = run.snaps
      .filter((s) => s.record)
      .map(
        (s) =>
          `<g class="fpStar" opacity="0"><circle cx="${x(s.iter)}" cy="${y(s.gF)}" r="8" fill="${GOLD}"/><text x="${x(s.iter)}" y="${y(s.gF) + 30}" fill="${GOLD}" font-size="13" font-weight="800" text-anchor="middle">★ ${f4(s.gF)}</text></g>`,
      )
      .join("");
    S.body.innerHTML = `
      <div class="fp-board" style="flex:0 0 760px"><svg viewBox="0 0 ${W} ${H}">
        ${grid}
        <line x1="${L}" x2="${W - R}" y1="${y(1)}" y2="${y(1)}" stroke="#94a3b8" stroke-dasharray="6 5"/>
        <text x="${L + 8}" y="${y(1) - 8}" fill="#94a3b8" font-size="13">LPT, F = 1.0000</text>
        <path d="${dm}" fill="none" stroke="${CYAN}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>
        <text x="${x(0) + 10}" y="${y(mean[0]) - 10}" fill="${CYAN}" font-size="13">rata-rata populasi</text>
        <path id="fpCurve" d="${d}" fill="none" stroke="${PINK}" stroke-width="4" stroke-linejoin="round"/>
        ${marks}
        <circle id="fpDot" cx="${x(0)}" cy="${y(gf[0])}" r="7" fill="#fff" stroke="${PINK}" stroke-width="3"/>
        <text id="fpIt" x="${W - R - 4}" y="${T + 14}" fill="#f8fafc" font-size="15" font-weight="800" text-anchor="end" font-family="monospace">iterasi 0</text>
      </svg></div>
      <div class="fp-side">
        <div class="fp-card2 fp-in" style="--d:.2s"><div class="fp-k">g* diperbarui</div><div class="fp-big">${run.records}×</div></div>
        <div class="fp-card2 fp-in" style="--d:.5s"><div class="fp-k">F terbaik</div><div class="fp-big" style="font-size:22px">${f4(gf[0])} → ${f4(gf[gf.length - 1])}</div><div class="fp-sub">turun ${(((gf[0] - gf[gf.length - 1]) / gf[0]) * 100).toFixed(1)}% dari LPT</div></div>
      </div>`;
    const path = S.body.querySelector("#fpCurve");
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    const stars = [...S.body.querySelectorAll(".fpStar")];
    const dot = S.body.querySelector("#fpDot");
    const itTxt = S.body.querySelector("#fpIt");
    tween(
      2400,
      (e) => {
        path.style.strokeDashoffset = len * (1 - e);
        const t = e * P.iters;
        const ii = Math.min(P.iters, Math.floor(t));
        dot.setAttribute("cx", x(t));
        dot.setAttribute("cy", y(gf[ii]));
        itTxt.textContent = "iterasi " + Math.round(t);
        stars.forEach((g, k) => {
          if (e > (k + 1) / (stars.length + 1)) g.setAttribute("opacity", "1");
        });
      },
      S.alive,
    ).then(() => {
      if (S.alive()) stars.forEach((g) => g.setAttribute("opacity", "1"));
    });
  }

  function stepFinal(ctx) {
    const run = getRun();
    const S = scaffold(
      ctx,
      "FPA · Solusi",
      "Hasil akhir: FPA vs LPT",
      `g* setelah ${P.iters} iterasi toy dibandingkan solusi awal LPT.`,
    );
    const lpt = TOY.evaluate(run.lpt);
    const fin = TOY.evaluate(run.best);
    const dF = ((fin.fitness - lpt.fitness) / lpt.fitness) * 100;
    const met = (e) =>
      `<div class="fp-metrics"><div class="m"><span>Makespan</span><b>${e.makespan.toFixed(1)} s</b></div><div class="m"><span>Biaya</span><b>${e.cost.toFixed(0)} G$</b></div><div class="m"><span>Fitness F</span><b>${f4(e.fitness)}</b></div></div>`;
    S.body.innerHTML = `
      <div style="width:100%;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:18px">
          <div style="flex:1;min-width:0"><div class="fp-ttl" style="color:#94a3b8">LPT (solusi awal)</div><div class="fp-board" id="fpB1"></div>${met(lpt)}</div>
          <div style="flex:1;min-width:0"><div class="fp-ttl" style="color:${PINK}">FPA (g* akhir)</div><div class="fp-board" id="fpB2" style="border-color:${PINK}"></div>${met(fin)}</div>
        </div>
        <div style="text-align:center"><span class="fp-pill fp-in" style="--d:.6s">F: ${f4(lpt.fitness)} → ${f4(fin.fitness)} (${dF.toFixed(1)}%)</span></div>
      </div>`;
    S.body
      .querySelector("#fpB1")
      .appendChild(
        TOY.drawAssignment(ctx, run.lpt, {
          width: 760,
          height: 430,
          title: "LPT",
        }),
      );
    S.body
      .querySelector("#fpB2")
      .appendChild(
        TOY.drawAssignment(ctx, run.best, {
          width: 760,
          height: 430,
          title: "FPA g*",
        }),
      );
  }

  /* ======================================================================
     6. REGISTRASI
     ====================================================================== */
  Slides.register({
    id: "slide-6",
    title: "FPA A: Inspirasi, Populasi, Global",
    steps: [
      { label: "Inspirasi Penyerbukan Bunga", enter: stepGarden },
      {
        label: "Populasi 5 Bunga (Toy)",
        enter: (ctx) => stepPopulation(ctx, false),
      },
      {
        label: "Bunga Terbaik Global (g*)",
        enter: (ctx) => stepPopulation(ctx, true),
      },
      { label: "Switch Probability (p = 0.8)", enter: stepSwitch },
      { label: "Global Pollination & Lévy Flight", enter: stepGlobal },
    ],
  });

  Slides.register({
    id: "slide-7",
    title: "FPA B: Lokal, Greedy, Hasil",
    steps: [
      { label: "Local Pollination (Abiotik)", enter: stepLocalPick },
      { label: "Crossover Antar Bunga", enter: stepCrossover },
      { label: "Seleksi Greedy", enter: stepGreedy },
      { label: "Update g* & Kurva Konvergensi", enter: stepConverge },
      { label: "Hasil Akhir FPA vs LPT", enter: stepFinal },
    ],
  });
})();

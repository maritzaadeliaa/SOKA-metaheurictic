/**
 * slides-compare.js [O4] - Slide 8 (Studi Kasus GoCJ_Dataset_500) & Slide 9 (Komparasi 6 metrik)
 * Dependensi: charts.js (Charts.renderComparisonBar + CSS o4-*), data/results.json.
 * Prinsip: tidak ada angka hardcoded. Semua angka/insight berasal dari results.json.
 */
(function () {
  "use strict";

  const ALGO = { ts: "TabuSearch", fpa: "FlowerPollination" };
  const CASE_DATASET = "GoCJ_Dataset_500";
  // Subset yang ditampilkan di grafik (agar label terbaca). Insight dihitung dari SEMUA dataset sumber.
  const SHOW = {
    GoCJ: [100, 300, 500, 700, 1000],
    Sintetik: [100, 500, 1000, 2000, 5000, 10000],
  };
  const METRICS = [
    {
      key: "makespan_s",
      title: "Makespan",
      unit: "detik",
      better: "low",
      hint: "makin kecil makin baik",
    },
    {
      key: "throughput_tps",
      title: "Throughput",
      unit: "task/detik",
      better: "high",
      hint: "makin besar makin baik",
    },
    {
      key: "total_cost_gd",
      title: "Total Cost",
      unit: "G$",
      better: "low",
      hint: "makin kecil makin hemat",
    },
    {
      key: "utilization_pct",
      title: "Resource Utilization",
      unit: "%",
      better: "high",
      hint: "makin tinggi makin efisien",
    },
    {
      key: "imbalance",
      title: "Degree of Imbalance",
      unit: "indeks",
      better: "low",
      hint: "makin kecil makin seimbang",
    },
    {
      key: "scheduling_ms_mean",
      title: "Scheduling Time",
      unit: "ms",
      better: "low",
      hint: "makin kecil makin cepat konvergen",
    },
  ];

  let TOKEN = 0; // step lama berhenti jika user pindah step
  let viewSource = "GoCJ"; // state toggle, dipertahankan antar step slide 9

  /* ========================================================================
     DATA: fetch sekali, di-cache sebagai Promise. Gagal -> error eksplisit, bukan fallback palsu.
     fetch() tidak jalan via file:// -> uji lewat `python -m http.server -d docs`.
     ======================================================================== */
  let _p = null;
  function loadData() {
    if (!_p) {
      _p = fetch("data/results.json")
        .then((r) => {
          if (!r.ok)
            throw new Error("HTTP " + r.status + " pada data/results.json");
          return r.json();
        })
        .then((d) => {
          if (!Array.isArray(d) || !d.length)
            throw new Error("results.json kosong / bukan array");
          return d;
        });
      _p.catch(() => {
        _p = null;
      }); // izinkan retry pada step berikutnya
    }
    return _p;
  }

  // Exact match. Pencocokan substring lama ("100" cocok ke GoCJ_Dataset_1000 & Synthetic_100) dibuang.
  const row = (data, dataset, algo) =>
    data.find((d) => d.dataset === dataset && d.algorithm === algo);

  // Pasangan TS/FPA per dataset untuk satu sumber, terurut menurut jumlah task
  function pairs(data, source) {
    const m = new Map();
    data
      .filter((d) => d.source === source)
      .forEach((d) => {
        const e = m.get(d.dataset) || { dataset: d.dataset, tasks: d.tasks };
        if (d.algorithm === ALGO.ts) e.ts = d;
        if (d.algorithm === ALGO.fpa) e.fpa = d;
        m.set(d.dataset, e);
      });
    return [...m.values()]
      .filter((p) => p.ts && p.fpa)
      .sort((a, b) => a.tasks - b.tasks);
  }

  const pct = (v) =>
    (v > 0 ? "+" : "") +
    v.toLocaleString("id-ID", { maximumFractionDigits: 2 }) +
    "%";

  // Insight dihitung dari data. Netral: hanya menyatakan fakta, arah "baik" mengikuti m.better.
  function insight(m, all, source) {
    let tsW = 0,
      fpW = 0,
      tie = 0,
      sum = 0,
      mx = null;
    all.forEach((p) => {
      const a = p.ts[m.key],
        b = p.fpa[m.key];
      const tsBetter = m.better === "low" ? a < b : a > b;
      const fpBetter = m.better === "low" ? b < a : b > a;
      if (tsBetter) tsW++;
      else if (fpBetter) fpW++;
      else tie++;
      const d = a !== 0 ? ((b - a) / Math.abs(a)) * 100 : 0;
      sum += d;
      if (!mx || Math.abs(d) > Math.abs(mx.d)) mx = { d, tasks: p.tasks };
    });
    const n = all.length;
    return (
      `Dari ${n} dataset ${source}: TS lebih baik pada <b class="o4-ts">${tsW}</b>, FPA pada <b class="o4-fpa">${fpW}</b>` +
      `${tie ? ", imbang " + tie : ""}. Selisih FPA vs TS rata-rata <b>${pct(sum / n)}</b>, terbesar <b>${pct(mx.d)}</b> pada ${mx.tasks} task.`
    );
  }

  function scaffold(ctx, cat, title, caption, right) {
    ctx.root.innerHTML = `
      <div class="slide-content fade-in">
        <div class="slide-header-box" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px">
          <div>
            <div class="slide-category">${cat}</div>
            <h2 class="slide-heading" style="font-size:30px">${title}</h2>
            <p class="slide-subheading" style="font-size:16px">${caption}</p>
          </div>
          ${right || ""}
        </div>
        <div class="o4-body" style="flex-direction:column;align-items:stretch;justify-content:center"></div>
      </div>`;
    const body = ctx.root.querySelector(".o4-body");
    const tok = ++TOKEN;
    return { body, alive: () => tok === TOKEN && body.isConnected };
  }

  async function withData(S, fn) {
    S.body.innerHTML =
      '<div class="o4-sub" style="text-align:center">Memuat data benchmark…</div>';
    try {
      const data = await loadData();
      if (!S.alive()) return;
      fn(data);
    } catch (err) {
      if (!S.alive()) return;
      S.body.innerHTML = `<div class="o4-card" style="border-left:4px solid var(--color-danger)">
        <div class="o4-k">Gagal memuat data</div>
        <div class="o4-sub" style="font-size:15px">${err.message}. Jalankan lewat HTTP server (<code>python -m http.server -d docs</code>); <code>file://</code> memblokir fetch().</div></div>`;
    }
  }

  /* ========================================================================
     SLIDE 8: STUDI KASUS (GoCJ_Dataset_500)
     ======================================================================== */
  async function caseInput(ctx) {
    const S = scaffold(
      ctx,
      "Studi Kasus (1/4)",
      "Masalah: 500 Task ke 16 VM",
      "GoCJ_Dataset_500: workload nyata dengan ukuran task sangat bervariasi.",
    );
    await withData(S, (data) => {
      const r = row(data, CASE_DATASET, ALGO.ts);
      S.body.innerHTML = `
        <div class="o4-stats">
          <div class="o4-stat o4-in" style="--d:.05s"><b>${r ? r.tasks : "n/a"}</b><span>Task (GoCJ)</span></div>
          <div class="o4-stat o4-in" style="--d:.2s"><b>16</b><span>VM: 4 Compute · 6 Standard · 6 Light</span></div>
          <div class="o4-stat o4-in" style="--d:.35s"><b>2</b><span>Datacenter · 10 Host</span></div>
        </div>
        <div class="o4-card o4-in" style="--d:.55s">
          <div class="o4-k">Tujuan optimasi</div>
          <div class="o4-sub" style="font-size:16px">Minimalkan F(S) = 0.5 · Makespan/Ref + 0.5 · Cost/Ref. Acuan Ref = solusi awal LPT.</div>
        </div>`;
    });
  }

  function caseTs(ctx) {
    const S = scaffold(
      ctx,
      "Studi Kasus (2/4)",
      "Proses: Tabu Search",
      "Satu solusi diperbaiki berulang dengan memori larangan.",
    );
    S.body.innerHTML = `
      <div class="o4-card ts o4-in">
        <div class="o4-k">Alur</div>
        <div class="o4-chips" style="align-items:center">
          <span class="o4-chip ts">1. Solusi awal LPT</span><span class="o4-sub">→</span>
          <span class="o4-chip ts">2. Bangkitkan 40 kandidat</span><span class="o4-sub">→</span>
          <span class="o4-chip ts">3. Pilih terbaik non-tabu</span><span class="o4-sub">→</span>
          <span class="o4-chip ts">4. Catat ke tabu list</span>
        </div>
      </div>
      <div class="o4-stats">
        <div class="o4-stat o4-in" style="--d:.1s"><b class="o4-ts" style="font-size:30px">50 / 25 / 25</b><span>% Critical / Cost / Swap</span></div>
        <div class="o4-stat o4-in" style="--d:.25s"><b class="o4-ts" style="font-size:30px">15</b><span>Tabu tenure</span></div>
        <div class="o4-stat o4-in" style="--d:.4s"><b class="o4-ts" style="font-size:30px">150</b><span>Iterasi maksimum (atau berhenti jika stagnan)</span></div>
      </div>
      <div class="o4-sub" style="text-align:center">Aspirasi: larangan boleh dilanggar jika menghasilkan F terbaik baru.</div>`;
  }

  function caseFpa(ctx) {
    const S = scaffold(
      ctx,
      "Studi Kasus (3/4)",
      "Proses: Flower Pollination",
      "Populasi solusi bergerak menuju g* atau saling berkombinasi.",
    );
    S.body.innerHTML = `
      <div class="o4-card fpa o4-in">
        <div class="o4-k">Alur per generasi</div>
        <div class="o4-chips" style="align-items:center">
          <span class="o4-chip fpa">r &lt; 0.8 → Global (Lévy flight ke g*)</span>
          <span class="o4-chip fpa">r ≥ 0.8 → Lokal (crossover bunga j, k)</span>
          <span class="o4-chip fpa">Seleksi greedy</span>
        </div>
      </div>
      <div class="o4-stats">
        <div class="o4-stat o4-in" style="--d:.1s"><b class="o4-fpa" style="font-size:30px">20</b><span>Bunga (populasi)</span></div>
        <div class="o4-stat o4-in" style="--d:.25s"><b class="o4-fpa" style="font-size:30px">80</b><span>Generasi</span></div>
        <div class="o4-stat o4-in" style="--d:.4s"><b class="o4-fpa" style="font-size:30px">γ 0.1 · β 1.5</b><span>Parameter Lévy (Mantegna)</span></div>
      </div>
      <div class="o4-sub" style="text-align:center">Bunga baru hanya menggantikan bunga lama jika F lebih kecil.</div>`;
  }

  async function caseResult(ctx) {
    const S = scaffold(
      ctx,
      "Studi Kasus (4/4)",
      "Solusi: TS vs FPA pada GoCJ_500",
      "Rata-rata 3 run. Batang tumbuh dari nol.",
    );
    await withData(S, (data) => {
      const ts = row(data, CASE_DATASET, ALGO.ts);
      const fp = row(data, CASE_DATASET, ALGO.fpa);
      if (!ts || !fp) {
        S.body.innerHTML = `<div class="o4-card"><div class="o4-k">INSUFFICIENT DATA</div><div class="o4-sub">${CASE_DATASET} tidak ada di results.json untuk kedua algoritma.</div></div>`;
        return;
      }
      const dM = ((fp.makespan_s - ts.makespan_s) / ts.makespan_s) * 100;
      const dC =
        ((fp.total_cost_gd - ts.total_cost_gd) / ts.total_cost_gd) * 100;
      S.body.innerHTML = `
        <div style="display:flex;gap:18px;justify-content:center">
          <div class="o4-chart"><canvas id="o4-case-m" width="540" height="320"></canvas></div>
          <div class="o4-chart"><canvas id="o4-case-c" width="540" height="320"></canvas></div>
        </div>
        <div class="o4-sub" style="text-align:center;font-size:15px">
          Makespan: FPA <b>${pct(dM)}</b> vs TS · Total Cost: FPA <b>${pct(dC)}</b> vs TS. Selisih kecil; nilai absolut pada grafik, bukan klaim signifikansi statistik.</div>`;
      Charts.renderComparisonBar(
        "o4-case-m",
        ["Makespan"],
        [ts.makespan_s],
        [fp.makespan_s],
        "detik",
        { showDelta: true },
      );
      Charts.renderComparisonBar(
        "o4-case-c",
        ["Total Cost"],
        [ts.total_cost_gd],
        [fp.total_cost_gd],
        "G$",
        { showDelta: true },
      );
    });
  }

  Slides.register({
    id: "studi-kasus",
    title: "Studi Kasus: GoCJ Dataset 500",
    steps: [
      { label: "Masalah: 500 task ke 16 VM", enter: caseInput },
      { label: "Proses: Tabu Search", enter: caseTs },
      { label: "Proses: Flower Pollination", enter: caseFpa },
      { label: "Solusi: TS vs FPA", enter: caseResult },
    ],
  });

  /* ========================================================================
     SLIDE 9: KOMPARASI (1 metrik per step + toggle GoCJ/Sintetik)
     ======================================================================== */
  function metricStep(m, idx) {
    return async function (ctx) {
      const toggle = `<div class="o4-toggle" id="o4-tg">
        <button data-s="GoCJ">GoCJ</button><button data-s="Sintetik">Sintetik</button></div>`;
      const S = scaffold(
        ctx,
        `Komparasi (${idx}/${METRICS.length})`,
        `${m.title} (${m.unit})`,
        `Arah baik: ${m.hint}.`,
        toggle,
      );

      await withData(S, (data) => {
        S.body.innerHTML = `
          <div class="o4-chart" id="o4-cbox"></div>
          <div class="o4-card" id="o4-ins" style="margin-top:12px"></div>`;
        const draw = () => {
          ctx.root
            .querySelectorAll("#o4-tg button")
            .forEach((b) =>
              b.classList.toggle("on", b.dataset.s === viewSource),
            );
          const all = pairs(data, viewSource);
          if (!all.length) {
            S.body.querySelector("#o4-cbox").innerHTML =
              '<div class="o4-sub" style="padding:40px">INSUFFICIENT DATA: tidak ada pasangan TS/FPA untuk sumber ini.</div>';
            return;
          }
          const sel = all.filter((p) => SHOW[viewSource].includes(p.tasks));
          const shown = sel.length ? sel : all;
          const prefix = viewSource === "GoCJ" ? "GoCJ " : "Syn ";
          const id = "o4-cv-" + m.key;
          S.body.querySelector("#o4-cbox").innerHTML =
            `<canvas id="${id}" width="1100" height="330"></canvas>`;
          Charts.renderComparisonBar(
            id,
            shown.map((p) => prefix + p.tasks),
            shown.map((p) => p.ts[m.key]),
            shown.map((p) => p.fpa[m.key]),
            m.unit,
          );
          S.body.querySelector("#o4-ins").innerHTML =
            `<div class="o4-k">Insight (dihitung dari data)</div><div class="o4-sub" style="font-size:15px">${insight(m, all, viewSource)}</div>`;
        };
        ctx.root.querySelectorAll("#o4-tg button").forEach((b) =>
          b.addEventListener("click", () => {
            viewSource = b.dataset.s;
            draw();
          }),
        );
        draw();
      });
    };
  }

  Slides.register({
    id: "komparasi-metrik",
    title: "Komparasi Metrik: Tabu Search vs FPA",
    steps: METRICS.map((m, i) => ({
      label: `Metrik ${i + 1}: ${m.title}`,
      enter: metricStep(m, i + 1),
    })),
  });
})();

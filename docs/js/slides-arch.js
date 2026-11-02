/**
 * slides-arch.js [O4] - Slide 3: Arsitektur Cloud & Dataset (4 step sesuai PDF Hal. 6)
 * Style: class o4-* di-inject oleh charts.js; class O1 (.slide-content dst.) dipakai ulang.
 * Sumber angka: README.md sec.2-3, models.py (placement_map), main.py (syn_sizes), results.json.
 */
(function () {
  "use strict";

  // Token: animasi step lama berhenti jika user pindah step (pola sama dengan O2/O3)
  let TOKEN = 0;

  // Replika placement_map di src/models.py (hardcoded di Python, BUKAN hasil VmAllocationPolicySimple).
  // Konsekuensi nyata: seluruh 16 VM berada di host 0-3; host 4-9 kosong.
  const PLACEMENT = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 0,
    5: 1,
    6: 2,
    7: 3,
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 0,
    13: 1,
    14: 2,
    15: 3,
  };
  const vmClass = (id) => (id < 4 ? "c" : id < 10 ? "s" : "l");
  const vmName = (id) => (id < 4 ? "Compute" : id < 10 ? "Standard" : "Light");

  function scaffold(ctx, cat, title, caption) {
    ctx.root.innerHTML = `
      <div class="slide-content fade-in">
        <div class="slide-header-box" style="margin-bottom:8px;">
          <div class="slide-category">${cat}</div>
          <h2 class="slide-heading" style="font-size:30px">${title}</h2>
          <p class="slide-subheading" style="font-size:16px">${caption}</p>
        </div>
        <div class="o4-body" style="flex-direction:column;align-items:stretch;justify-content:center"></div>
      </div>`;
    const body = ctx.root.querySelector(".o4-body");
    const tok = ++TOKEN;
    return { body, alive: () => tok === TOKEN && body.isConnected };
  }

  // Grid 10 host; withVms=true -> isi chip VM per host
  function hostGridHTML(withVms) {
    let h = "";
    for (let i = 0; i < 10; i++) {
      const hp = i < 4;
      const vms = withVms
        ? Object.keys(PLACEMENT)
            .filter((v) => PLACEMENT[v] === i)
            .map(Number)
        : [];
      const chips = vms
        .map(
          (v, k) =>
            `<span class="o4-vm ${vmClass(v)} o4-in" style="--d:${0.15 + (i * 4 + k) * 0.07}s" title="VM ${v} ${vmName(v)}">${v}</span>`,
        )
        .join("");
      h += `<div class="o4-host ${hp ? "hp" : "std"} o4-in" style="--d:${i * 0.07}s">
        <b>Host ${i}</b>${hp ? "8 core · 3.000 MIPS" : "4 core · 1.500 MIPS"}<br>${hp ? "32 GB · 10 Gbps" : "16 GB · 1 Gbps"}
        ${withVms ? `<div class="o4-vms">${chips || '<span style="font-size:11px;opacity:.6">kosong</span>'}</div>` : ""}
      </div>`;
    }
    return `<div class="o4-hostgrid">${h}</div>`;
  }

  /* ---- STEP 1: 2 datacenter, 10 host ---- */
  function stepHosts(ctx) {
    const S = scaffold(
      ctx,
      "Arsitektur Cloud (1/4)",
      "2 Datacenter, 10 Host Heterogen",
      "4 host High Performance dan 6 host Standard. Host muncul satu per satu.",
    );
    S.body.innerHTML = `
      <div class="o4-stats" style="margin-bottom:6px">
        <div class="o4-stat"><b>2</b><span>Datacenter</span></div>
        <div class="o4-stat"><b>10</b><span>Host Fisik</span></div>
        <div class="o4-stat"><b>16</b><span>VM (langkah berikutnya)</span></div>
      </div>
      ${hostGridHTML(false)}
      <div class="o4-chips" style="justify-content:center;margin-top:6px">
        <span class="o4-chip" style="border-color:var(--color-vm-compute);color:#fca5a5">Host 0-3 · High Performance · 8 core @ 3.000 MIPS</span>
        <span class="o4-chip" style="border-color:var(--color-vm-standard);color:#93c5fd">Host 4-9 · Standard · 4 core @ 1.500 MIPS</span>
      </div>`;
  }

  /* ---- STEP 2: 16 VM masuk ke host ---- */
  function stepVms(ctx) {
    const S = scaffold(
      ctx,
      "Arsitektur Cloud (2/4)",
      "16 VM Heterogen Ditempatkan ke Host",
      "3 tier VM dengan kecepatan dan tarif sewa berbeda. Angka pada kotak = ID VM.",
    );
    S.body.innerHTML = `
      ${hostGridHTML(true)}
      <div class="o4-stats" style="margin-top:8px">
        <div class="o4-stat" style="border-top:3px solid var(--color-vm-compute)">
          <b style="font-size:30px">4 Compute</b><span>2 vCPU · 2.500 MIPS · 8 GB<br><strong style="color:#fca5a5">150 G$/s</strong></span></div>
        <div class="o4-stat" style="border-top:3px solid var(--color-vm-standard)">
          <b style="font-size:30px">6 Standard</b><span>1 vCPU · 1.500 MIPS · 4 GB<br><strong style="color:#93c5fd">40 G$/s</strong></span></div>
        <div class="o4-stat" style="border-top:3px solid var(--color-vm-light)">
          <b style="font-size:30px">6 Light</b><span>1 vCPU · 800 MIPS · 2 GB<br><strong style="color:#6ee7b7">18 G$/s</strong></span></div>
      </div>
      <div class="o4-sub" style="text-align:center">Pada simulasi ini seluruh 16 VM berada di Host 0-3 (pemetaan tetap di <code>models.py</code>); Host 4-9 tidak dipakai.</div>`;
  }

  /* ---- STEP 3: Dataset GoCJ ---- */
  function stepGocj(ctx) {
    const S = scaffold(
      ctx,
      "Dataset (3/4)",
      "Dataset GoCJ: Workload Nyata",
      "Diturunkan dari jejak Google cluster; ukuran task sangat bervariasi.",
    );
    S.body.innerHTML = `
      <div class="o4-stats">
        <div class="o4-stat o4-in" style="--d:.05s"><b>19</b><span>File Dataset</span></div>
        <div class="o4-stat o4-in" style="--d:.2s"><b>100 – 1.000</b><span>Jumlah Task (kelipatan 50)</span></div>
        <div class="o4-stat o4-in" style="--d:.35s"><b>&gt; 350.000</b><span>MI pada task terbesar</span></div>
      </div>
      <div class="o4-card o4-in" style="--d:.55s">
        <div class="o4-k">Karakteristik</div>
        <div class="o4-sub" style="font-size:16px">Independent bag-of-tasks, tiap task 1 PE. Distribusi panjang task sangat timpang: ada task sangat besar di antara banyak task kecil.</div>
      </div>
      <div class="o4-chips" style="justify-content:center">
        <span class="o4-chip ts">Tiap kombinasi dataset × algoritma dijalankan 3 kali</span>
      </div>`;
  }

  /* ---- STEP 4: Dataset sintetik (histogram 30/40/30) ---- */
  function stepSynthetic(ctx) {
    const S = scaffold(
      ctx,
      "Dataset (4/4)",
      "Dataset Sintetik: Distribusi 30 / 40 / 30",
      "Dibangkitkan deterministik (seed = 42 + N) untuk uji skala hingga 10.000 task.",
    );
    const bins = [
      {
        lab: "Kecil",
        pct: 30,
        rng: "1.000 – 10.000 MI",
        col: "var(--color-vm-light)",
      },
      {
        lab: "Sedang",
        pct: 40,
        rng: "10.001 – 30.000 MI",
        col: "var(--color-vm-standard)",
      },
      {
        lab: "Besar",
        pct: 30,
        rng: "30.001 – 50.000 MI",
        col: "var(--color-vm-compute)",
      },
    ];
    S.body.innerHTML = `
      <div class="o4-card">
        <div class="o4-hist">
          ${bins
            .map(
              (
                b,
              ) => `<div class="bar"><span style="color:var(--text-main);font-size:18px">${b.pct}%</span>
            <i data-h="${(b.pct / 40) * 130}" style="background:${b.col}"></i>
            <span style="color:var(--text-main)">${b.lab}</span><span style="font-size:12px">${b.rng}</span></div>`,
            )
            .join("")}
        </div>
      </div>
      <div class="o4-stats">
        <div class="o4-stat"><b style="font-size:30px">100 – 10.000</b><span>Rentang jumlah task</span></div>
        <div class="o4-stat"><b style="font-size:30px">8</b><span>Ukuran yang diuji: 100, 200, 300, 500, 1.000, 2.000, 5.000, 10.000</span></div>
        <div class="o4-stat"><b style="font-size:30px">3×</b><span>Run per kombinasi</span></div>
      </div>`;
    // Set tinggi di frame berikutnya agar transisi CSS berjalan
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!S.alive()) return;
        S.body.querySelectorAll(".o4-hist i").forEach((el) => {
          el.style.height = el.dataset.h + "px";
        });
      }),
    );
  }

  Slides.register({
    id: "arsitektur-sistem",
    title: "Arsitektur Cloud & Dataset",
    steps: [
      { label: "2 Datacenter, 10 Host", enter: stepHosts },
      { label: "16 VM Heterogen", enter: stepVms },
      { label: "Dataset GoCJ", enter: stepGocj },
      { label: "Dataset Sintetik", enter: stepSynthetic },
    ],
  });
})();

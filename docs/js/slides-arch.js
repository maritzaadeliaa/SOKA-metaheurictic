/**
 * slides-arch.js - SOKA Presentasi Metaheuristik (Orang 4)
 * Menangani Slide 3: Arsitektur Sistem, Spesifikasi Cluster, dan Dataset
 */

(function () {
  Slides.register({
    id: "arsitektur-sistem",
    title: "Arsitektur Sistem & Spesifikasi Workload",
    steps: [
      {
        label: "1. Topologi Datacenter & Infrastruktur Cloud",
        enter(ctx) {
          ctx.root.innerHTML = `
            <div class="slide-card">
              <div class="badge">Infrastruktur Simulasi</div>
              <h3>Topologi Cluster Hierarkis (CloudSim)</h3>
              <div class="stats-grid">
                <div class="stat-box">
                  <span class="stat-value">1</span>
                  <span class="stat-label">Datacenter Utama</span>
                </div>
                <div class="stat-box">
                  <span class="stat-value">10</span>
                  <span class="stat-label">Host Fisik Heterogen</span>
                </div>
                <div class="stat-box">
                  <span class="stat-value">40</span>
                  <span class="stat-label">Virtual Machines (VM)</span>
                </div>
              </div>
              <p class="description-text">
                Infrastruktur disimulasikan menggunakan kerangka kerja CloudSim 3.0.3 dengan topologi terdistribusi yang membagi 40 VM secara merata di atas 10 Host fisik berkapasitas heterogen.
              </p>
            </div>
          `;
        },
      },
      {
        label: "2. Spesifikasi Heterogenitas Host & VM",
        enter(ctx) {
          ctx.root.innerHTML = `
            <div class="slide-card">
              <div class="badge">Konfigurasi Hardware</div>
              <h3>Profil Spesifikasi VM & Host</h3>
              <div class="comparison-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Komponen</th>
                      <th>Jumlah Unit</th>
                      <th>Kapasitas Komputasi (MIPS)</th>
                      <th>RAM & Bandwidth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>Host Tipe A</b></td>
                      <td>5 Unit</td>
                      <td>2 Core @ 10,000 MIPS</td>
                      <td>16 GB RAM / 10 Gbps</td>
                    </tr>
                    <tr>
                      <td><b>Host Tipe B</b></td>
                      <td>5 Unit</td>
                      <td>4 Core @ 20,000 MIPS</td>
                      <td>32 GB RAM / 10 Gbps</td>
                    </tr>
                    <tr>
                      <td><b>VM High-Perf</b></td>
                      <td>10 Unit</td>
                      <td>2,500 – 3,000 MIPS</td>
                      <td>4 GB RAM (Tarif: G$ 0.12/jam)</td>
                    </tr>
                    <tr>
                      <td><b>VM Standard</b></td>
                      <td>30 Unit</td>
                      <td>1,000 – 1,500 MIPS</td>
                      <td>2 GB RAM (Tarif: G$ 0.05/jam)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `;
        },
      },
      {
        label: "3. Karakteristik Workload & Dataset Benchmark",
        enter(ctx) {
          ctx.root.innerHTML = `
            <div class="slide-card">
              <div class="badge">Beban Kerja</div>
              <h3>Dataset Benchmark (GoCJ & Synthetic)</h3>
              <ul class="feature-list">
                <li><b>GoCJ Dataset (Real-World):</b> Terdiri dari variasi tugas 100, 500, hingga 1,000 tasks yang diekstrak dari jejak eksekusi nyata Google Cloud dengan variasi ukuran instruksi (MI) yang ekstrem.</li>
                <li><b>Synthetic Dataset (Skalabilitas):</b> Terdiri dari variasi 100 hingga 3,000 tasks sintetis untuk menguji ketahanan dan stabilitas konvergensi algoritma pada beban kerja masif.</li>
                <li><b>Sifat Task:</b> <i>Independent Bag-of-Tasks (BoT)</i> tanpa ketergantungan antar-tugas (non-preemptive).</li>
              </ul>
            </div>
          `;
        },
      },
    ],
  });
})();

# Simulasi Penjadwalan Task Metaheuristik di CloudSim
## Tabu Search (TS) vs Flower Pollination Algorithm (FPA)

Proyek simulasi komparasi dua algoritma **Metaheuristik** untuk *Task Scheduling* pada lingkungan komputasi awan heterogen menggunakan **CloudSim 3.0.3**, diuji pada dataset nyata **GoCJ (Google Cloud Jobs)** dan **Dataset Sintetik (100 s/d 10.000 task)**.

---

## Daftar Isi
1. [Latar Belakang & Problem Formulation](#1-latar-belakang--problem-formulation)
2. [Arsitektur Datacenter dan Virtual Machine](#2-arsitektur-datacenter-dan-virtual-machine)
3. [Dataset Pengujian](#3-dataset-pengujian)
4. [Fungsi Objektif (Fitness Function)](#4-fungsi-objektif-fitness-function)
5. [Algoritma 1: Tabu Search (TS)](#5-algoritma-1-tabu-search-ts)
6. [Algoritma 2: Flower Pollination Algorithm (FPA)](#6-algoritma-2-flower-pollination-algorithm-fpa)
7. [Metrik Evaluasi](#7-metrik-evaluasi)
8. [Struktur Proyek](#8-struktur-proyek)
9. [Cara Menjalankan Simulasi](#9-cara-menjalankan-simulasi)
10. [Panduan Pembuatan Slide Presentasi](#10-panduan-pembuatan-slide-presentasi)

---

## 1. Latar Belakang & Problem Formulation

Pada tugas sebelumnya, algoritma heuristik **Longest Processing Time (LPT)** telah diimplementasikan. Meskipun LPT cepat, algoritma tersebut bersifat *greedy* deterministik:
- **Kelemahan Heuristik LPT**: Hanya fokus mencari waktu tercepat tanpa mempertimbangkan tarif sewa VM. Akibatnya, LPT cenderung membebani VM Compute-Intensive yang bertarif mahal (150 G$/s), menyebabkan **Total Cost membengkak**, dan mudah terjebak dalam *local optima*.
- **Solusi Metaheuristik**:
  1. **Tabu Search (TS)**: Menggunakan memori jangka pendek (*Tabu List*) dan kriteria aspirasi untuk mengeksplorasi ruang solusi secara terarah tanpa terjebak dalam siklus pengulangan (*cycling*).
  2. **Flower Pollination Algorithm (FPA)**: Mengadopsi proses penyerbukan biologis bunga di alam ciptaan Xin-She Yang (2012), menggabungkan penyerbukan biotik jarak jauh berbasis *Lévy flight* (eksplorasi global) dan penyerbukan abiotik lokal (eksploitasi lokal) dengan *switch probability* $p = 0.8$.

---

## 2. Arsitektur Datacenter dan Virtual Machine

Lingkungan komputasi awan heterogen dibangun menggunakan spesifikasi berikut:

### Host Fisik (2 Datacenter, 10 Host)
| Tipe Server | Host ID | Jumlah | Core | MIPS/Core | RAM | Storage | Bandwidth |
|---|---|---|---|---|---|---|---|
| **High Performance** | 0 – 3 | 4 | 8 core | 3.000 MIPS | 32 GB | 1 TB | 10 Gbps |
| **Standard** | 4 – 9 | 6 | 4 core | 1.500 MIPS | 16 GB | 500 GB | 1 Gbps |

### Mesin Virtual / VM (16 VM Heterogen)
| Jenis VM | ID VM | Jumlah | vCPU | MIPS/vCPU | RAM | Bandwidth | Biaya Sewa |
|---|---|---|---|---|---|---|---|
| **Compute-Intensive** | 0 – 3 | 4 | 2 vCPU | 2.500 MIPS | 8 GB | 1 Gbps | **150 G$/s** |
| **Standard** | 4 – 9 | 6 | 1 vCPU | 1.500 MIPS | 4 GB | 250 Mbps | **40 G$/s** |
| **Light-weight** | 10 – 15 | 6 | 1 vCPU | 800 MIPS | 2 GB | 250 Mbps | **18 G$/s** |

- Kebijakan penempatan VM ke Host: `VmAllocationPolicySimple` (menyebarkan VM ke host dengan core bebas terbanyak).
- VM Compute-Intensive otomatis ditempatkan pada Host High Performance karena core Host Standard (1.500 MIPS) tidak mencukupi kebutuhan 2.500 MIPS VM tersebut.

---

## 3. Dataset Pengujian

Pengujian dilakukan secara komprehensif pada **dua kategori dataset**:

### A. Dataset GoCJ (Google Cloud Jobs)
- Berisi 19 file: `GoCJ_Dataset_100.txt` s/d `GoCJ_Dataset_1000.txt` (kenaikan 50 task).
- Diturunkan dari jejak workload Google cluster traces dengan variasi ukuran job yang dinamis (hingga > 350.000 MI).

### B. Dataset Sintetik Deterministik (30/40/30)
- Dibuat otomatis oleh `DatasetGenerator.java` dengan seed tetap (`42 + jumlah_task`).
- Ukuran: 100, 200, ..., 1.000 task (komparasi apple-to-apple) dan skala masif 2.000 s/d 10.000 task (*stress-testing* konvergensi metaheuristik).
- **Distribusi Panjang Task**:
  - **Kecil (30%)**: 1.000 – 10.000 MI
  - **Sedang (40%)**: 10.001 – 30.000 MI
  - **Besar (30%)**: 30.001 – 50.000 MI

---

## 4. Fungsi Objektif (Fitness Function)

Untuk memecahkan trade-off antara kecepatan eksekusi dan efisiensi biaya sewa VM, kami menggunakan **Bi-Objective Weighted Fitness Function**:

$$\text{Minimize } F(S) = w_1 \cdot \left(\frac{\text{Makespan}(S)}{\text{Makespan}_{\text{ref}}}\right) + w_2 \cdot \left(\frac{\text{Cost}(S)}{\text{Cost}_{\text{ref}}}\right)$$

- $w_1 = 0.5$ (Bobot performa waktu)
- $w_2 = 0.5$ (Bobot efisiensi biaya)
- $\text{Makespan}_{\text{ref}}$ dan $\text{Cost}_{\text{ref}}$: Nilai acuan dari solusi awal untuk normalisasi.
- **Tujuan**: Nilai $F(S)$ yang semakin **kecil** menunjukkan kualitas jadwal yang semakin optimal.

---

## 5. Algoritma 1: Tabu Search (TS)

Tabu Search adalah algoritma metaheuristik berbasis *local search* yang memanfaatkan struktur memori untuk mencegah pencarian kembali ke solusi yang baru saja dikunjungi.

```mermaid
flowchart TD
    A["Mulai: Inisialisasi Solusi Awal (LPT)"] --> B["Evaluasi Fitness F(S) & Buat Tabu List Kosong"]
    B --> C{"Iterasi <= Max_Iter & Belum Stagnan?"}
    C -- Ya --> D["Generate K Solusi Kandidat (Neighborhood)"]
    D --> E["Evaluasi K Kandidat (Critical Move, Cost Move, Swap)"]
    E --> F{"Kandidat Tabu?"}
    F -- Ya --> G{"Memenuhi Aspiration Criterion? (Lebih baik dari Global Best)"}
    G -- Ya --> H["Terima Move"]
    G -- Tidak --> I["Tolak Move & Pilih Kandidat Non-Tabu Terbaik"]
    F -- Tidak --> H
    H --> J["Update Solusi Saat Ini, Tabu List & Global Best"]
    J --> C
    C -- Tidak --> K["Tetapkan Pemetaan Terbaik ke CloudSim"]
```

### Langkah-Langkah Algoritma Tabu Search:
1. **Representasi Solusi**: Array integer satu dimensi berukuran $N$ (jumlah task), di mana `solution[i] = vm_id`.
2. **Inisialisasi**: Solusi awal diisi menggunakan alokasi LPT agar pencarian dimulai dari titik yang sudah cukup baik (*warm start*).
3. **Neighborhood Operators (Pencarian Tetangga)**:
   - **Critical VM Move (50%)**: Mengidentifikasi VM *bottleneck* (VM dengan waktu selesai tertinggi/penentu makespan), lalu memindahkan salah satu task-nya ke VM lain.
   - **Cost Reduction Move (25%)**: Memindahkan task dari VM Compute-Intensive (mahal) ke VM Standard atau Light-weight (hemat).
   - **Swap Move (25%)**: Menukar penugasan dua task antar VM berbeda.
4. **Tabu Matrix & Tenure**:
   - Struktur `tabuUntil[task_id][orig_vm]` mencatat batas iterasi larangan.
   - Jika suatu task dipindahkan dari VM $A$ ke VM $B$, pemindahan kembali ke VM $A$ dilarang selama durasi `tabuTenure = 15` iterasi.
5. **Kriteria Aspirasi (Aspiration Criterion)**:
   - Jika suatu perpindahan berstatus *tabu* tetapi menghasilkan nilai $F(S)$ yang memecahkan rekor terbaik global (*Global Best*), status *tabu* dicabut (*override*) dan solusi diterima.
6. **Kondisi Berhenti**: Mencapai `maxIterations = 150` atau jika solusi tidak mengalami perbaikan selama 40 iterasi beruntun.

---

## 6. Algoritma 2: Flower Pollination Algorithm (FPA)

Flower Pollination Algorithm (FPA) adalah algoritma metaheuristik berbasis populasi yang terinspirasi dari proses penyerbukan bunga di alam ciptaan Xin-She Yang (2012).

```mermaid
flowchart TD
    A["Mulai: Inisialisasi Populasi Bunga (popSize = 20), p = 0.8, gamma = 0.1"] --> B["Evaluasi Fitness Semua Bunga & Tentukan Bunga Terbaik (g*)"]
    B --> C{"Iterasi <= Max_Iter (80)?"}
    C -- Ya --> D["Untuk Setiap Bunga i dalam Populasi"]
    D --> E{"Random(0, 1) < p (0.8) ?"}
    E -- Ya --> F["Global Pollination (Biotik): Step Lévy Flight L(lambda)"]
    F --> G["Pollen Bergerak ke Arah Solusi Terbaik Global g*"]
    E -- Tidak --> H["Local Pollination (Abiotik): Pilih 2 Bunga Acak j dan k"]
    H --> I["Crossover Lokal: Kombinasi Genetik Bunga j dan k"]
    G --> J["Evaluasi Fitness Bunga Baru F(x_new)"]
    I --> J
    J --> K{"F(x_new) < F(x_i) ? (Greedy Selection)"}
    K -- Ya --> L["Update Bunga i: x_i = x_new"]
    K -- Tidak --> M["Pertahankan Posisi Bunga i Lama"]
    L --> N{"F(x_new) < F(g*) ?"}
    N -- Ya --> O["Update Rekor Global Best: g* = x_new"]
    N -- Tidak --> P["Lanjut ke Bunga Berikutnya"]
    M --> P
    O --> P
    P --> Q{"Seluruh Populasi Selesai Dievaluasi?"}
    Q -- Tidak --> D
    Q -- Ya --> C
    C -- Tidak --> R["Tetapkan Pemetaan Bunga Terbaik (g*) ke CloudSim"]
```

### Karakteristik & Langkah Flower Pollination Algorithm:
1. **Representasi Bunga**: Tiap bunga merepresentasikan satu vektor solusi penugasan task ke VM $X_i = [vm_0, vm_1, \dots, vm_{N-1}]$. Ukuran populasi: `popSize = 20` bunga.
2. **Global Pollination (Penyerbukan Biotik Jarak Jauh)**:
   - Polinator alami (lebah, burung, kelelawar) dapat terbang melintasi jarak jauh (*long-distance jump*).
   - Pergerakan dimodelkan dengan **Lévy Flights** menggunakan algoritma Mantegna:
     $$L \sim \frac{u}{|v|^{1/\beta}}, \quad u \sim \mathcal{N}(0, \sigma_u^2), \quad v \sim \mathcal{N}(0, 1), \quad \beta = 1.5$$
     $$X_i^{t+1} = X_i^t + \gamma \cdot L(\lambda) \cdot (g^* - X_i^t)$$
     di mana $g^*$ adalah posisi bunga terbaik global saat ini. Pada task scheduling diskrit, ini memandu task untuk mengadopsi alokasi VM dari solusi terbaik global.
3. **Local Pollination (Penyerbukan Abiotik Mandiri)**:
   - Terjadi pada jarak dekat tanpa bantuan polinator (misal terbawa hembusan angin atau air).
   - Dimodelkan melalui interaksi/crossover antara dua bunga acak $X_j$ dan $X_k$ dari populasi yang sama:
     $$X_i^{t+1} = X_i^t + \epsilon \cdot (X_j^t - X_k^t), \quad \epsilon \in [0, 1]$$
4. **Switch Probability ($p = 0.8$)**:
   - Menyeimbangkan antara **eksplorasi global** (80% peluang menggunakan Lévy flight untuk melompat dari local optima) dan **eksploitasi lokal** (20% peluang melakukan penyesuaian halus di sekitar solusi yang ada).
5. **Greedy Selection**:
   - Solusi baru $X_{\text{new}}$ hanya akan menggantikan $X_i$ jika nilai fungsi objektifnya $F(X_{\text{new}}) < F(X_i)$. Jika solusi tersebut memecahkan rekor global, $g^*$ diperbarui.
6. **Kondisi Berhenti**: Batas maksimum generasi `maxIterations = 80` tercapai.

---

## 7. Metrik Evaluasi

Hasil simulasi CloudSim diukur secara seragam menggunakan 6 metrik utama:

| Metrik | Definisi & Rumus | Satuan | Makna Kualitas |
|---|---|---|---|
| **Makespan** | $\max_{i} (\text{FinishTime}_i)$ | Detik (s) | Semakin kecil semakin cepat |
| **Total Cost** | $\sum_{j} (\text{FinishTime}_j \times \text{Tarif}_j)$ | G$ | Semakin kecil semakin hemat |
| **Resource Utilization** | $\frac{\sum \text{CPUTime}}{\sum \text{vCPU} \times \text{Makespan}} \times 100\%$ | % | Semakin tinggi semakin efisien |
| **Degree of Imbalance** | $\frac{T_{\max} - T_{\min}}{T_{\text{avg}}}$ | - | Semakin kecil beban semakin seimbang |
| **Throughput** | $\frac{\text{Jumlah Task Selesai}}{\text{Makespan}}$ | task/s | Semakin besar semakin produktif |
| **Scheduling Time** | Waktu eksekusi algoritma menentukan jadwal | ms | Mengukur kecepatan konvergensi |

---

## 8. Struktur Proyek

```text
SOKA-metaheurictic/
├── Compile Meta.txt                     # Petunjuk compile & eksekusi cepat
├── pom.xml                              # Konfigurasi Maven & CloudSim
├── lib/
│   └── cloudsim-3.0.3.jar               # Library simulator CloudSim
├── data/
│   ├── GoCJ_Dataset_100.txt ... 1000.txt# Dataset Google Cloud Jobs
│   └── synthetic/                       # Dataset sintetik 30/40/30 (100 - 10.000 task)
├── results/
│   ├── hasil_komparasi.csv              # Rangkuman rata-rata 3 run (Tabu Search vs Simulated Annealing)
│   ├── hasil_komparasi_runs.csv         # Data mentah setiap run
│   ├── dataset_stats.csv                # Statistik panjang task per dataset
│   ├── host_vm_placement.csv            # Pemetaan alokasi VM ke Host
│   ├── vm_placement_detail.csv          # Detail spesifikasi per VM
│   └── grafik/                          # Grafik perbandingan visual TS vs SA (PNG)
├── scripts/
│   └── plot_comparison.py               # Script matplotlib untuk plotting komparasi TS vs FPA
└── src/main/java/com/cloudsim/meta/
    ├── DatacenterFactory.java           # Setup 2 datacenter & 10 host
    ├── VmFactory.java                   # Setup 16 VM (Compute, Standard, Light)
    ├── CloudletGenerator.java           # Parser file dataset menjadi Cloudlet
    ├── DatasetGenerator.java            # Generator dataset sintetik 30/40/30
    ├── DatasetStats.java                # Statistik deskriptif dataset
    ├── SchedulingMetrics.java           # Perhitungan metrik standar CloudSim
    ├── SolutionEvaluator.java           # Evaluator fitness analitis cepat
    ├── TabuSearchScheduler.java         # Metaheuristik 1: Tabu Search
    ├── FlowerPollinationScheduler.java  # Metaheuristik 2: Flower Pollination Algorithm
    └── Main.java                        # Entry Point: eksekusi komparasi seluruh dataset
```

---

## 9. Cara Menjalankan Simulasi

Prasyarat: Java 8/11 dan Apache Maven.

```bash
# 1. Compile program
mvn compile
///
.\compile.bat


# 2. Jalankan simulasi (Main.java)
mvn exec:java
///
.\run.bat

# 3. Hasilkan grafik perbandingan (TS vs FPA)
python scripts/plot_comparison.py
```
Hasil simulasi CSV akan tersimpan di folder `results/` dan grafik PNG di `results/grafik/`.

> [!TIP]
> **Cara Singkat di Windows (tanpa install Maven)**:  
> Cukup ketik `.\compile.bat` untuk compile dan `.\run.bat` untuk menjalankan simulasi.

---

## 10. Panduan Pembuatan Slide Presentasi

Gunakan panduan berikut sebagai acuan penyusunan slide presentasi kelompok:

* **Slide 1: Judul Presentasi**
  - Judul: *Optimasi Task Scheduling Komputasi Awan Heterogen: Komparasi Metaheuristik Tabu Search (TS) vs Flower Pollination Algorithm (FPA) Menggunakan CloudSim*
  - Nama Anggota Kelompok & Mata Kuliah Sistem Komputasi Awan (SOKA).
* **Slide 2: Problem Statement & Latar Belakang**
  - Tantangan penjadwalan task independen pada VM heterogen dengan spesifikasi dan tarif sewa berbeda.
  - Alasan memilih Metaheuristik: Menyelesaikan masalah NP-hard task scheduling multi-objective secara efisien.
* **Slide 3: Arsitektur Cloud & Fungsi Objektif**
  - Datacenter dengan 10 Host dan 16 VM (Compute-Intensive, Standard, Light-weight).
  - Bi-Objective Fitness Function: Menyeimbangkan waktu selesai (*Makespan*) dan efisiensi biaya sewa VM (*Total Cost*):
    $$F(S) = 0.5 \times \frac{\text{Makespan}}{\text{RefMakespan}} + 0.5 \times \frac{\text{Cost}}{\text{RefCost}}$$
* **Slide 4: Langkah Algoritma 1 — Tabu Search (TS)**
  - Representasi solusi: array pemetaan task ke VM.
  - Neighborhood moves: Critical VM Move (mengatasi bottleneck), Cost Move (mengurangi biaya), dan Swap Move.
  - Memori Tabu: Tabu List berukuran `tenure = 15` iterasi untuk mencegah perulangan (*cycling*).
  - *Aspiration Criterion*: Memperbolehkan langkah tabu jika menghasilkan rekor baru (*Global Best*).
* **Slide 5: Langkah Algoritma 2 — Flower Pollination Algorithm (FPA)**
  - Inspirasi biologis: Penyerbukan bunga di alam ciptaan Xin-She Yang (2012).
  - Global Pollination (Biotik): Eksplorasi jarak jauh menggunakan **Lévy Flights** berbasis Mantegna's algorithm menuju bunga terbaik global ($g^*$).
  - Local Pollination (Abiotik): Eksploitasi lokal antar bunga acak dengan probabilitas pergantian (*switch probability*) $p = 0.8$.
  - Greedy selection: Pembaruan posisi bunga jika solusi baru menghasilkan fitness lebih baik.
* **Slide 6: Dataset & Skenario Pengujian**
  - Dataset nyata GoCJ (Google Cloud Jobs, 100–1.000 task).
  - Dataset sintetik 30/40/30 (Kecil, Sedang, Besar, hingga 10.000 task).
  - Masing-masing dataset dijalankan 3 kali (*repeats*) untuk memvalidasi stabilitas performa.
* **Slide 7: Analisis Komparasi — Makespan & Throughput (TS vs FPA)**
  - Tampilkan grafik `komparasi_makespan.png` dan `komparasi_throughput.png`.
  - Analisis: Tabu Search cenderung menghasilkan Makespan yang sangat kompetitif melalui pemindahan terfokus pada VM kritis, sementara FPA mampu mengejar kualitas makespan secara stabil berkat lompatan Lévy flights.
* **Slide 8: Analisis Komparasi — Total Cost & Resource Utilization (TS vs FPA)**
  - Tampilkan grafik `komparasi_total_cost.png` dan `komparasi_utilization.png`.
  - Analisis: FPA dan TS sama-sama mencapai pemanfaatan CPU tinggi (>97–99%), dengan FPA efektif dalam menyeimbangkan alokasi task ke VM berbiaya rendah melalui crossover penyerbukan lokal.
* **Slide 9: Analisis Komparasi — Degree of Imbalance & Waktu Konvergensi (Scheduling Time)**
  - Tampilkan grafik `komparasi_imbalance.png` dan `komparasi_scheduling_time.png`.
  - Analisis: Tabu Search unggul dalam kestabilan Degree of Imbalance mendekati 0, sementara FPA menawarkan kecepatan konvergensi populasi yang stabil di tiap generasi.
* **Slide 10: Kesimpulan & Rekomendasi**
  - Karakteristik TS: Berbasis *single-solution trajectory search* dengan memori tabu yang kuat pada perbaikan lokal terarah (*intensification*).
  - Karakteristik FPA: Berbasis *population-based swarm search* yang kuat dalam eksplorasi global luas (*diversification*) melalui Lévy flight.
  - Rekomendasi skenario penggunaan TS vs FPA di lingkungan produksi cloud.

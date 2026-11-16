# Optimasi Task Scheduling Komputasi Awan Heterogen
## Komparasi Metaheuristik: Tabu Search (TS) vs Flower Pollination Algorithm (FPA) Menggunakan CloudSim

Proyek tugas mata kuliah **Sistem Komputasi Awan (SOKA)** yang berfokus pada optimasi penjadwalan task independen (*Task Scheduling*) di lingkungan komputasi awan heterogen berbasis simulator **CloudSim 3.0.3**. Kami membandingkan dua pendekatan metaheuristik: **Tabu Search (TS)** (*single-solution trajectory*) dan **Flower Pollination Algorithm (FPA)** (*population-based swarm intelligence*) terhadap solusi awal heuristik **Longest Processing Time (LPT)**.

---

## 👥 Anggota Kelompok 3 (SOKA)

| NRP | Nama Mahasiswa |
|:---:|:---|
| `5027231076` | **Syela Zeruya Tandi Lalong** |
| `5027241047` | **Jonathan Zelig Sutopo** |
| `5027241085` | **Ahmad Syauqi Reza** |
| `5027241111` | **Maritza Adelia Sucipto** |
| `5027241117` | **Adinda Cahya Pramesti** |

---

## 📋 Daftar Isi
1. [Latar Belakang & Problem Formulation](#1-latar-belakang--problem-formulation)
2. [Spesifikasi Infrastruktur CloudSim](#2-spesifikasi-infrastruktur-cloudsim)
3. [Dataset Pengujian](#3-dataset-pengujian)
4. [Fungsi Objektif (Fitness Function)](#4-fungsi-objektif-fitness-function)
5. [Algoritma 1: Tabu Search (TS)](#5-algoritma-1-tabu-search-ts)
6. [Algoritma 2: Flower Pollination Algorithm (FPA)](#6-algoritma-2-flower-pollination-algorithm-fpa)
7. [Metrik Evaluasi](#7-metrik-evaluasi)
8. [Struktur Direktori Proyek](#8-struktur-direktori-proyek)
9. [Panduan Menjalankan Proyek](#9-panduan-menjalankan-proyek)
10. [Web Presentasi Interaktif](#10-web-presentasi-interaktif)

---

## 1. Latar Belakang & Problem Formulation

Penjadwalan task pada lingkungan komputasi awan heterogen merupakan masalah optimasi kombinatorial yang tergolong **NP-hard**. 

- **Kelemahan Heuristik Tradisional (LPT)**:
  Pendekatan *greedy* seperti Longest Processing Time (LPT) selalu memprioritaskan alokasi task terbesar ke Virtual Machine (VM) tercepat. Pada cloud heterogen, VM tercepat (*Compute-Intensive*) memiliki tarif sewa tertinggi ($150\text{ G\$/s}$). Akibatnya:
  1. Biaya sewa (*Total Cost*) melonjak drastis.
  2. Beban kerja menumpuk di sedikit VM (*bottleneck*), sementara VM lain menganggur (*under-utilized*).
  3. LPT mudah terjebak pada *local optima*.
- **Solusi Metaheuristik**:
  - **Tabu Search (TS)**: Mengoptimalkan jadwal secara bertahap melalui eksplorasi lingkungan terarah (*intensification*) dan memanfaatkan memori jangka pendek (*Tabu List*) untuk mencegah siklus berulang (*cycling*).
  - **Flower Pollination Algorithm (FPA)**: Menggunakan kecerdasan kawanan (*swarm*) untuk menjelajahi ruang pencarian secara luas (*diversification*) melalui *Lévy flight* global, serta eksploitasi lokal antarbunga untuk menghasilkan trade-off waktu dan biaya yang seimbang.

---

## 2. Spesifikasi Infrastruktur CloudSim

Simulasi dimodelkan secara realistis pada **CloudSim 3.0.3** dengan arsitektur cluster heterogen:

### A. Host Fisik (2 Datacenter, 10 Host)
| Tipe Server | Host ID | Jumlah | CPU Core | MIPS per Core | RAM | Bandwidth | Storage |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **High Performance** | 0 – 3 | 4 | 8 core | 3.000 MIPS | 32 GB | 10 Gbps | 1 TB |
| **Standard** | 4 – 9 | 6 | 4 core | 1.500 MIPS | 16 GB | 1 Gbps | 500 GB |

### B. Virtual Machine (16 VM Heterogen)
| Kategori VM | VM ID | Jumlah | vCPU | MIPS/vCPU | RAM | Bandwidth | Tarif Sewa |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Compute-Intensive** | 0 – 3 | 4 | 2 vCPU | 2.500 MIPS | 8 GB | 1 Gbps | **150 G$/s** |
| **Standard** | 4 – 9 | 6 | 1 vCPU | 1.500 MIPS | 4 GB | 250 Mbps | **40 G$/s** |
| **Light-weight** | 10 – 15 | 6 | 1 vCPU | 800 MIPS | 2 GB | 250 Mbps | **18 G$/s** |

- **Kebijakan Alokasi Host**: `VmAllocationPolicySimple` (menempatkan VM pada host yang memiliki core bebas terbanyak). VM Compute-Intensive (2.500 MIPS) secara otomatis ditempatkan pada Host High Performance (3.000 MIPS/core).
- **Kebijakan Penjadwalan VM Core**: `CloudletSchedulerSpaceShared` (antrean CPU eksklusif per core).

---

## 3. Dataset Pengujian

Pengujian dilakukan secara ekstensif menggunakan dua jenis workload:

1. **Dataset Nyata GoCJ (Google Cloud Jobs)**:
   - Terdiri dari 19 file: `GoCJ_Dataset_100.txt` hingga `GoCJ_Dataset_1000.txt` (interval 50 task).
   - Diambil dari Google Cluster Workload Traces dengan panjang instruksi mencapai $> 350.000\text{ MI}$.
2. **Dataset Sintetik Deterministik (30/40/30)**:
   - Ukuran task: 100 s/d 1.000 task (komparasi berimbang) dan 2.000 s/d 10.000 task (*stress-testing* skala masif).
   - Menggunakan distribusi ukuran realistis:
     - **Kecil (30%)**: $1.000 - 10.000\text{ MI}$
     - **Sedang (40%)**: $10.001 - 30.000\text{ MI}$
     - **Besar (30%)**: $30.001 - 50.000\text{ MI}$
   - Dihasilkan dengan seed deterministik (`42 + jumlah_task`).

---

## 4. Fungsi Objektif (Fitness Function)

Kami menggunakan **Bi-Objective Weighted Fitness Function** untuk menyeimbangkan antara waktu penyelesaian (*Makespan*) dan biaya sewa (*Total Cost*):

$$\text{Minimize } F(S) = w_1 \cdot \left(\frac{\text{Makespan}(S)}{\text{Makespan}_{\text{ref}}}\right) + w_2 \cdot \left(\frac{\text{Cost}(S)}{\text{Cost}_{\text{ref}}}\right)$$

- $w_1 = 0.5$ (Bobot Makespan)
- $w_2 = 0.5$ (Bobot Total Cost)
- $\text{Makespan}_{\text{ref}}$ & $\text{Cost}_{\text{ref}}$: Nilai acuan dari solusi awal heuristik LPT untuk normalisasi skala ($[0, 1]$).
- Solusi dengan nilai $F(S) < 1.0$ menunjukkan peningkatan efisiensi dibanding baseline LPT.

---

## 5. Algoritma 1: Tabu Search (TS)

Tabu Search adalah metaheuristik berbasis *trajectory search* yang berfokus pada eksplorasi lingkungan lokal (*neighborhood*) secara intensif:
- **Solusi Awal**: Dibangun dari hasil Longest Processing Time (LPT) sebagai *warm-start*.
- **Tiga Operator Pergerakan (*Neighborhood Operators*)**:
  1. *Critical VM Move* (50% probabilitas): Memindahkan task dari VM bottleneck ke VM lain.
  2. *Cost Reduction Move* (25% probabilitas): Menurunkan task dari VM Compute ke VM Standard atau Light.
  3. *Swap Move* (25% probabilitas): Menukar penugasan dua task antar VM berbeda.
- **Tabu List**: Matriks memori larangan penugasan kembali task ke VM asal selama durasi tenure ($\text{tenure} = 15$).
- **Aspiration Criterion**: Memperbolehkan langkah berstatus tabu jika menghasilkan rekor fitness terbaik global baru ($F(S) < F_{\text{best}}$).
- **Stopping Criteria**: Maksimum 150 iterasi atau stagnansi 40 iterasi tanpa perbaikan.

---

## 6. Algoritma 2: Flower Pollination Algorithm (FPA)

FPA (Xin-She Yang, 2012) memodelkan proses transfer serbuk sari bunga di alam:
- **Populasi Bunga**: Ukuran populasi 20 bunga (bunga = kandidat jadwal alokasi).
- **Global Pollination (Penyerbukan Biotik Jarak Jauh)**:
  - Menggunakan distribusi **Lévy Flights** (algoritma Mantegna, $\beta = 1.5$):
    $$x_i^{t+1} = x_i^t + \gamma \cdot L(\lambda) \cdot (g^* - x_i^t)$$
    di mana $g^*$ adalah posisi bunga terbaik global.
- **Local Pollination (Penyerbukan Abiotik Lokal)**:
  - Pertukaran fitur (*crossover*) antara dua bunga acak di populasi:
    $$x_i^{t+1} = x_i^t + \epsilon \cdot (x_j^t - x_k^t)$$
- **Switch Probability ($p = 0.8$)**: Probabilitas memilih penyerbukan global (80%) vs lokal (20%).
- **Greedy Selection**: Solusi mutasi hanya menggantikan posisi bunga lama jika nilai fitness-nya lebih baik.

---

## 7. Metrik Evaluasi

Kinerja hasil penjadwalan diukur secara seragam menggunakan 6 metrik utama:

1. **Makespan ($s$)**: Waktu penyelesaian task terakhir di sistem:
   $$\text{Makespan} = \max_{j \in VM} \{ T_j \}$$
2. **Total Cost ($\text{G\$}$)**: Akumulasi biaya sewa seluruh VM yang beroperasi:
   $$\text{Cost} = \sum_{j=1}^{16} (T_j \times \text{Tarif}_j)$$
3. **Resource Utilization ($\%$)**: Rasio waktu sibuk aktif CPU terhadap total waktu sewa:
   $$\text{Utilization} = \frac{\sum_{j=1}^{16} T_j}{16 \times \text{Makespan}} \times 100\%$$
4. **Degree of Imbalance (DI)**: Ketimpangan distribusi beban kerja antarmesin virtual:
   $$\text{DI} = \frac{T_{\max} - T_{\min}}{T_{\text{avg}}}$$
5. **Throughput ($\text{task/s}$)**: Kecepatan pemrosesan task per satuan waktu:
   $$\text{Throughput} = \frac{N_{\text{tasks}}}{\text{Makespan}}$$
6. **Scheduling Time ($ms$)**: Waktu komputasi yang dibutuhkan algoritma untuk menghasilkan jadwal final.

---

## 8. Struktur Direktori Proyek

```plaintext
SOKA-metaheurictic/
├── lib/
│   └── cloudsim-3.0.3.jar              # Library CloudSim 3.0.3 asli
├── src/
│   ├── main/java/com/cloudsim/meta/    # [Utama] Engine Simulasi Java CloudSim
│   │   ├── Main.java                   # Runner eksperimen komparasi CloudSim
│   │   ├── DatacenterFactory.java      # Pembuatan 2 Datacenter & 10 Host
│   │   ├── VmFactory.java              # Pembuatan 16 VM Heterogen
│   │   ├── CloudletGenerator.java      # Parser dataset ke Cloudlet
│   │   ├── DatasetGenerator.java       # Generator dataset sintetik
│   │   ├── DatasetStats.java           # Penghitung statistik dataset
│   │   ├── SolutionEvaluator.java      # Evaluator fitness CloudSim
│   │   ├── SchedulingMetrics.java      # Perhitungan 6 metrik performa
│   │   ├── TabuSearchScheduler.java    # Implementasi Tabu Search
│   │   └── FlowerPollinationScheduler.java # Implementasi FPA
│   ├── evaluator.py                    # Evaluator analitis cepat (Python port)
│   ├── tabu_search.py                  # Porting Tabu Search (Python)
│   ├── flower_pollination.py           # Porting FPA (Python)
│   ├── models.py                       # Data model Host, VM, Cloudlet
│   └── metrics.py                      # Perhitungan metrik evaluasi
├── data/
│   ├── synthetic/                      # Dataset Sintetik (100 - 10.000 task)
│   └── GoCJ_Dataset_*.txt              # Dataset GoCJ (100 - 1.000 task)
├── results/
│   ├── hasil_komparasi.csv             # Rata-rata metrik akhir (TS vs FPA)
│   ├── hasil_komparasi_runs.csv        # Detail metrik per pengujian
│   ├── dataset_stats.csv               # Statistik distribusi dataset
│   └── grafik/                         # Grafik komparasi performa (PNG)
├── scripts/
│   ├── plot_comparison.py              # Visualisasi grafik hasil komparasi
│   └── csv_to_json.py                  # Konversi CSV ke JSON untuk web slide
├── docs/                               # Framework Web Presentasi Interaktif
│   ├── index.html                      # Entry point web slide
│   ├── css/style.css                   # Gaya tema gelap & animasi interaktif
│   ├── data/results.json               # Data hasil pengujian untuk slide
│   └── js/                             # Logika slide & diagram animasi step-by-step
├── compile.bat                         # Skrip kompilasi Java CloudSim
├── run.bat                             # Skrip eksekusi simulasi
├── pom.xml                             # Konfigurasi Maven (opsional)
└── requirements.txt                    # Dependensi Python untuk plotting grafik
```

---

## 9. Panduan Menjalankan Proyek

### Prasyarat Sistem
- **Java**: JDK 8 atau JDK 11+ (`javac` dan `java` terdaftar di PATH).
- **Python**: Python 3.8+ (untuk visualisasi grafik `matplotlib` dan `numpy`).

### Langkah 1: Kompilasi Kode Java CloudSim
Jalankan skrip batch kompilasi berikut di terminal:
```cmd
.\compile.bat
```
*Atau kompilasi manual via javac:*
```bash
javac -cp "lib/cloudsim-3.0.3.jar" -d target/classes src/main/java/com/cloudsim/meta/*.java
```

### Langkah 2: Jalankan Simulasi Eksperimen CloudSim
```cmd
java -cp "target\classes;lib\cloudsim-3.0.3.jar" com.cloudsim.meta.Main
```
Proses ini akan mengeksekusi seluruh varian dataset (GoCJ dan Sintetik) sebanyak 3 kali perulangan (*repeats*), kemudian menyimpan hasil pengujian ke folder `results/hasil_komparasi.csv`.

### Langkah 3: Generate Grafik Visual & Data Slide (Python)
Install dependensi python jika belum:
```bash
pip install -r requirements.txt
```
Lalu hasilkan grafik PNG dan perbarui data slide web:
```bash
python scripts/plot_comparison.py
python scripts/csv_to_json.py
```

---

## 10. Web Presentasi Interaktif

Proyek ini dilengkapi dengan aplikasi presentasi berbasis web interaktif dengan rasio layar 16:9 yang responsif dan animasi *step-by-step*.

### Cara Membuka Web Presentasi:
1. Buka file [`docs/index.html`](docs/index.html) langsung di browser pilihan Anda (Google Chrome / Edge / Firefox).
2. Atau jalankan server lokal:
   ```bash
   python -m http.server 8000 -d docs
   ```
   Lalu buka tautan `http://localhost:8000` di browser.

### Kontrol Navigasi Slide:
- **Panah Kanan ($\rightarrow$) / Spasi**: Melangkah ke tahap animasi berikutnya.
- **Panah Kiri ($\leftarrow$)**: Kembali ke tahap sebelumnya.
- **P**: Memutar animasi secara otomatis (*Auto-Play*).
- **R**: Mereset animasi slide ke tahap awal.
- **Tombol Fullscreen**: Menampilkan layar penuh.

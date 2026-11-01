"""
============================================================================
MAIN: Runner Eksperimen Komparasi Metaheuristik Task Scheduling (Python)
============================================================================
Membandingkan dua algoritma metaheuristik:
  1. Tabu Search (TS)                  - single-solution trajectory
  2. Flower Pollination Algorithm (FPA) - population-based swarm intelligence
pada dataset GoCJ dan dataset Sintetik (100 s/d 10.000 task).
"""

import os
import re
import csv
import time
import subprocess
from typing import List, Dict

from src.models import create_vms, create_hosts
from src.cloudlet import load_cloudlets_from_file
from src.tabu_search import TabuSearchScheduler
from src.flower_pollination import FlowerPollinationScheduler
from src.metrics import calculate_metrics
from src.dataset_generator import generate_synthetic_dataset
from src.dataset_stats import compute_dataset_stats


REPEATS = 3
DATA_DIR = "data"
RESULT_DIR = "results"
GOCJ_SHORT_MAX = 100_000
GOCJ_MEDIUM_MAX = 350_000
SYN_SHORT_MAX = 10_000
SYN_MEDIUM_MAX = 30_000


def get_workload_category(task_count: int) -> str:
    if task_count <= 400:
        return "Ringan"
    elif task_count <= 1000:
        return "Sedang"
    else:
        return "Tinggi"


def collect_datasets() -> List[Dict]:
    datasets = []
    # 1. Dataset GoCJ
    if os.path.exists(DATA_DIR):
        files = [f for f in os.listdir(DATA_DIR) if re.match(r"^GoCJ_Dataset_\d+\.txt$", f)]
        files.sort(key=lambda x: int(re.search(r"\d+", x).group()))
        for f in files:
            name = f.replace(".txt", "")
            datasets.append({
                "name": name,
                "source": "GoCJ",
                "path": os.path.join(DATA_DIR, f),
                "short_max": GOCJ_SHORT_MAX,
                "medium_max": GOCJ_MEDIUM_MAX
            })

    # 2. Dataset Sintetik
    syn_sizes = [100, 200, 300, 500, 1000, 2000, 5000, 10000]
    for size in syn_sizes:
        path = generate_synthetic_dataset(size)
        datasets.append({
            "name": f"Synthetic_{size}",
            "source": "Sintetik",
            "path": path,
            "short_max": SYN_SHORT_MAX,
            "medium_max": SYN_MEDIUM_MAX
        })

    return datasets


def save_placement_reports(vms):
    os.makedirs(RESULT_DIR, exist_ok=True)
    
    # 1. host_vm_placement.csv
    host_summary: Dict[int, Dict] = {}
    for h_id in range(10):
        host_summary[h_id] = {
            "host_id": h_id,
            "grade": "High grade" if h_id < 4 else "Low grade",
            "total_vm": 0,
            "compute_intensive": 0,
            "standard": 0,
            "light_weight": 0
        }

    for vm in vms:
        h = host_summary[vm.host_id]
        h["total_vm"] += 1
        if vm.vm_type == "Compute-Intensive":
            h["compute_intensive"] += 1
        elif vm.vm_type == "Standard":
            h["standard"] += 1
        else:
            h["light_weight"] += 1

    placement_file = os.path.join(RESULT_DIR, "host_vm_placement.csv")
    with open(placement_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "host_id", "grade", "total_vm", "compute_intensive", "standard", "light_weight"
        ])
        writer.writeheader()
        for h_id in range(10):
            writer.writerow(host_summary[h_id])

    # 2. vm_placement_detail.csv
    detail_file = os.path.join(RESULT_DIR, "vm_placement_detail.csv")
    with open(detail_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "vm_id", "vm_type", "vcpu", "mips_per_vcpu", "ram_mb", "bw_mbps",
            "cost_per_s", "host_id", "host_grade"
        ])
        for vm in vms:
            writer.writerow([
                vm.id, vm.vm_type, vm.vcpu, int(vm.mips), vm.ram_mb, vm.bw_mbps,
                int(vm.cost_per_s), vm.host_id, vm.host_grade
            ])


def main():
    print("=" * 80)
    print("SIMULASI PENJADWALAN TASK METAHEURISTIK: TABU SEARCH vs FPA (PYTHON)")
    print("=" * 80)

    os.makedirs(RESULT_DIR, exist_ok=True)
    vms = create_vms()
    save_placement_reports(vms)

    datasets = collect_datasets()
    print(f"Ditemukan {len(datasets)} file dataset untuk pengujian.")

    # 1. Simpan dataset_stats.csv
    stats_list = []
    for d in datasets:
        cloudlets = load_cloudlets_from_file(d["path"])
        lengths = [c.length for c in cloudlets]
        st = compute_dataset_stats(d["name"], d["source"], lengths, d["short_max"], d["medium_max"])
        if st:
            stats_list.append(st)

    stats_file = os.path.join(RESULT_DIR, "dataset_stats.csv")
    if stats_list:
        with open(stats_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(stats_list[0].keys()))
            writer.writeheader()
            for row in stats_list:
                writer.writerow(row)
        print(f"[OK] Statistik dataset disimpan ke {stats_file}")

    # File output hasil komparasi
    mean_csv_file = os.path.join(RESULT_DIR, "hasil_komparasi.csv")
    runs_csv_file = os.path.join(RESULT_DIR, "hasil_komparasi_runs.csv")

    mean_f = open(mean_csv_file, "w", newline="", encoding="utf-8")
    mean_writer = csv.writer(mean_f)
    mean_writer.writerow([
        "dataset", "source", "workload", "tasks", "algorithm", "runs",
        "makespan_s", "total_cost_gd", "utilization_pct", "imbalance",
        "throughput_tps", "scheduling_ms_mean", "scheduling_ms_std",
        "pct_tasks_compute", "pct_tasks_standard", "pct_tasks_light"
    ])

    runs_f = open(runs_csv_file, "w", newline="", encoding="utf-8")
    runs_writer = csv.writer(runs_f)
    runs_writer.writerow([
        "dataset", "source", "tasks", "algorithm", "run",
        "makespan_s", "total_cost_gd", "utilization_pct", "imbalance",
        "throughput_tps", "scheduling_ms"
    ])

    print("\n%-20s %-10s %-18s %12s %16s %9s %10s %12s %10s" % (
        "Dataset", "Tasks", "Algorithm", "Makespan(s)", "Cost(G$)", "Util(%)", "Imbalance", "Throughput", "Time(ms)"
    ))
    print("-" * 115)

    algos = [("TabuSearch", TabuSearchScheduler()), ("FlowerPollination", FlowerPollinationScheduler())]

    for d in datasets:
        cloudlets = load_cloudlets_from_file(d["path"])
        task_count = len(cloudlets)
        workload = get_workload_category(task_count)

        for algo_name, scheduler in algos:
            run_metrics = []

            for r in range(1, REPEATS + 1):
                t0 = time.perf_counter()
                best_assignment, eval_res = scheduler.schedule(cloudlets, vms, run_index=r)
                elapsed_ms = (time.perf_counter() - t0) * 1000.0

                m = calculate_metrics(best_assignment, cloudlets, vms, eval_res, elapsed_ms)
                run_metrics.append(m)

                # Tulis tiap run ke runs CSV
                runs_writer.writerow([
                    d["name"], d["source"], task_count, algo_name, r,
                    f"{m['makespan_s']:.4f}", f"{m['total_cost_gd']:.4f}",
                    f"{m['utilization_pct']:.4f}", f"{m['imbalance']:.4f}",
                    f"{m['throughput_tps']:.4f}", f"{m['scheduling_ms']:.4f}"
                ])
                runs_f.flush()

            # Hitung rata-rata & std
            mean_makespan = sum(x["makespan_s"] for x in run_metrics) / REPEATS
            mean_cost = sum(x["total_cost_gd"] for x in run_metrics) / REPEATS
            mean_util = sum(x["utilization_pct"] for x in run_metrics) / REPEATS
            mean_imb = sum(x["imbalance"] for x in run_metrics) / REPEATS
            mean_thr = sum(x["throughput_tps"] for x in run_metrics) / REPEATS
            mean_sched = sum(x["scheduling_ms"] for x in run_metrics) / REPEATS
            sched_variance = sum((x["scheduling_ms"] - mean_sched) ** 2 for x in run_metrics) / REPEATS
            std_sched = sched_variance ** 0.5

            mean_pct_c = sum(x["pct_compute"] for x in run_metrics) / REPEATS
            mean_pct_s = sum(x["pct_standard"] for x in run_metrics) / REPEATS
            mean_pct_l = sum(x["pct_light"] for x in run_metrics) / REPEATS

            print("%-20s %-10d %-18s %12.2f %16.2f %9.2f %10.3f %12.3f %10.3f" % (
                d["name"], task_count, algo_name,
                mean_makespan, mean_cost, mean_util, mean_imb, mean_thr, mean_sched
            ), flush=True)

            mean_writer.writerow([
                d["name"], d["source"], workload, task_count, algo_name, REPEATS,
                f"{mean_makespan:.4f}", f"{mean_cost:.4f}",
                f"{mean_util:.4f}", f"{mean_imb:.4f}", f"{mean_thr:.4f}",
                f"{mean_sched:.4f}", f"{std_sched:.4f}",
                f"{mean_pct_c:.2f}", f"{mean_pct_s:.2f}", f"{mean_pct_l:.2f}"
            ])
            mean_f.flush()

        print("-" * 115, flush=True)

    mean_f.close()
    runs_f.close()

    print(f"\n[OK] Hasil simulasi berhasil ditulis ke {RESULT_DIR}/")

    # Generate grafik matplotlib
    plot_script = os.path.join("scripts", "plot_comparison.py")
    if os.path.exists(plot_script):
        print(f"Menjalankan visualisasi grafik {plot_script}...")
        try:
            subprocess.run(["python", plot_script], check=True)
            print("[OK] Grafik perbandingan (TS vs FPA) berhasil diperbarui di results/grafik/.")
        except Exception as e:
            print(f"[WARN] Gagal menghasilkan grafik matplotlib: {e}")


if __name__ == "__main__":
    main()

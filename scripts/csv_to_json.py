import csv
import json
import os


def convert_csv_to_json():
    # Jalur berkas input CSV dan output JSON
    csv_path = os.path.join("results", "hasil_komparasi.csv")
    json_path = os.path.join("docs", "data", "results.json")

    if not os.path.exists(csv_path):
        print(f"Error: Berkas {csv_path} tidak ditemukan.")
        return

    data = []

    # Membaca data dari hasil_komparasi.csv
    with open(csv_path, mode="r", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            parsed_row = {
                "dataset": row.get("dataset", ""),
                "source": row.get("source", ""),
                "tasks": int(row.get("tasks", 0)) if row.get("tasks") else 0,
                "algorithm": row.get("algorithm", ""),
                "makespan_s": float(row.get("makespan_s", 0.0))
                if row.get("makespan_s")
                else 0.0,
                "total_cost_gd": float(row.get("total_cost_gd", 0.0))
                if row.get("total_cost_gd")
                else 0.0,
                "utilization_pct": float(row.get("utilization_pct", 0.0))
                if row.get("utilization_pct")
                else 0.0,
                "imbalance": float(row.get("imbalance", 0.0))
                if row.get("imbalance")
                else 0.0,
                "throughput_tps": float(row.get("throughput_tps", 0.0))
                if row.get("throughput_tps")
                else 0.0,
                "scheduling_ms_mean": float(row.get("scheduling_ms_mean", 0.0))
                if row.get("scheduling_ms_mean")
                else 0.0,
            }
            data.append(parsed_row)

    # Memastikan folder docs/data/ tersedia
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    # Menyimpan hasil parsing ke docs/data/results.json
    with open(json_path, mode="w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=2)

    print(f"Berhasil mengonversi {len(data)} entri dari {csv_path} ke {json_path}")


if __name__ == "__main__":
    convert_csv_to_json()

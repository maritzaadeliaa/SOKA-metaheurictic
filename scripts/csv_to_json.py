"""
============================================================================
CSV TO JSON CONVERTER: Ekspor Hasil Simulasi ke JSON untuk Visualisasi Web
============================================================================
File    : scripts/csv_to_json.py
Pemilik : [Orang 4]
Tujuan  : Membaca results/hasil_komparasi.csv dan menghasilkan docs/data/results.json
"""

import os
import csv
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "results", "hasil_komparasi.csv")
JSON_PATH = os.path.join(ROOT, "docs", "data", "results.json")


def convert():
    if not os.path.exists(CSV_PATH):
        print(f"[ERROR] File {CSV_PATH} tidak ditemukan.")
        return

    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)
    records = []

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            record = {}
            for k, v in row.items():
                if k is None or not isinstance(k, str):
                    continue
                if v is None or not isinstance(v, str):
                    continue
                clean_v = v.strip()
                try:
                    if "." in clean_v:
                        record[k] = float(clean_v)
                    else:
                        record[k] = int(clean_v)
                except ValueError:
                    record[k] = clean_v
            records.append(record)

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"[OK] Berhasil mengonversi {len(records)} baris ke {JSON_PATH}")


if __name__ == "__main__":
    convert()

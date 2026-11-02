"""
csv_to_json.py [O4]
Input : results/hasil_komparasi.csv
Output: docs/data/results.json
Jalankan dari direktori manapun: python scripts/csv_to_json.py
"""

import csv
import json
import sys
from pathlib import Path

# Path berbasis lokasi file, bukan cwd. Versi lama ("results/...") gagal jika dipanggil
# dari folder selain root repo (mis. dari dalam scripts/).
ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "results" / "hasil_komparasi.csv"
JSON_PATH = ROOT / "docs" / "data" / "results.json"

# Kolom -> tipe. Semua wajib ada; kolom hilang = error, bukan default 0.
SCHEMA = {
    "dataset": str,
    "source": str,
    "workload": str,
    "tasks": int,
    "algorithm": str,
    "runs": int,
    "makespan_s": float,
    "total_cost_gd": float,
    "utilization_pct": float,
    "imbalance": float,
    "throughput_tps": float,
    "scheduling_ms_mean": float,
    "scheduling_ms_std": float,
    "pct_tasks_compute": float,
    "pct_tasks_standard": float,
    "pct_tasks_light": float,
}
ALGOS = {"TabuSearch", "FlowerPollination"}


def parse_row(raw: dict, line: int) -> dict:
    out = {}
    for col, typ in SCHEMA.items():
        val = (raw.get(col) or "").strip()
        # Nilai kosong ditolak: versi lama menyuntikkan 0.0 yang memalsukan grafik.
        if val == "":
            raise ValueError(f"baris {line}: kolom '{col}' kosong")
        try:
            out[col] = typ(val)
        except ValueError as e:
            raise ValueError(
                f"baris {line}: kolom '{col}'={val!r} bukan {typ.__name__}"
            ) from e
    if out["algorithm"] not in ALGOS:
        raise ValueError(
            f"baris {line}: algorithm={out['algorithm']!r} di luar {sorted(ALGOS)}"
        )
    return out


def validate_pairs(rows: list) -> None:
    # slides-compare.js mengasumsikan tiap dataset punya tepat 1 baris TS dan 1 baris FPA.
    seen = {}
    for r in rows:
        key = (r["dataset"], r["algorithm"])
        if key in seen:
            raise ValueError(f"duplikat: {key}")
        seen[key] = r
    for ds in {r["dataset"] for r in rows}:
        missing = [a for a in ALGOS if (ds, a) not in seen]
        if missing:
            raise ValueError(f"dataset {ds} tidak punya baris untuk {missing}")


def main() -> int:
    if not CSV_PATH.exists():
        print(
            f"ERROR: {CSV_PATH} tidak ditemukan. Jalankan main.py dulu.",
            file=sys.stderr,
        )
        return 1

    with CSV_PATH.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        absent = [c for c in SCHEMA if c not in (reader.fieldnames or [])]
        if absent:
            print(f"ERROR: kolom hilang di CSV: {absent}", file=sys.stderr)
            return 1
        try:
            # start=2: baris 1 adalah header
            rows = [parse_row(r, i) for i, r in enumerate(reader, start=2)]
            validate_pairs(rows)
        except ValueError as e:
            print(f"ERROR: {e}", file=sys.stderr)
            return 1

    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with JSON_PATH.open("w", encoding="utf-8", newline="\n") as f:
        # ensure_ascii=False + newline akhir: diff git bersih, tidak ada escape \uXXXX
        json.dump(rows, f, indent=2, ensure_ascii=False)
        f.write("\n")

    n_ds = len({r["dataset"] for r in rows})
    print(
        f"OK: {len(rows)} entri ({n_ds} dataset x 2 algoritma) -> {JSON_PATH.relative_to(ROOT)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

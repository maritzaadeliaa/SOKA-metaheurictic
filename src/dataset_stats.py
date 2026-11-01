"""
============================================================================
DATASET STATS: Kalkulator Statistik Deskriptif Karakteristik Dataset
============================================================================
Menghitung min, p25, median, p75, p90, max, mean, total MI, serta persentase
klasifikasi task (short, medium, long).
"""

import math
from typing import List, Dict


def percentile(sorted_vals: List[int], p: float) -> float:
    """Menghitung persentil ke-p (0 s/d 100) dari data terurut."""
    if not sorted_vals:
        return 0.0
    k = (len(sorted_vals) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return float(sorted_vals[int(k)])
    d0 = sorted_vals[int(f)] * (c - k)
    d1 = sorted_vals[int(c)] * (k - f)
    return float(d0 + d1)


def compute_dataset_stats(
    name: str,
    source: str,
    lengths: List[int],
    short_max: int,
    medium_max: int
) -> Dict[str, any]:
    """
    Menghitung statistik lengkap dari daftar panjang task MI.
    """
    n = len(lengths)
    if n == 0:
        return {}

    sorted_l = sorted(lengths)
    total_mi = sum(sorted_l)
    mean_mi = total_mi / n

    n_short = sum(1 for l in sorted_l if l <= short_max)
    n_medium = sum(1 for l in sorted_l if short_max < l <= medium_max)
    n_long = sum(1 for l in sorted_l if l > medium_max)

    return {
        "dataset": name,
        "source": source,
        "tasks": n,
        "min_mi": sorted_l[0],
        "p25_mi": int(percentile(sorted_l, 25)),
        "median_mi": int(percentile(sorted_l, 50)),
        "p75_mi": int(percentile(sorted_l, 75)),
        "p90_mi": int(percentile(sorted_l, 90)),
        "max_mi": sorted_l[-1],
        "mean_mi": mean_mi,
        "total_mi": total_mi,
        "short_max_mi": short_max,
        "medium_max_mi": medium_max,
        "pct_short": (n_short / n) * 100.0,
        "pct_medium": (n_medium / n) * 100.0,
        "pct_long": (n_long / n) * 100.0
    }

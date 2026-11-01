"""
============================================================================
DATASET GENERATOR: Pembangkit Dataset Sintetik 30/40/30
============================================================================
Membuat workload sintetik dengan komposisi:
- 30% Kecil  : 1.000 - 10.000 MI
- 40% Sedang : 10.001 - 30.000 MI
- 30% Besar  : 30.001 - 50.000 MI
"""

import os
import random
from typing import List


SYNTHETIC_DIR = os.path.join("data", "synthetic")
SMALL_MIN = 1_000
SMALL_MAX = 10_000
MEDIUM_MIN = 10_001
MEDIUM_MAX = 30_000
LARGE_MIN = 30_001
LARGE_MAX = 50_000


def generate_synthetic_dataset(n: int, output_dir: str = SYNTHETIC_DIR) -> str:
    """
    Menghasilkan file Synthetic_<N>.txt deterministik (seed 42 + N).
    Mengembalikan path file yang dihasilkan.
    """
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, f"Synthetic_{n}.txt")
    if os.path.exists(file_path):
        return file_path

    rng = random.Random(42 + n)
    n_small = int(n * 0.30)
    n_medium = int(n * 0.40)
    n_large = n - n_small - n_medium

    tasks: List[int] = []
    for _ in range(n_small):
        tasks.append(rng.randint(SMALL_MIN, SMALL_MAX))
    for _ in range(n_medium):
        tasks.append(rng.randint(MEDIUM_MIN, MEDIUM_MAX))
    for _ in range(n_large):
        tasks.append(rng.randint(LARGE_MIN, LARGE_MAX))

    rng.shuffle(tasks)

    with open(file_path, "w", encoding="utf-8") as f:
        for t in tasks:
            f.write(f"{t}\n")

    return file_path

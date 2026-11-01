"""
============================================================================
CLOUDLET: Parser Dataset Task ke Objek Cloudlet
============================================================================
"""

import os
from typing import List
from src.models import Cloudlet


def load_cloudlets_from_file(file_path: str) -> List[Cloudlet]:
    """
    Membaca file dataset (.txt) di mana setiap baris berisi angka panjang task (MI),
    mengonversinya menjadi daftar objek Cloudlet.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File dataset tidak ditemukan: {file_path}")

    cloudlets: List[Cloudlet] = []
    with open(file_path, "r", encoding="utf-8") as f:
        task_id = 0
        for line in f:
            clean = line.strip()
            if not clean:
                continue
            try:
                length = int(float(clean))
                cloudlets.append(Cloudlet(
                    id=task_id,
                    length=length,
                    pes_number=1,
                    file_size=300,
                    output_size=300
                ))
                task_id += 1
            except ValueError:
                continue

    return cloudlets

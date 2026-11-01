"""
============================================================================
EVALUATOR: Fast Analytical Fitness Evaluator untuk Space-Shared CloudSim
============================================================================
Memodelkan antrean Space-Shared CPU core secara analitis (< 0.05 ms per evaluasi),
menghitung Makespan, Biaya Sewa, Fitness ternormalisasi, dan VM bottleneck.
"""

from typing import List, Sequence
from dataclasses import dataclass
from src.models import VM, Cloudlet


@dataclass
class EvaluationResult:
    makespan: float
    cost: float
    fitness: float
    vm_finish_times: List[float]
    bottleneck_vm: int
    actual_cpu_time: float


# Cache spesifikasi VM untuk eksekusi ultra-cepat
VM_MIPS = (
    2500.0, 2500.0, 2500.0, 2500.0,
    1500.0, 1500.0, 1500.0, 1500.0, 1500.0, 1500.0,
    800.0, 800.0, 800.0, 800.0, 800.0, 800.0
)

VM_COST_RATES = (
    150.0, 150.0, 150.0, 150.0,
    40.0, 40.0, 40.0, 40.0, 40.0, 40.0,
    18.0, 18.0, 18.0, 18.0, 18.0, 18.0
)


def evaluate(
    assignment: Sequence[int],
    cloudlets: List[Cloudlet],
    vms: List[VM],
    w_makespan: float = 0.5,
    w_cost: float = 0.5,
    ref_makespan: float = 0.0,
    ref_cost: float = 0.0
) -> EvaluationResult:
    """
    Evaluasi analitis alokasi task ke VM:
    1. Memodelkan 2 vCPU untuk VM 0-3 (Compute) dan 1 vCPU untuk VM 4-15 (Standard & Light).
    2. Mendistribusikan task ke vCPU dengan waktu luang paling awal (Space-Shared).
    3. Menghitung Makespan, Total Cost, dan Normalized Fitness.
    """
    # Slot vCPU 0 untuk semua 16 VM
    slot0 = [0.0] * 16
    # Slot vCPU 1 khusus untuk 4 VM Compute (id 0..3)
    slot1 = [0.0] * 4

    actual_cpu_time = 0.0
    mips_tbl = VM_MIPS

    for i, vm_idx in enumerate(assignment):
        t_len = cloudlets[i].length
        exec_t = t_len / mips_tbl[vm_idx]
        actual_cpu_time += exec_t

        if vm_idx < 4:
            if slot0[vm_idx] <= slot1[vm_idx]:
                slot0[vm_idx] += exec_t
            else:
                slot1[vm_idx] += exec_t
        else:
            slot0[vm_idx] += exec_t

    # Waktu selesai masing-masing VM
    vm_finish = [0.0] * 16
    makespan = 0.0
    bottleneck_vm = 0
    cost = 0.0
    cost_rates = VM_COST_RATES

    for j in range(16):
        if j < 4:
            fin = slot0[j] if slot0[j] > slot1[j] else slot1[j]
        else:
            fin = slot0[j]
        vm_finish[j] = fin
        cost += fin * cost_rates[j]
        if fin > makespan:
            makespan = fin
            bottleneck_vm = j

    # Bi-Objective Normalized Fitness
    if ref_makespan > 0 and ref_cost > 0:
        fitness = w_makespan * (makespan / ref_makespan) + w_cost * (cost / ref_cost)
    else:
        fitness = 1.0

    return EvaluationResult(
        makespan=makespan,
        cost=cost,
        fitness=fitness,
        vm_finish_times=vm_finish,
        bottleneck_vm=bottleneck_vm,
        actual_cpu_time=actual_cpu_time
    )


def generate_lpt_initial_solution(cloudlets: List[Cloudlet], vms: List[VM]) -> List[int]:
    """
    Membangun solusi awal menggunakan heuristik Longest Processing Time (LPT).
    Task diurutkan menurun berdasarkan panjang MI, lalu dialokasikan ke
    slot vCPU yang dapat menyelesaikannya paling awal.
    """
    n = len(cloudlets)
    assignment = [0] * n

    # Slot vCPU 0 untuk 16 VM, Slot vCPU 1 untuk 4 VM Compute
    slot0 = [0.0] * 16
    slot1 = [0.0] * 4
    mips_tbl = VM_MIPS

    # Urutkan task secara menurun berdasarkan panjang instruksi MI
    order = sorted(range(n), key=lambda i: cloudlets[i].length, reverse=True)

    for idx in order:
        t_len = cloudlets[idx].length
        best_vm = 0
        best_slot = 0
        best_finish = float("inf")

        for j in range(16):
            mips = mips_tbl[j]
            exec_t = t_len / mips

            # Cek slot 0
            fin0 = slot0[j] + exec_t
            if fin0 < best_finish:
                best_finish = fin0
                best_vm = j
                best_slot = 0

            # Cek slot 1 jika VM Compute (j < 4)
            if j < 4:
                fin1 = slot1[j] + exec_t
                if fin1 < best_finish:
                    best_finish = fin1
                    best_vm = j
                    best_slot = 1

        # Update slot terpilih
        if best_slot == 0:
            slot0[best_vm] = best_finish
        else:
            slot1[best_vm] = best_finish

        assignment[idx] = best_vm

    return assignment

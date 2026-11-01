"""
============================================================================
METRICS: Kalkulator Metrik Standar Penjadwalan Cloud
============================================================================
Menghitung Makespan, Total Cost, Resource Utilization (%), Degree of Imbalance,
Throughput (task/s), dan distribusi alokasi task ke tier VM.
"""

from typing import List, Dict
from src.models import VM, Cloudlet
from src.evaluator import EvaluationResult


def calculate_metrics(
    assignment: List[int],
    cloudlets: List[Cloudlet],
    vms: List[VM],
    eval_res: EvaluationResult,
    scheduling_ms: float = 0.0
) -> Dict[str, float]:
    """
    Menghitung 6 metrik kinerja evaluasi penjadwalan.
    """
    n_tasks = len(cloudlets)
    num_vms = len(vms)
    makespan = eval_res.makespan
    cost = eval_res.cost

    # Total kapasitas CPU teoritis = total vCPU * Makespan
    total_vcpu = sum(vm.vcpu for vm in vms)
    capacity = total_vcpu * makespan if makespan > 0 else 1.0

    # Resource Utilization (%)
    busy_time = eval_res.actual_cpu_time
    utilization_pct = (busy_time / capacity) * 100.0 if capacity > 0 else 0.0

    # Degree of Imbalance (DI)
    vm_finishes = eval_res.vm_finish_times
    max_t = max(vm_finishes) if vm_finishes else 0.0
    min_t = min(vm_finishes) if vm_finishes else 0.0
    avg_t = sum(vm_finishes) / num_vms if num_vms > 0 else 1.0
    imbalance = (max_t - min_t) / avg_t if avg_t > 0 else 0.0

    # Throughput (task/detik)
    throughput_tps = n_tasks / makespan if makespan > 0 else 0.0

    # Distribusi alokasi task ke jenis VM
    n_compute = sum(1 for vm_id in assignment if vm_id < 4)
    n_standard = sum(1 for vm_id in assignment if 4 <= vm_id < 10)
    n_light = sum(1 for vm_id in assignment if 10 <= vm_id < 16)
    
    pct_compute = (n_compute / n_tasks) * 100.0 if n_tasks > 0 else 0.0
    pct_standard = (n_standard / n_tasks) * 100.0 if n_tasks > 0 else 0.0
    pct_light = (n_light / n_tasks) * 100.0 if n_tasks > 0 else 0.0

    return {
        "tasks": float(n_tasks),
        "makespan_s": makespan,
        "total_cost_gd": cost,
        "utilization_pct": utilization_pct,
        "imbalance": imbalance,
        "throughput_tps": throughput_tps,
        "scheduling_ms": scheduling_ms,
        "pct_compute": pct_compute,
        "pct_standard": pct_standard,
        "pct_light": pct_light
    }

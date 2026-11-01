"""
============================================================================
TABU SEARCH (TS) SCHEDULER: Optimasi Task Scheduling Berbasis Trajectory
============================================================================
Menggunakan LPT warm-start, pencarian tetangga terarah (Critical, Cost, Swap),
Tabu List dengan tenure 15, dan Aspiration Criterion.
"""

import random
from typing import List, Tuple
from src.models import VM, Cloudlet
from src.evaluator import evaluate, generate_lpt_initial_solution, EvaluationResult


class TabuSearchScheduler:
    def __init__(
        self,
        max_iterations: int = 150,
        neighborhood_size: int = 40,
        tabu_tenure: int = 15,
        w_makespan: float = 0.5,
        w_cost: float = 0.5,
        seed: int = 42
    ):
        self.max_iterations = max_iterations
        self.neighborhood_size = neighborhood_size
        self.tabu_tenure = tabu_tenure
        self.w_makespan = w_makespan
        self.w_cost = w_cost
        self.seed = seed

    def schedule(
        self,
        cloudlets: List[Cloudlet],
        vms: List[VM],
        run_index: int = 0
    ) -> Tuple[List[int], EvaluationResult]:
        """
        Menjalankan optimasi penjadwalan Tabu Search.
        Mengembalikan assignment akhir dan EvaluationResult.
        """
        n = len(cloudlets)
        m = len(vms)
        if n == 0 or m == 0:
            return [], EvaluationResult(0, 0, 0, [], 0, 0)

        rng = random.Random(self.seed + n + run_index * 1000)

        # 1. Inisialisasi solusi awal berbasis LPT (Warm-Start)
        current = generate_lpt_initial_solution(cloudlets, vms)
        best = list(current)

        # Evaluasi baseline LPT untuk memperoleh nilai acuan refMakespan & refCost
        init_res = evaluate(current, cloudlets, vms, self.w_makespan, self.w_cost, 0, 0)
        ref_makespan = init_res.makespan
        ref_cost = init_res.cost

        # Evaluasi fitness awal ternormalisasi
        current_res = evaluate(
            current, cloudlets, vms, self.w_makespan, self.w_cost, ref_makespan, ref_cost
        )
        best_fitness = current_res.fitness
        best_res = current_res

        # 2. Struktur data Tabu Matrix: tabu_until[task_id][orig_vm]
        tabu_until = [[0] * m for _ in range(n)]

        # 3. Siklus iterasi Tabu Search
        stagnant = 0
        for it in range(1, self.max_iterations + 1):
            bottleneck_vm = current_res.bottleneck_vm

            best_candidate_fitness = float("inf")
            best_candidate_assignment = None
            best_move_task = -1
            best_move_orig_vm = -1
            best_move_target_vm = -1

            # Cari daftar task di bottleneck VM dan di Compute VMs
            bottleneck_tasks = [i for i, v in enumerate(current) if v == bottleneck_vm]
            compute_tasks = [i for i, v in enumerate(current) if v < 4]

            # Generate neighborhood moves
            for _ in range(self.neighborhood_size):
                move_type = rng.randint(0, 2)  # 0: Critical, 1: Cost, 2: Swap
                cand = list(current)
                t_idx = -1
                orig_vm = -1
                target_vm = -1

                if move_type == 0 and bottleneck_tasks:
                    # Critical Move: Pindahkan task dari bottleneck VM ke VM lain
                    t_idx = rng.choice(bottleneck_tasks)
                    orig_vm = bottleneck_vm
                    target_vm = rng.randint(0, m - 1)
                    if target_vm == orig_vm:
                        target_vm = (target_vm + 1) % m
                    cand[t_idx] = target_vm

                elif move_type == 1 and compute_tasks:
                    # Cost Move: Pindahkan task dari Compute VM (mahal) ke Standard/Light VM
                    t_idx = rng.choice(compute_tasks)
                    orig_vm = current[t_idx]
                    target_vm = rng.randint(4, m - 1)  # Standard (4-9) atau Light (10-15)
                    cand[t_idx] = target_vm

                else:
                    # Swap Move: Tukar 2 task antar 2 VM berbeda
                    t_a = rng.randint(0, n - 1)
                    t_b = rng.randint(0, n - 1)
                    if current[t_a] != current[t_b]:
                        orig_vm = current[t_a]
                        target_vm = current[t_b]
                        t_idx = t_a
                        cand[t_a], cand[t_b] = cand[t_b], cand[t_a]
                    else:
                        continue

                # Evaluasi kandidat
                cand_res = evaluate(
                    cand, cloudlets, vms, self.w_makespan, self.w_cost, ref_makespan, ref_cost
                )
                cand_fitness = cand_res.fitness

                # Cek status Tabu
                is_tabu = (t_idx >= 0 and tabu_until[t_idx][orig_vm] >= it)
                # Aspiration Criterion: Memecahkan rekor global best
                aspirates = (cand_fitness < best_fitness)

                if (not is_tabu or aspirates) and (cand_fitness < best_candidate_fitness):
                    best_candidate_fitness = cand_fitness
                    best_candidate_assignment = cand
                    best_move_task = t_idx
                    best_move_orig_vm = orig_vm
                    best_move_target_vm = target_vm

            # Jika menemukan kandidat yang dapat diterima
            if best_candidate_assignment is not None:
                current = best_candidate_assignment
                current_res = evaluate(
                    current, cloudlets, vms, self.w_makespan, self.w_cost, ref_makespan, ref_cost
                )

                # Catat move ke tabu memory
                if best_move_task >= 0:
                    tabu_until[best_move_task][best_move_orig_vm] = it + self.tabu_tenure

                # Update Global Best jika ada perbaikan
                if current_res.fitness < best_fitness:
                    best = list(current)
                    best_fitness = current_res.fitness
                    best_res = current_res
                    stagnant = 0
                else:
                    stagnant += 1

            # Kriteria berhenti konvergensi stagnan
            if stagnant >= 35:
                break

        return best, best_res

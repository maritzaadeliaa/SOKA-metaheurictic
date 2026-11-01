"""
============================================================================
FLOWER POLLINATION ALGORITHM (FPA) SCHEDULER: Swarm Intelligence
============================================================================
Mengadopsi penyerbukan bunga biologis (Xin-She Yang, 2012):
- Penyerbukan Global (Biotik): Lévy flight via Mantegna's algorithm menuju g*
- Penyerbukan Lokal (Abiotik): Crossover antar bunga acak dengan probabilitas p = 0.8
- Seleksi Greedy: Pembaruan posisi bunga hanya jika fitness membaik
"""

import math
import random
from typing import List, Tuple
from src.models import VM, Cloudlet
from src.evaluator import evaluate, generate_lpt_initial_solution, EvaluationResult


class FlowerPollinationScheduler:
    SIGMA_U = 0.6965745  # Deviasi standar Mantegna untuk beta = 1.5

    def __init__(
        self,
        pop_size: int = 20,
        max_iterations: int = 80,
        switch_probability: float = 0.8,
        gamma: float = 0.1,
        beta: float = 1.5,
        w_makespan: float = 0.5,
        w_cost: float = 0.5,
        seed: int = 42
    ):
        self.pop_size = pop_size
        self.max_iterations = max_iterations
        self.switch_probability = switch_probability
        self.gamma = gamma
        self.beta = beta
        self.w_makespan = w_makespan
        self.w_cost = w_cost
        self.seed = seed

    def _levy_step(self, rng: random.Random) -> float:
        """Menghasilkan langkah Lévy Flight menggunakan algoritma Mantegna."""
        u = rng.gauss(0, self.SIGMA_U)
        v = rng.gauss(0, 1.0)
        return u / (abs(v) ** (1.0 / self.beta))

    def schedule(
        self,
        cloudlets: List[Cloudlet],
        vms: List[VM],
        run_index: int = 0
    ) -> Tuple[List[int], EvaluationResult]:
        """
        Menjalankan optimasi penjadwalan Flower Pollination Algorithm.
        Mengembalikan assignment terbaik dan EvaluationResult.
        """
        n = len(cloudlets)
        m = len(vms)
        if n == 0 or m == 0:
            return [], EvaluationResult(0, 0, 0, [], 0, 0)

        rng = random.Random(self.seed + n * 7 + run_index * 1000)

        # 1. Inisialisasi Solusi Awal LPT untuk acuan baseline
        lpt_sol = generate_lpt_initial_solution(cloudlets, vms)
        init_res = evaluate(lpt_sol, cloudlets, vms, self.w_makespan, self.w_cost, 0, 0)
        ref_makespan = init_res.makespan
        ref_cost = init_res.cost

        # 2. Inisialisasi Populasi Bunga
        # Bunga 0: Warm-start menggunakan solusi LPT
        population: List[List[int]] = [list(lpt_sol)]
        fitness: List[float] = []

        res0 = evaluate(
            population[0], cloudlets, vms, self.w_makespan, self.w_cost, ref_makespan, ref_cost
        )
        fitness.append(res0.fitness)

        best_flower = list(population[0])
        best_fitness = fitness[0]
        best_res = res0

        # Bunga 1 s/d pop_size-1: Dibuat dari perturbasi terarah agar beragam
        for _ in range(1, self.pop_size):
            flower = list(lpt_sol)
            num_mutations = max(1, int(n * rng.uniform(0.1, 0.3)))
            for _ in range(num_mutations):
                t_idx = rng.randint(0, n - 1)
                flower[t_idx] = rng.randint(0, m - 1)
            population.append(flower)

            res = evaluate(
                flower, cloudlets, vms, self.w_makespan, self.w_cost, ref_makespan, ref_cost
            )
            fitness.append(res.fitness)

            if res.fitness < best_fitness:
                best_flower = list(flower)
                best_fitness = res.fitness
                best_res = res

        # 3. Siklus Generasi Penyerbukan FPA
        for it in range(1, self.max_iterations + 1):
            for i in range(self.pop_size):
                new_flower = list(population[i])

                if rng.random() < self.switch_probability:
                    # Global Pollination (Biotik): Lévy flight menuju bunga terbaik global (g*)
                    levy = self._levy_step(rng)
                    for k in range(n):
                        diff = best_flower[k] - population[i][k]
                        step = self.gamma * levy * diff
                        val = population[i][k] + int(round(step))
                        # Jika langkah nol, berikan probabilitas adopsi langsung g*
                        if val == population[i][k] and rng.random() < 0.25:
                            val = best_flower[k]
                        new_flower[k] = max(0, min(m - 1, val))
                else:
                    # Local Pollination (Abiotik): Crossover antar 2 bunga acak j dan k
                    j = rng.randint(0, self.pop_size - 1)
                    k = rng.randint(0, self.pop_size - 1)
                    eps = rng.random()
                    for t in range(n):
                        step = int(round(eps * (population[j][t] - population[k][t])))
                        val = population[i][t] + step
                        new_flower[t] = max(0, min(m - 1, val))

                # Evaluasi Bunga Baru
                new_res = evaluate(
                    new_flower, cloudlets, vms, self.w_makespan, self.w_cost, ref_makespan, ref_cost
                )

                # Greedy Selection: Terima jika menghasilkan fitness lebih baik
                if new_res.fitness < fitness[i]:
                    population[i] = new_flower
                    fitness[i] = new_res.fitness

                    if new_res.fitness < best_fitness:
                        best_flower = list(new_flower)
                        best_fitness = new_res.fitness
                        best_res = new_res

        return best_flower, best_res

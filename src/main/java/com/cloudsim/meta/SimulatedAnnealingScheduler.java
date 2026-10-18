package com.cloudsim.meta;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import org.cloudbus.cloudsim.Cloudlet;
import org.cloudbus.cloudsim.Vm;

/**
 * Algoritma Metaheuristik 2: Simulated Annealing (SA) untuk Task Scheduling.
 *
 * Komponen Utama:
 * 1. Representasi Solusi: array integer panjang N, solution[i] = vmIndex
 * 2. Suhu Awal (T0) dan Cooling Schedule:
 *    - Penurunan suhu geometrik: T = T * alpha (misal alpha = 0.95)
 *    - Inner loop (Markov chain length L per suhu)
 * 3. Perturbasi (Neighbor Generation):
 *    - Critical Move (fokus VM bottleneck)
 *    - Cost Optimization Move (fokus VM mahal)
 *    - Swap Move antar 2 VM berbeda
 * 4. Kriteria Penerimaan Metropolis (Metropolis Acceptance Criterion):
 *    - Jika delta E < 0: selalu terima (solusi lebih baik)
 *    - Jika delta E >= 0: terima dengan probabilitas P = exp(-delta E * scale / T)
 * 5. Stopping Criteria: Suhu mencapai Tmin atau batas iterasi tercapai
 */
public class SimulatedAnnealingScheduler {

    private double initialTemp = 100.0;
    private double minTemp = 0.05;
    private double coolingRate = 0.95;
    private int iterationsPerTemp = 25;
    private double wMakespan = 0.5;
    private double wCost = 0.5;
    private long seed = 42L;

    public SimulatedAnnealingScheduler() {}

    public SimulatedAnnealingScheduler(
            double initialTemp,
            double minTemp,
            double coolingRate,
            int iterationsPerTemp,
            double wMakespan,
            double wCost) {
        this.initialTemp = initialTemp;
        this.minTemp = minTemp;
        this.coolingRate = coolingRate;
        this.iterationsPerTemp = iterationsPerTemp;
        this.wMakespan = wMakespan;
        this.wCost = wCost;
    }

    public void setWeights(double wMakespan, double wCost) {
        this.wMakespan = wMakespan;
        this.wCost = wCost;
    }

    public void schedule(List<Cloudlet> cloudlets, List<Vm> vms) {
        int n = cloudlets.size();
        int m = vms.size();
        if (n == 0 || m == 0) return;

        Random random = new Random(seed + n * 3L);

        // 1. Inisialisasi Solusi Awal dengan LPT
        int[] current = generateInitialSolution(cloudlets, vms);
        int[] best = Arrays.copyOf(current, n);

        // Evaluasi dasar untuk normalisasi fitness
        SolutionEvaluator.Result initRes = SolutionEvaluator.evaluate(
                current, cloudlets, vms, wMakespan, wCost, 0, 0);
        double refMakespan = initRes.makespan;
        double refCost = initRes.cost;

        SolutionEvaluator.Result currentRes = SolutionEvaluator.evaluate(
                current, cloudlets, vms, wMakespan, wCost, refMakespan, refCost);
        double currentFitness = currentRes.fitness;
        double bestFitness = currentFitness;

        // 2. Loop Annealing (Penurunan Suhu)
        double t = initialTemp;
        while (t > minTemp) {

            for (int step = 0; step < iterationsPerTemp; step++) {
                int[] candidate = Arrays.copyOf(current, n);
                int bottleneckVm = currentRes.bottleneckVm;

                List<Integer> bottleneckTasks = new ArrayList<>();
                for (int i = 0; i < n; i++) {
                    if (current[i] == bottleneckVm) {
                        bottleneckTasks.add(i);
                    }
                }

                double r = random.nextDouble();
                if (r < 0.50 && !bottleneckTasks.isEmpty()) {
                    // Type 1: Critical Move (pindahkan task dari bottleneck VM)
                    int taskIdx = bottleneckTasks.get(random.nextInt(bottleneckTasks.size()));
                    int targetVm = random.nextInt(m);
                    if (targetVm == current[taskIdx]) targetVm = (targetVm + 1) % m;
                    candidate[taskIdx] = targetVm;

                } else if (r < 0.75) {
                    // Type 2: Cost Move (pindahkan task dari Compute VM ke yang lebih hemat)
                    int taskIdx = random.nextInt(n);
                    if (VmFactory.typeOf(vms.get(current[taskIdx]).getId()).equals("Compute-Intensive")) {
                        int targetVm = VmFactory.COMPUTE_COUNT + random.nextInt(m - VmFactory.COMPUTE_COUNT);
                        candidate[taskIdx] = targetVm;
                    } else {
                        candidate[taskIdx] = random.nextInt(m);
                    }
                } else {
                    // Type 3: Swap Move (tukar 2 task antar VM berbeda)
                    int taskA = random.nextInt(n);
                    int taskB = random.nextInt(n);
                    if (taskA != taskB) {
                        int temp = candidate[taskA];
                        candidate[taskA] = candidate[taskB];
                        candidate[taskB] = temp;
                    }
                }

                // Evaluasi Solusi Kandidat
                SolutionEvaluator.Result candRes = SolutionEvaluator.evaluate(
                        candidate, cloudlets, vms, wMakespan, wCost, refMakespan, refCost);
                double deltaE = candRes.fitness - currentFitness;

                // 3. Kriteria Penerimaan Metropolis
                if (deltaE < 0) {
                    // Solusi lebih baik: terima langsung
                    current = candidate;
                    currentFitness = candRes.fitness;
                    currentRes = candRes;

                    if (currentFitness < bestFitness) {
                        bestFitness = currentFitness;
                        best = Arrays.copyOf(current, n);
                    }
                } else {
                    // Solusi lebih buruk: terima dengan probabilitas Metropolis
                    double acceptanceProb = Math.exp((-deltaE * 100.0) / t);
                    if (random.nextDouble() < acceptanceProb) {
                        current = candidate;
                        currentFitness = candRes.fitness;
                        currentRes = candRes;
                    }
                }
            }

            // 4. Cooling Step
            t *= coolingRate;
        }

        // 5. Terapkan solusi terbaik ke Cloudlet
        for (int i = 0; i < n; i++) {
            cloudlets.get(i).setVmId(vms.get(best[i]).getId());
        }
    }

    /** Inisialisasi awal menggunakan algoritma LPT. */
    private int[] generateInitialSolution(List<Cloudlet> cloudlets, List<Vm> vms) {
        int n = cloudlets.size();
        int[] assignment = new int[n];

        List<Integer> slotToVmIndex = new ArrayList<>();
        for (int j = 0; j < vms.size(); j++) {
            for (int p = 0; p < vms.get(j).getNumberOfPes(); p++) {
                slotToVmIndex.add(j);
            }
        }
        double[] freeAt = new double[slotToVmIndex.size()];

        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> Long.compare(
                cloudlets.get(b).getCloudletLength(), cloudlets.get(a).getCloudletLength()));

        for (int idx : order) {
            long len = cloudlets.get(idx).getCloudletLength();
            int bestSlot = 0;
            double bestFinish = Double.MAX_VALUE;
            for (int s = 0; s < slotToVmIndex.size(); s++) {
                int vmIdx = slotToVmIndex.get(s);
                double finish = freeAt[s] + (double) len / vms.get(vmIdx).getMips();
                if (finish < bestFinish) {
                    bestFinish = finish;
                    bestSlot = s;
                }
            }
            freeAt[bestSlot] = bestFinish;
            assignment[idx] = slotToVmIndex.get(bestSlot);
        }

        return assignment;
    }
}

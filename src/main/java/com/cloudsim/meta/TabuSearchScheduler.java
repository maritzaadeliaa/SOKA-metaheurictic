package com.cloudsim.meta;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import org.cloudbus.cloudsim.Cloudlet;
import org.cloudbus.cloudsim.Vm;

/**
 * Algoritma Metaheuristik 1: Tabu Search (TS) untuk Task Scheduling.
 *
 * Komponen Utama:
 * 1. Representasi Solusi: array integer panjang N, solution[i] = vmIndex
 * 2. Inisialisasi: Greedy LPT untuk mendapatkan titik awal yang berkualitas tinggi
 * 3. Neighborhood Operators:
 *    - Critical VM Move: memindahkan task dari VM bottleneck ke VM lain
 *    - Cost Reduction Move: memindahkan task dari VM Compute ke Standard/Light
 *    - Swap Move: menukar penugasan 2 task antar VM berbeda
 * 4. Tabu List: matriks tabuUntil[taskId][vmId] untuk mencegah cycling
 * 5. Aspiration Criterion: memperbolehkan move tabu jika melampaui rekor global terbaik
 * 6. Stopping Criteria: batas maksimum iterasi atau stagnansi konvergensi
 */
public class TabuSearchScheduler {

    private int maxIterations = 150;
    private int neighborhoodSize = 40;
    private int tabuTenure = 15;
    private double wMakespan = 0.5;
    private double wCost = 0.5;
    private long seed = 42L;

    public TabuSearchScheduler() {}

    public TabuSearchScheduler(int maxIterations, int neighborhoodSize, int tabuTenure, double wMakespan, double wCost) {
        this.maxIterations = maxIterations;
        this.neighborhoodSize = neighborhoodSize;
        this.tabuTenure = tabuTenure;
        this.wMakespan = wMakespan;
        this.wCost = wCost;
    }

    public void setWeights(double wMakespan, double wCost) {
        this.wMakespan = wMakespan;
        this.wCost = wCost;
    }

    public void setMaxIterations(int maxIterations) {
        this.maxIterations = maxIterations;
    }

    public void schedule(List<Cloudlet> cloudlets, List<Vm> vms) {
        int n = cloudlets.size();
        int m = vms.size();
        if (n == 0 || m == 0) return;

        Random random = new Random(seed + n);

        // 1. Inisialisasi Solusi Awal dengan LPT
        int[] current = generateInitialSolution(cloudlets, vms);
        int[] best = Arrays.copyOf(current, n);

        // Evaluasi awal untuk normalisasi fitness
        SolutionEvaluator.Result initRes = SolutionEvaluator.evaluate(
                current, cloudlets, vms, wMakespan, wCost, 0, 0);
        double refMakespan = initRes.makespan;
        double refCost = initRes.cost;

        SolutionEvaluator.Result currentRes = SolutionEvaluator.evaluate(
                current, cloudlets, vms, wMakespan, wCost, refMakespan, refCost);
        double bestFitness = currentRes.fitness;

        // 2. Tabu Matrix: tabuUntil[task][vm] mencatat kapan larangan berakhir
        int[][] tabuUntil = new int[n][m];

        // 3. Loop Iterasi Tabu Search
        int stagnant = 0;
        for (int iter = 1; iter <= maxIterations; iter++) {
            int bestMoveTask = -1;
            int bestMoveTargetVm = -1;
            int bestMoveOrigVm = -1;
            int bestSwapTaskA = -1;
            int bestSwapTaskB = -1;
            boolean isSwap = false;
            double bestCandidateFitness = Double.MAX_VALUE;
            int[] bestCandidateAssignment = null;

            int bottleneckVm = currentRes.bottleneckVm;

            // Kumpulkan task yang berada pada VM bottleneck
            List<Integer> bottleneckTasks = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if (current[i] == bottleneckVm) {
                    bottleneckTasks.add(i);
                }
            }

            // 4. Eksplorasi Neighborhood
            for (int k = 0; k < neighborhoodSize; k++) {
                double r = random.nextDouble();

                if (r < 0.50 && !bottleneckTasks.isEmpty()) {
                    // Type 1: Critical Move - pindahkan task dari VM bottleneck ke VM lain
                    int taskIdx = bottleneckTasks.get(random.nextInt(bottleneckTasks.size()));
                    int origVm = current[taskIdx];
                    int targetVm = random.nextInt(m);
                    if (targetVm == origVm) targetVm = (origVm + 1) % m;

                    int[] candidate = Arrays.copyOf(current, n);
                    candidate[taskIdx] = targetVm;

                    SolutionEvaluator.Result candRes = SolutionEvaluator.evaluate(
                            candidate, cloudlets, vms, wMakespan, wCost, refMakespan, refCost);

                    boolean isTabu = tabuUntil[taskIdx][origVm] >= iter;
                    boolean aspiration = candRes.fitness < bestFitness;

                    if ((!isTabu || aspiration) && candRes.fitness < bestCandidateFitness) {
                        bestCandidateFitness = candRes.fitness;
                        bestCandidateAssignment = candidate;
                        bestMoveTask = taskIdx;
                        bestMoveOrigVm = origVm;
                        bestMoveTargetVm = targetVm;
                        isSwap = false;
                    }

                } else if (r < 0.75) {
                    // Type 2: Cost Move - pindahkan task dari VM Compute ke Standard/Light
                    int taskIdx = random.nextInt(n);
                    int origVm = current[taskIdx];
                    if (VmFactory.typeOf(vms.get(origVm).getId()).equals("Compute-Intensive")) {
                        // Pilih target VM bertarif lebih rendah (id >= 4)
                        int targetVm = VmFactory.COMPUTE_COUNT + random.nextInt(m - VmFactory.COMPUTE_COUNT);
                        int[] candidate = Arrays.copyOf(current, n);
                        candidate[taskIdx] = targetVm;

                        SolutionEvaluator.Result candRes = SolutionEvaluator.evaluate(
                                candidate, cloudlets, vms, wMakespan, wCost, refMakespan, refCost);

                        boolean isTabu = tabuUntil[taskIdx][origVm] >= iter;
                        boolean aspiration = candRes.fitness < bestFitness;

                        if ((!isTabu || aspiration) && candRes.fitness < bestCandidateFitness) {
                            bestCandidateFitness = candRes.fitness;
                            bestCandidateAssignment = candidate;
                            bestMoveTask = taskIdx;
                            bestMoveOrigVm = origVm;
                            bestMoveTargetVm = targetVm;
                            isSwap = false;
                        }
                    }
                } else {
                    // Type 3: Swap Move - tukar 2 task antar VM berbeda
                    int taskA = random.nextInt(n);
                    int taskB = random.nextInt(n);
                    if (taskA != taskB && current[taskA] != current[taskB]) {
                        int[] candidate = Arrays.copyOf(current, n);
                        int vmA = current[taskA];
                        int vmB = current[taskB];
                        candidate[taskA] = vmB;
                        candidate[taskB] = vmA;

                        SolutionEvaluator.Result candRes = SolutionEvaluator.evaluate(
                                candidate, cloudlets, vms, wMakespan, wCost, refMakespan, refCost);

                        boolean isTabu = (tabuUntil[taskA][vmA] >= iter) || (tabuUntil[taskB][vmB] >= iter);
                        boolean aspiration = candRes.fitness < bestFitness;

                        if ((!isTabu || aspiration) && candRes.fitness < bestCandidateFitness) {
                            bestCandidateFitness = candRes.fitness;
                            bestCandidateAssignment = candidate;
                            bestSwapTaskA = taskA;
                            bestSwapTaskB = taskB;
                            isSwap = true;
                        }
                    }
                }
            }

            // 5. Terapkan Solusi Kandidat Terbaik
            if (bestCandidateAssignment != null) {
                current = bestCandidateAssignment;
                currentRes = SolutionEvaluator.evaluate(
                        current, cloudlets, vms, wMakespan, wCost, refMakespan, refCost);

                // Update Tabu Matrix
                if (!isSwap && bestMoveTask >= 0) {
                    tabuUntil[bestMoveTask][bestMoveOrigVm] = iter + tabuTenure;
                } else if (isSwap && bestSwapTaskA >= 0 && bestSwapTaskB >= 0) {
                    tabuUntil[bestSwapTaskA][current[bestSwapTaskB]] = iter + tabuTenure;
                    tabuUntil[bestSwapTaskB][current[bestSwapTaskA]] = iter + tabuTenure;
                }

                // Cek Pembaruan Global Best
                if (currentRes.fitness < bestFitness) {
                    bestFitness = currentRes.fitness;
                    best = Arrays.copyOf(current, n);
                    stagnant = 0;
                } else {
                    stagnant++;
                }
            } else {
                stagnant++;
            }

            if (stagnant >= 40) {
                // Konvergen: keluar lebih awal jika stagnan
                break;
            }
        }

        // 6. Tetapkan hasil terbaik ke setiap Cloudlet
        for (int i = 0; i < n; i++) {
            cloudlets.get(i).setVmId(vms.get(best[i]).getId());
        }
    }

    /** Inisialisasi awal menggunakan algoritma LPT untuk menghasilkan titik start berkualitas. */
    private int[] generateInitialSolution(List<Cloudlet> cloudlets, List<Vm> vms) {
        int n = cloudlets.size();
        int[] assignment = new int[n];

        // Buat sub-slot vCPU
        List<Integer> slotToVmIndex = new ArrayList<>();
        for (int j = 0; j < vms.size(); j++) {
            for (int p = 0; p < vms.get(j).getNumberOfPes(); p++) {
                slotToVmIndex.add(j);
            }
        }
        double[] freeAt = new double[slotToVmIndex.size()];

        // Index terurut descending
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

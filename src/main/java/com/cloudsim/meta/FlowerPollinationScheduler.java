package com.cloudsim.meta;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import org.cloudbus.cloudsim.Cloudlet;
import org.cloudbus.cloudsim.Vm;

/**
 * Algoritma Metaheuristik 2: Flower Pollination Algorithm (FPA) untuk Task Scheduling.
 *
 * Diperkenalkan oleh Xin-She Yang (2012), meniru proses penyerbukan bunga di alam:
 * 1. Global Pollination (Penyerbukan Biotik & Silang):
 *    - Melibatkan polinator (lebah, burung, kelelawar) yang bergerak jarak jauh
 *    - Dimodelkan dengan distribusi Lévy flight:
 *      x_i^{t+1} = x_i^t + gamma * L(lambda) * (g* - x_i^t)
 * 2. Local Pollination (Penyerbukan Abiotik & Mandiri):
 *    - Terjadi jarak dekat (difusi angin/air) tanpa polinator
 *    - Dimodelkan dengan crossover antar bunga sejenis:
 *      x_i^{t+1} = x_i^t + epsilon * (x_j^t - x_k^t)
 * 3. Switch Probability (p):
 *    - Probabilitas p (default 0.8) menentukan peralihan antara penyerbukan global dan lokal.
 * 4. Kriteria Seleksi:
 *    - Greedy selection: solusi baru diterima jika menghasilkan nilai fitness yang lebih baik.
 */
public class FlowerPollinationScheduler {

    private int popSize = 20;            // Jumlah populasi bunga (bunga/solusi kandidat)
    private int maxIterations = 80;      // Maksimum generasi/iterasi penyerbukan
    private double switchProbability = 0.8; // Probabilitas peralihan global vs lokal (p)
    private double gamma = 0.1;          // Faktor skala langkah Lévy flight
    private double beta = 1.5;           // Parameter eksponen distribusi Lévy flight
    private double wMakespan = 0.5;
    private double wCost = 0.5;
    private long seed = 42L;

    // Konstanta Mantegna untuk distribusi Lévy (beta = 1.5)
    // sigma_u = { [gamma(1+beta) * sin(pi*beta/2)] / [gamma((1+beta)/2) * beta * 2^((beta-1)/2)] }^(1/beta)
    private static final double SIGMA_U = 0.6965745;

    public FlowerPollinationScheduler() {}

    public FlowerPollinationScheduler(
            int popSize,
            int maxIterations,
            double switchProbability,
            double wMakespan,
            double wCost) {
        this.popSize = popSize;
        this.maxIterations = maxIterations;
        this.switchProbability = switchProbability;
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

        Random random = new Random(seed + n * 7L);

        // 1. Inisialisasi Populasi Bunga
        int[][] population = new int[popSize][n];
        double[] fitness = new double[popSize];

        // Bunga 0 diisi menggunakan inisialisasi heuristik LPT (Warm Start)
        population[0] = generateInitialSolution(cloudlets, vms);

        // Evaluasi dasar untuk normalisasi fitness
        SolutionEvaluator.Result initRes = SolutionEvaluator.evaluate(
                population[0], cloudlets, vms, wMakespan, wCost, 0, 0);
        double refMakespan = initRes.makespan;
        double refCost = initRes.cost;

        SolutionEvaluator.Result res0 = SolutionEvaluator.evaluate(
                population[0], cloudlets, vms, wMakespan, wCost, refMakespan, refCost);
        fitness[0] = res0.fitness;

        int[] bestFlower = Arrays.copyOf(population[0], n);
        double bestFitness = fitness[0];

        // Sisa bunga dalam populasi dibuat dengan variasi/perturbasi untuk diversifikasi awal
        for (int i = 1; i < popSize; i++) {
            population[i] = Arrays.copyOf(population[0], n);
            // Acak sebagian alokasi task (15% task)
            int mutateCount = Math.max(1, (int) (n * 0.15));
            for (int k = 0; k < mutateCount; k++) {
                int taskIdx = random.nextInt(n);
                population[i][taskIdx] = random.nextInt(m);
            }
            SolutionEvaluator.Result r = SolutionEvaluator.evaluate(
                    population[i], cloudlets, vms, wMakespan, wCost, refMakespan, refCost);
            fitness[i] = r.fitness;

            if (fitness[i] < bestFitness) {
                bestFitness = fitness[i];
                bestFlower = Arrays.copyOf(population[i], n);
            }
        }

        // 2. Loop Generasi / Iterasi Penyerbukan (Flower Pollination Loop)
        for (int iter = 1; iter <= maxIterations; iter++) {

            for (int i = 0; i < popSize; i++) {
                int[] candidate = Arrays.copyOf(population[i], n);

                if (random.nextDouble() < switchProbability) {
                    // ==========================================
                    // Aturan 1: GLOBAL POLLINATION (Biotik / Lévy Flight)
                    // ==========================================
                    // Meniru polinator jarak jauh yang membawa serbuk sari ke arah bunga terbaik (g*)
                    double levyStep = generateLevyStep(random);

                    for (int d = 0; d < n; d++) {
                        // Probabilitas task mengadopsi alokasi dari bunga terbaik global (g*)
                        double inheritProb = Math.min(1.0, Math.abs(levyStep) * gamma + 0.35);
                        if (random.nextDouble() < inheritProb) {
                            candidate[d] = bestFlower[d];
                        } else if (random.nextDouble() < 0.08) {
                            // Mutasi acak skala kecil
                            candidate[d] = random.nextInt(m);
                        }
                    }

                } else {
                    // ==========================================
                    // Aturan 2: LOCAL POLLINATION (Abiotik / Angin)
                    // ==========================================
                    // Penyerbukan lokal antar dua bunga berbeda dari spesies yang sama
                    int j = random.nextInt(popSize);
                    int k = random.nextInt(popSize);
                    while (k == j) {
                        k = random.nextInt(popSize);
                    }

                    double epsilon = random.nextDouble();

                    for (int d = 0; d < n; d++) {
                        if (population[j][d] == population[k][d]) {
                            candidate[d] = population[j][d];
                        } else {
                            // Crossover diskrit proporsional epsilon
                            candidate[d] = (epsilon < 0.5) ? population[j][d] : population[k][d];
                        }

                        // Local refinement: jika task berada pada VM Compute mahal,
                        // ada peluang dialihkan ke VM Standard/Light untuk menekan biaya
                        if (random.nextDouble() < 0.05 && VmFactory.typeOf(vms.get(candidate[d]).getId()).equals("Compute-Intensive")) {
                            candidate[d] = VmFactory.COMPUTE_COUNT + random.nextInt(m - VmFactory.COMPUTE_COUNT);
                        }
                    }
                }

                // 3. Evaluasi Solusi Baru (Greedy Selection)
                SolutionEvaluator.Result candRes = SolutionEvaluator.evaluate(
                        candidate, cloudlets, vms, wMakespan, wCost, refMakespan, refCost);

                if (candRes.fitness < fitness[i]) {
                    // Bunga i berkembang menjadi solusi kandidat yang lebih unggul
                    population[i] = candidate;
                    fitness[i] = candRes.fitness;

                    // Perbarui Global Best (g*) jika tercipta rekor baru
                    if (candRes.fitness < bestFitness) {
                        bestFitness = candRes.fitness;
                        bestFlower = Arrays.copyOf(candidate, n);
                    }
                }
            }
        }

        // 4. Tetapkan pemetaan bunga terbaik ke seluruh Cloudlet
        for (int i = 0; i < n; i++) {
            cloudlets.get(i).setVmId(vms.get(bestFlower[i]).getId());
        }
    }

    /**
     * Menghasilkan ukuran langkah Lévy Flight menggunakan algoritma Mantegna.
     * step = u / |v|^(1/beta), di mana u ~ N(0, sigma_u^2) dan v ~ N(0, 1).
     */
    private double generateLevyStep(Random random) {
        double u = random.nextGaussian() * SIGMA_U;
        double v = random.nextGaussian();
        if (Math.abs(v) < 1e-10) v = 1e-10;
        return u / Math.pow(Math.abs(v), 1.0 / beta);
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

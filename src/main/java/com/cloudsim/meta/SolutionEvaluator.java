package com.cloudsim.meta;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.cloudbus.cloudsim.Cloudlet;
import org.cloudbus.cloudsim.Vm;

/**
 * Evaluator analitis cepat untuk mengevaluasi kualitas alokasi task ke VM
 * selama proses pencarian metaheuristik (Tabu Search dan Simulated Annealing).
 */
public class SolutionEvaluator {

    public static class Result {
        public final double makespan;
        public final double cost;
        public final double fitness;
        public final double[] vmFinishTimes;
        public final int bottleneckVm;

        public Result(double makespan, double cost, double fitness, double[] vmFinishTimes, int bottleneckVm) {
            this.makespan = makespan;
            this.cost = cost;
            this.fitness = fitness;
            this.vmFinishTimes = vmFinishTimes;
            this.bottleneckVm = bottleneckVm;
        }
    }

    /**
     * Hitung perkiraan Makespan, Total Biaya, dan Nilai Fitness gabungan.
     */
    public static Result evaluate(
            int[] assignment,
            List<Cloudlet> cloudlets,
            List<Vm> vms,
            double wMakespan,
            double wCost,
            double refMakespan,
            double refCost) {

        int numVms = vms.size();
        double[] vmFinish = new double[numVms];

        // Buat sub-slot untuk setiap VM yang memiliki multi-core (misal Compute-Intensive 2 vCPU)
        @SuppressWarnings("unchecked")
        List<Double>[] vmSlots = new List[numVms];
        for (int j = 0; j < numVms; j++) {
            int pes = vms.get(j).getNumberOfPes();
            vmSlots[j] = new ArrayList<>(pes);
            for (int p = 0; p < pes; p++) {
                vmSlots[j].add(0.0);
            }
        }

        // Distribusikan beban task ke slot vCPU pada VM yang dipilih
        for (int i = 0; i < cloudlets.size(); i++) {
            int vmIndex = assignment[i];
            double mips = vms.get(vmIndex).getMips();
            double taskLen = cloudlets.get(i).getCloudletLength();

            // Cari core yang paling cepat luang pada VM ini
            List<Double> slots = vmSlots[vmIndex];
            int bestSlot = 0;
            double minTime = slots.get(0);
            for (int s = 1; s < slots.size(); s++) {
                if (slots.get(s) < minTime) {
                    minTime = slots.get(s);
                    bestSlot = s;
                }
            }

            double finish = minTime + (taskLen / mips);
            slots.set(bestSlot, finish);
        }

        double makespan = 0.0;
        int bottleneckVm = 0;
        double cost = 0.0;

        for (int j = 0; j < numVms; j++) {
            double maxSlot = 0.0;
            for (double t : vmSlots[j]) {
                if (t > maxSlot) maxSlot = t;
            }
            vmFinish[j] = maxSlot;
            if (maxSlot > makespan) {
                makespan = maxSlot;
                bottleneckVm = j;
            }
            cost += maxSlot * VmFactory.costPerSecond(vms.get(j).getId());
        }

        double normMakespan = (refMakespan > 0) ? (makespan / refMakespan) : 1.0;
        double normCost = (refCost > 0) ? (cost / refCost) : 1.0;
        double fitness = (wMakespan * normMakespan) + (wCost * normCost);

        return new Result(makespan, cost, fitness, vmFinish, bottleneckVm);
    }
}

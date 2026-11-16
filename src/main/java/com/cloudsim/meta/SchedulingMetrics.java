package com.cloudsim.meta;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.cloudbus.cloudsim.Cloudlet;
import org.cloudbus.cloudsim.Vm;

public class SchedulingMetrics {

    public static final String K_DONE = "Cloudlet selesai";
    public static final String K_MAKESPAN = "Makespan (s)";
    public static final String K_COST = "Total Cost (G$)";
    public static final String K_UTIL = "Resource Utilization (%)";
    public static final String K_IMB = "Degree of Imbalance";
    public static final String K_THR = "Throughput (task/s)";

    /**
     * Hitung metrik standar CloudSim dari cloudlet yang selesai dan VM yang aktif.
     */
    public static Map<String, Double> calculate(List<Cloudlet> finished, List<Vm> vms) {
        Map<String, Double> metrics = new LinkedHashMap<>();
        double makespan = 0;
        double busyTime = 0;
        int done = 0;
        Map<Integer, Double> vmFinish = new HashMap<>();

        for (Cloudlet c : finished) {
            if (c.getCloudletStatus() != Cloudlet.SUCCESS) continue;
            done++;
            makespan = Math.max(makespan, c.getFinishTime());
            busyTime += c.getActualCPUTime();
            vmFinish.merge(c.getVmId(), c.getFinishTime(), Math::max);
        }
        if (done == 0 || vms.isEmpty()) return metrics;

        double cost = 0, capacity = 0;
        double maxT = 0, minT = Double.MAX_VALUE, sumT = 0;
        for (Vm vm : vms) {
            double t = vmFinish.getOrDefault(vm.getId(), 0.0);
            cost += t * VmFactory.costPerSecond(vm.getId());
            capacity += vm.getNumberOfPes() * makespan;
            maxT = Math.max(maxT, t);
            minT = Math.min(minT, t);
            sumT += t;
        }
        double avgT = sumT / vms.size();

        metrics.put(K_DONE, (double) done);
        metrics.put(K_MAKESPAN, makespan);
        metrics.put(K_COST, cost);
        metrics.put(K_UTIL, busyTime / capacity * 100.0);
        metrics.put(K_IMB, (maxT - minT) / (avgT > 0 ? avgT : 1.0));
        metrics.put(K_THR, done / (makespan > 0 ? makespan : 1.0));
        return metrics;
    }
}

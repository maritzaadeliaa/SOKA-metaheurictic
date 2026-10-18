package com.cloudsim.meta;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.cloudbus.cloudsim.Cloudlet;
import org.cloudbus.cloudsim.DatacenterBroker;
import org.cloudbus.cloudsim.Log;
import org.cloudbus.cloudsim.Vm;
import org.cloudbus.cloudsim.core.CloudSim;

/**
 * Main Runner untuk Eksperimen Komparasi Metaheuristik Task Scheduling di CloudSim:
 * - Algoritma 1: Tabu Search (TS)
 * - Algoritma 2: Simulated Annealing (SA)
 *
 * Menguji seluruh dataset GoCJ (100 s/d 1.000 task) dan Sintetik (100 s/d 10.000 task).
 */
public class Main {

    private static final int REPEATS = 3;
    private static final String DATA_DIR = "data";
    private static final String RESULT_DIR = "results";

    private static final long GOCJ_SHORT_MAX = 100_000L;
    private static final long GOCJ_MEDIUM_MAX = 350_000L;

    public static final String K_MAKESPAN = SchedulingMetrics.K_MAKESPAN;
    public static final String K_COST = SchedulingMetrics.K_COST;
    public static final String K_UTIL = SchedulingMetrics.K_UTIL;
    public static final String K_IMB = SchedulingMetrics.K_IMB;
    public static final String K_THR = SchedulingMetrics.K_THR;
    public static final String K_DONE = SchedulingMetrics.K_DONE;
    public static final String K_SCHED = "Scheduling (ms)";
    public static final String K_TASKS = "Tasks";
    public static final String K_PCT_C = "Pct Compute";
    public static final String K_PCT_S = "Pct Standard";
    public static final String K_PCT_L = "Pct Light";

    private static Map<Integer, Integer> referencePlacement;
    private static boolean placementAlwaysSame = true;

    private static class Dataset {
        final String name, source, path;
        final long shortMax, mediumMax;

        Dataset(String name, String source, String path, long shortMax, long mediumMax) {
            this.name = name;
            this.source = source;
            this.path = path;
            this.shortMax = shortMax;
            this.mediumMax = mediumMax;
        }
    }

    public static void main(String[] args) throws Exception {
        Log.disable();
        new File(RESULT_DIR).mkdirs();

        List<Dataset> datasets = collectDatasets();
        if (datasets.isEmpty()) {
            System.out.println("Tidak ada dataset yang ditemukan di folder " + DATA_DIR);
            return;
        }

        printAndSaveStats(datasets);

        String[] algorithms = {"TabuSearch", "SimulatedAnnealing"};

        System.out.println("\n==========================================================================================================");
        System.out.println("               HASIL KOMPARASI METAHEURISTIK TS vs SA (RATA-RATA " + REPEATS + " RUN PER DATASET)");
        System.out.println("==========================================================================================================");
        System.out.printf("%-20s %-10s %-18s %12s %16s %9s %10s %12s %10s%n",
                "Dataset", "Task", "Algoritma", "Makespan(s)", "Cost(G$)", "Util(%)", "Imbalance", "Thrput(t/s)", "Sched(ms)");
        System.out.println("----------------------------------------------------------------------------------------------------------");

        try (PrintWriter meanCsv = new PrintWriter(RESULT_DIR + "/hasil_komparasi.csv", "UTF-8");
             PrintWriter runsCsv = new PrintWriter(RESULT_DIR + "/hasil_komparasi_runs.csv", "UTF-8")) {

            meanCsv.println("dataset,source,workload,tasks,algorithm,runs,makespan_s,total_cost_gd,"
                    + "utilization_pct,imbalance,throughput_tps,scheduling_ms_mean,scheduling_ms_std,"
                    + "pct_tasks_compute,pct_tasks_standard,pct_tasks_light");

            runsCsv.println("dataset,source,tasks,algorithm,run,makespan_s,total_cost_gd,"
                    + "utilization_pct,imbalance,throughput_tps,scheduling_ms");

            for (Dataset d : datasets) {
                int taskCount = 0;

                for (String algo : algorithms) {
                    List<Map<String, Double>> results = new ArrayList<>();
                    boolean failed = false;

                    for (int r = 1; r <= REPEATS; r++) {
                        Map<String, Double> m = runSimulation(d.path, algo);
                        checkPlacement();
                        if (!m.containsKey(K_MAKESPAN)) {
                            failed = true;
                            break;
                        }
                        results.add(m);

                        runsCsv.println(String.format(Locale.US,
                                "%s,%s,%d,%s,%d,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f",
                                d.name, d.source, m.get(K_TASKS).intValue(), algo, r,
                                m.get(K_MAKESPAN), m.get(K_COST), m.get(K_UTIL),
                                m.get(K_IMB), m.get(K_THR), m.get(K_SCHED)));
                    }

                    if (failed || results.isEmpty()) {
                        System.out.println(d.name + " (" + algo + "): GAGAL");
                        continue;
                    }

                    taskCount = results.get(0).get(K_TASKS).intValue();
                    String workload = workloadOf(taskCount);

                    System.out.printf(Locale.US, "%-20s %-10d %-18s %12.2f %16.2f %9.2f %10.3f %12.3f %10.3f%n",
                            d.name, taskCount, algo,
                            mean(results, K_MAKESPAN), mean(results, K_COST),
                            mean(results, K_UTIL), mean(results, K_IMB),
                            mean(results, K_THR), mean(results, K_SCHED));

                    meanCsv.println(String.format(Locale.US,
                            "%s,%s,%s,%d,%s,%d,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.4f,%.2f,%.2f,%.2f",
                            d.name, d.source, workload, taskCount, algo, REPEATS,
                            mean(results, K_MAKESPAN), mean(results, K_COST),
                            mean(results, K_UTIL), mean(results, K_IMB),
                            mean(results, K_THR), mean(results, K_SCHED), std(results, K_SCHED),
                            mean(results, K_PCT_C), mean(results, K_PCT_S), mean(results, K_PCT_L)));
                }
                System.out.println("----------------------------------------------------------------------------------------------------------");
            }
        }

        printAndSavePlacement();
        printAndSavePlacementDetail();

        System.out.println("\nSimulasi selesai! File hasil tersedia di folder " + RESULT_DIR + "/ :");
        System.out.println("  1. hasil_komparasi.csv      (Rangkuman rata-rata semua algoritma)");
        System.out.println("  2. hasil_komparasi_runs.csv (Data mentah tiap run)");
        System.out.println("  3. dataset_stats.csv        (Karakteristik panjang task)");
        System.out.println("  4. host_vm_placement.csv    (Pemetaan VM ke Host)");
        System.out.println("  5. vm_placement_detail.csv  (Detail alokasi resource per VM)");
    }

    private static Map<String, Double> runSimulation(String dataFile, String algorithm) throws Exception {
        CloudSim.init(1, Calendar.getInstance(), false);
        DatacenterFactory.PLACEMENT.clear();

        DatacenterFactory factory = new DatacenterFactory();
        factory.createDatacenter(0, 0); // Datacenter 0: Host 0-4
        factory.createDatacenter(1, 2); // Datacenter 1: Host 5-9

        DatacenterBroker broker = new DatacenterBroker("Broker_" + algorithm);
        List<Vm> vms = new VmFactory().createVms(broker);
        List<Cloudlet> cloudlets = new CloudletGenerator().generateCloudlets(dataFile);
        for (Cloudlet c : cloudlets) {
            c.setUserId(broker.getId());
        }

        long t0 = System.nanoTime();
        if ("TabuSearch".equalsIgnoreCase(algorithm) || "TS".equalsIgnoreCase(algorithm)) {
            new TabuSearchScheduler().schedule(cloudlets, vms);
        } else if ("SimulatedAnnealing".equalsIgnoreCase(algorithm) || "SA".equalsIgnoreCase(algorithm)) {
            new SimulatedAnnealingScheduler().schedule(cloudlets, vms);
        }
        double schedulingMs = (System.nanoTime() - t0) / 1_000_000.0;

        broker.submitVmList(vms);
        broker.submitCloudletList(cloudlets);

        CloudSim.startSimulation();
        CloudSim.stopSimulation();

        List<Cloudlet> finished = broker.getCloudletReceivedList();
        Map<String, Double> metrics = new LinkedHashMap<>(SchedulingMetrics.calculate(finished, vms));
        metrics.put(K_TASKS, (double) cloudlets.size());
        metrics.put(K_SCHED, schedulingMs);

        int nCompute = 0, nStandard = 0, nLight = 0;
        for (Cloudlet c : finished) {
            String type = VmFactory.typeOf(c.getVmId());
            if ("Compute-Intensive".equals(type)) nCompute++;
            else if ("Standard".equals(type)) nStandard++;
            else nLight++;
        }
        double n = Math.max(1, finished.size());
        metrics.put(K_PCT_C, 100.0 * nCompute / n);
        metrics.put(K_PCT_S, 100.0 * nStandard / n);
        metrics.put(K_PCT_L, 100.0 * nLight / n);

        return metrics;
    }

    private static List<Dataset> collectDatasets() throws IOException {
        List<Dataset> list = new ArrayList<>();

        // 1. Dataset GoCJ
        File[] gocj = new File(DATA_DIR).listFiles(
                (dir, name) -> name.matches("GoCJ_Dataset_\\d+\\.txt"));
        if (gocj != null) {
            Arrays.sort(gocj, Comparator.comparingInt(f -> numberOf(f.getName())));
            for (File f : gocj) {
                list.add(new Dataset(f.getName().replace(".txt", ""), "GoCJ", f.getPath(),
                        GOCJ_SHORT_MAX, GOCJ_MEDIUM_MAX));
            }
        }

        // 2. Dataset Sintetik
        File synDir = new File(DatasetGenerator.SYNTHETIC_DIR);
        if (synDir.exists()) {
            File[] syn = synDir.listFiles((dir, name) -> name.matches("Synthetic_\\d+\\.txt"));
            if (syn != null) {
                Arrays.sort(syn, Comparator.comparingInt(f -> numberOf(f.getName())));
                for (File f : syn) {
                    list.add(new Dataset(f.getName().replace(".txt", ""), "Sintetik", f.getPath(),
                            DatasetGenerator.SMALL_MAX, DatasetGenerator.MEDIUM_MAX));
                }
            }
        }

        return list;
    }

    private static void printAndSaveStats(List<Dataset> datasets) throws IOException {
        System.out.println("\n===== STATISTIK DATASET (persen task pendek / sedang / panjang) =====");
        System.out.printf("%-22s %-9s %6s %9s %9s %9s %10s %8s %8s %8s%n",
                "Dataset", "Sumber", "Task", "Min(MI)", "Median", "Max(MI)", "Mean",
                "%Pendek", "%Sedang", "%Panjang");

        try (PrintWriter csv = new PrintWriter(RESULT_DIR + "/dataset_stats.csv", "UTF-8")) {
            csv.println("dataset,source,tasks,min_mi,p25_mi,median_mi,p75_mi,p90_mi,max_mi,"
                    + "mean_mi,total_mi,short_max_mi,medium_max_mi,pct_short,pct_medium,pct_long");
            for (Dataset d : datasets) {
                DatasetStats s = DatasetStats.of(
                        CloudletGenerator.readLengths(d.path), d.shortMax, d.mediumMax);
                System.out.printf(Locale.US, "%-22s %-9s %6d %9d %9d %9d %10.0f %8.1f %8.1f %8.1f%n",
                        d.name, d.source, s.count, s.min, s.median, s.max, s.mean,
                        s.pctShort, s.pctMedium, s.pctLong);
                csv.println(String.format(Locale.US,
                        "%s,%s,%d,%d,%d,%d,%d,%d,%d,%.2f,%d,%d,%d,%.2f,%.2f,%.2f",
                        d.name, d.source, s.count, s.min, s.p25, s.median, s.p75, s.p90, s.max,
                        s.mean, s.total, d.shortMax, d.mediumMax,
                        s.pctShort, s.pctMedium, s.pctLong));
            }
        }
    }

    private static void printAndSavePlacement() throws IOException {
        Map<Integer, Integer> placement = DatacenterFactory.PLACEMENT;
        int[][] count = new int[10][3];
        for (Map.Entry<Integer, Integer> e : placement.entrySet()) {
            String type = VmFactory.typeOf(e.getKey());
            int col = "Compute-Intensive".equals(type) ? 0 : "Standard".equals(type) ? 1 : 2;
            count[e.getValue()][col]++;
        }

        try (PrintWriter csv = new PrintWriter(RESULT_DIR + "/host_vm_placement.csv", "UTF-8")) {
            csv.println("host_id,grade,total_vm,compute_intensive,standard,light_weight");
            for (int h = 0; h < 10; h++) {
                int total = count[h][0] + count[h][1] + count[h][2];
                csv.println(h + "," + DatacenterFactory.gradeOf(h) + "," + total + ","
                        + count[h][0] + "," + count[h][1] + "," + count[h][2]);
            }
        }
    }

    private static void checkPlacement() {
        Map<Integer, Integer> now = new java.util.TreeMap<>(DatacenterFactory.PLACEMENT);
        if (referencePlacement == null) {
            referencePlacement = now;
        } else if (!referencePlacement.equals(now)) {
            placementAlwaysSame = false;
        }
    }

    private static void printAndSavePlacementDetail() throws IOException {
        if (referencePlacement == null) return;
        try (PrintWriter csv = new PrintWriter(RESULT_DIR + "/vm_placement_detail.csv", "UTF-8")) {
            csv.println("vm_id,vm_type,vcpu,mips_per_vcpu,ram_mb,bw_mbps,cost_per_s,host_id,host_grade");
            for (Map.Entry<Integer, Integer> e : referencePlacement.entrySet()) {
                int vm = e.getKey(), h = e.getValue();
                int[] spec = VmFactory.specOf(vm);
                csv.println(vm + "," + VmFactory.typeOf(vm) + "," + spec[0] + "," + spec[1] + ","
                        + spec[2] + "," + spec[3] + "," + (int) VmFactory.costPerSecond(vm) + ","
                        + h + "," + DatacenterFactory.gradeOf(h));
            }
        }
    }

    private static String workloadOf(int tasks) {
        if (tasks <= 300) return "Ringan";
        if (tasks <= 700) return "Sedang";
        if (tasks <= 1000) return "Berat";
        return "Sangat berat";
    }

    private static int numberOf(String fileName) {
        return Integer.parseInt(fileName.replaceAll("\\D", ""));
    }

    private static double mean(List<Map<String, Double>> rs, String key) {
        double sum = 0;
        for (Map<String, Double> r : rs) sum += r.get(key);
        return sum / rs.size();
    }

    private static double std(List<Map<String, Double>> rs, String key) {
        double mu = mean(rs, key), sum = 0;
        for (Map<String, Double> r : rs) sum += (r.get(key) - mu) * (r.get(key) - mu);
        return Math.sqrt(sum / rs.size());
    }
}

package com.cloudsim.meta;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.cloudbus.cloudsim.Datacenter;
import org.cloudbus.cloudsim.DatacenterCharacteristics;
import org.cloudbus.cloudsim.Host;
import org.cloudbus.cloudsim.Pe;
import org.cloudbus.cloudsim.Storage;
import org.cloudbus.cloudsim.Vm;
import org.cloudbus.cloudsim.VmAllocationPolicySimple;
import org.cloudbus.cloudsim.VmSchedulerSpaceShared;
import org.cloudbus.cloudsim.provisioners.BwProvisionerSimple;
import org.cloudbus.cloudsim.provisioners.PeProvisionerSimple;
import org.cloudbus.cloudsim.provisioners.RamProvisionerSimple;

/**
 * Membuat Datacenter berisi 10 host fisik (dibagi ke 2 Datacenter: 0-4 dan 5-9).
 *
 * GRADE HOST:
 *   Host id 0-3 : "High grade" = Server High Performance
 *                 8 core @3000 MIPS, 32 GB RAM, 1 TB storage, 10 Gbps
 *   Host id 4-9 : "Low grade"  = Server Standard
 *                 4 core @1500 MIPS, 16 GB RAM, 500 GB storage, 1 Gbps
 */
public class DatacenterFactory {

    /** vmId -> hostId, diisi saat VM berhasil ditempatkan. */
    public static final Map<Integer, Integer> PLACEMENT = new TreeMap<>();

    public static final int HIGH_GRADE_HOSTS = 4; // host id 0-3

    public static String gradeOf(int hostId) {
        return hostId < HIGH_GRADE_HOSTS ? "High grade" : "Low grade";
    }

    /** Spesifikasi host: {core, MIPS/core, RAM MB, BW Mbps}. */
    public static int[] specOf(int hostId) {
        return hostId < HIGH_GRADE_HOSTS
                ? new int[]{8, 3_000, 32 * 1024, 10_000}
                : new int[]{4, 1_500, 16 * 1024, 1_000};
    }

    public Datacenter createDatacenter(int datacenterId, int firstHostId) {
        List<Host> hostList = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            int hostId = firstHostId + i;
            boolean highPerformance = hostId < HIGH_GRADE_HOSTS;
            int cores = highPerformance ? 8 : 4;
            int mipsPerCore = highPerformance ? 3_000 : 1_500;
            int ramMb = highPerformance ? 32 * 1024 : 16 * 1024;
            long storageMb = highPerformance ? 1_000_000L : 500_000L;
            long bandwidthMbps = highPerformance ? 10_000L : 1_000L;

            List<Pe> peList = new ArrayList<>();
            for (int peId = 0; peId < cores; peId++) {
                peList.add(new Pe(peId, new PeProvisionerSimple(mipsPerCore)));
            }

            Host host = new Host(
                    hostId,
                    new RamProvisionerSimple(ramMb),
                    new BwProvisionerSimple(bandwidthMbps),
                    storageMb,
                    peList,
                    new VmSchedulerSpaceShared(peList));
            hostList.add(host);
        }

        DatacenterCharacteristics characteristics = new DatacenterCharacteristics(
                "x86",
                "Linux",
                "Xen",
                hostList,
                10.0, // Zona waktu
                3.0,  // Cost per second
                0.05, // Cost per MB storage per second
                0.001,// Cost per Mbps bandwidth per second
                0.0); // Cost per transaction

        List<Storage> storageList = new LinkedList<>();
        try {
            return new Datacenter(
                    "Datacenter_" + datacenterId,
                    characteristics,
                    new PlacementPolicy(hostList),
                    storageList,
                    0.0);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create Datacenter_" + datacenterId, exception);
        }
    }

    public static class PlacementPolicy extends VmAllocationPolicySimple {

        public PlacementPolicy(List<? extends Host> list) {
            super(list);
        }

        @Override
        public boolean allocateHostForVm(Vm vm) {
            boolean placed = super.allocateHostForVm(vm);
            if (placed) {
                PLACEMENT.put(vm.getId(), getHost(vm).getId());
            }
            return placed;
        }
    }
}

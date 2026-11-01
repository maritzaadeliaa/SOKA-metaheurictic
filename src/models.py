"""
============================================================================
MODELS: Host Fisik, Virtual Machine (VM), Cloudlet, dan Infrastruktur Cloud
============================================================================
"""

from dataclasses import dataclass
from typing import List, Dict


@dataclass
class Host:
    id: int
    grade: str            # 'High grade' atau 'Low grade'
    cores: int
    mips_per_core: float
    ram_mb: int
    bw_mbps: int
    storage_mb: int


@dataclass
class VM:
    id: int
    vm_type: str          # 'Compute-Intensive', 'Standard', 'Light-weight'
    vcpu: int             # Jumlah vCPU / PEs
    mips: float           # MIPS per vCPU
    ram_mb: int
    bw_mbps: int
    cost_per_s: float     # Tarif sewa per detik (G$/s)
    host_id: int = -1
    host_grade: str = ""


@dataclass
class Cloudlet:
    id: int
    length: int           # Panjang instruksi dalam MI (Million Instructions)
    pes_number: int = 1
    file_size: int = 300
    output_size: int = 300
    vm_id: int = -1


def create_hosts() -> List[Host]:
    """
    Membuat 10 host fisik pada 2 datacenter:
    - Host 0-3 : High grade (8 core @ 3000 MIPS, 32 GB RAM, 10 Gbps BW, 1 TB Storage)
    - Host 4-9 : Low grade  (4 core @ 1500 MIPS, 16 GB RAM, 1 Gbps BW, 500 GB Storage)
    """
    hosts = []
    for h_id in range(10):
        if h_id < 4:
            hosts.append(Host(
                id=h_id,
                grade="High grade",
                cores=8,
                mips_per_core=3000.0,
                ram_mb=32 * 1024,
                bw_mbps=10_000,
                storage_mb=1_000_000
            ))
        else:
            hosts.append(Host(
                id=h_id,
                grade="Low grade",
                cores=4,
                mips_per_core=1500.0,
                ram_mb=16 * 1024,
                bw_mbps=1_000,
                storage_mb=500_000
            ))
    return hosts


def create_vms() -> List[VM]:
    """
    Membuat 16 Virtual Machine heterogen sesuai spesifikasi 3-tier:
    - 4 VM Compute-Intensive (id 0-3) : 2 vCPU @ 2500 MIPS, 8 GB RAM, 1 Gbps BW, 150 G$/s
    - 6 VM Standard (id 4-9)          : 1 vCPU @ 1500 MIPS, 4 GB RAM, 250 Mbps BW, 40 G$/s
    - 6 VM Light-weight (id 10-15)    : 1 vCPU @ 800 MIPS, 2 GB RAM, 250 Mbps BW, 18 G$/s
    """
    vms: List[VM] = []
    
    # 4 Compute-Intensive
    for i in range(4):
        vms.append(VM(
            id=i,
            vm_type="Compute-Intensive",
            vcpu=2,
            mips=2500.0,
            ram_mb=8192,
            bw_mbps=1000,
            cost_per_s=150.0
        ))
        
    # 6 Standard
    for i in range(4, 10):
        vms.append(VM(
            id=i,
            vm_type="Standard",
            vcpu=1,
            mips=1500.0,
            ram_mb=4096,
            bw_mbps=250,
            cost_per_s=40.0
        ))
        
    # 6 Light-weight
    for i in range(10, 16):
        vms.append(VM(
            id=i,
            vm_type="Light-weight",
            vcpu=1,
            mips=800.0,
            ram_mb=2048,
            bw_mbps=250,
            cost_per_s=18.0
        ))

    # Alokasi penempatan VM ke Host fisik konsisten deterministik
    # (Mengikuti VmAllocationPolicySimple pada 4 host High-grade pertama)
    placement_map: Dict[int, int] = {
        0: 0, 1: 1, 2: 2, 3: 3,
        4: 0, 5: 1, 6: 2, 7: 3, 8: 0, 9: 1,
        10: 2, 11: 3, 12: 0, 13: 1, 14: 2, 15: 3
    }
    for vm in vms:
        vm.host_id = placement_map[vm.id]
        vm.host_grade = "High grade" if vm.host_id < 4 else "Low grade"

    return vms

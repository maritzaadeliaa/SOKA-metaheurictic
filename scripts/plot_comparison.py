import csv
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULT = os.path.join(ROOT, "results")
OUT = os.path.join(RESULT, "grafik")
os.makedirs(OUT, exist_ok=True)

SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK2 = "#52514e"
GRID = "#e4e3df"

ALGO_COLORS = {
    "TabuSearch": "#1f77b4",          # Biru (Metaheuristic 1)
    "FlowerPollination": "#2ca02c"   # Hijau/Emerald (Metaheuristic 2)
}

ALGO_LABELS = {
    "TabuSearch": "Tabu Search (TS)",
    "FlowerPollination": "Flower Pollination Algorithm (FPA)"
}

ALGO_MARKERS = {
    "TabuSearch": "o",
    "FlowerPollination": "s"
}

METRICS = [
    ("makespan_s", "Makespan", "detik", "makespan"),
    ("total_cost_gd", "Total Cost", "G$", "total_cost"),
    ("utilization_pct", "Resource Utilization", "%", "utilization"),
    ("imbalance", "Degree of Imbalance", "", "imbalance"),
    ("throughput_tps", "Throughput", "task/detik", "throughput"),
    ("scheduling_ms_mean", "Waktu Penjadwalan (Convergence)", "ms", "scheduling_time"),
]

plt.rcParams.update({
    "font.size": 10,
    "axes.edgecolor": GRID,
    "axes.labelcolor": INK2,
    "xtick.color": INK2,
    "ytick.color": INK2,
    "text.color": INK,
    "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE,
})


def read_data(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def fmt(v):
    if abs(v) >= 1000:
        return f"{v:,.0f}".replace(",", ".")
    if abs(v) >= 10:
        return f"{v:.1f}".replace(".", ",")
    return f"{v:.3f}".replace(".", ",")


def axis_fmt(top):
    d = 0 if top >= 10 else (2 if top >= 1 else 3)
    def f(v, _):
        t = f"{v:,.{d}f}"
        return t.replace(",", "X").replace(".", ",").replace("X", ".")
    return ticker.FuncFormatter(f)


def style(ax):
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.grid(axis="y", color=GRID, linewidth=0.8, linestyle="--")
    ax.set_axisbelow(True)
    ax.tick_params(length=0)
    if ax.get_ylim()[1] > 0:
        ax.yaxis.set_major_formatter(axis_fmt(ax.get_ylim()[1]))


def plot_comparison_metric(rows, key, title, unit, slug):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.2))

    for ax, source in zip(axes, ("GoCJ", "Sintetik")):
        source_rows = [r for r in rows if r["source"] == source]
        if not source_rows:
            continue

        algos = ["TabuSearch", "FlowerPollination"]
        all_ys = []

        for algo in algos:
            pts = sorted(
                (int(r["tasks"]), float(r[key]))
                for r in source_rows
                if r["algorithm"].lower() == algo.lower() and int(r["tasks"]) <= 1000
            )
            if not pts:
                continue

            xs, ys = zip(*pts)
            all_ys.extend(ys)
            ax.plot(
                xs, ys,
                label=ALGO_LABELS.get(algo, algo),
                color=ALGO_COLORS.get(algo, "#333"),
                marker=ALGO_MARKERS.get(algo, "o"),
                markersize=5,
                linewidth=2.0,
                markeredgecolor=SURFACE,
                markeredgewidth=1.2
            )

        name = "GoCJ (Real-World)" if source == "GoCJ" else "Sintetik (30/40/30)"
        ax.set_title(f"Dataset {name}", loc="left", fontsize=11, fontweight="bold", color=INK)
        ax.set_xlabel("Jumlah Task", fontsize=10)
        ax.set_ylabel(f"{title}" + (f" ({unit})" if unit else ""), fontsize=10)

        # Atur ticks x
        x_ticks = sorted(list(set(int(r["tasks"]) for r in source_rows if int(r["tasks"]) <= 1000)))
        if len(x_ticks) > 12:
            ax.set_xticks(x_ticks)
            ax.set_xticklabels([str(x) if i % 2 == 0 else "" for i, x in enumerate(x_ticks)], rotation=30)
        else:
            ax.set_xticks(x_ticks)
            ax.set_xticklabels([str(x) for x in x_ticks], rotation=30)

        if key == "utilization_pct":
            ax.set_ylim(0, 105)
        elif all_ys:
            ax.set_ylim(0, max(all_ys) * 1.15)

        style(ax)
        ax.legend(frameon=False, fontsize=9)

    fig.suptitle(f"Perbandingan {title}: Tabu Search (TS) vs Flower Pollination Algorithm (FPA)",
                 x=0.03, ha="left", fontsize=12, fontweight="bold", color=INK)
    fig.tight_layout()
    out_file = os.path.join(OUT, f"komparasi_{slug}.png")
    fig.savefig(out_file, dpi=150)
    plt.close(fig)
    print(f"  [+] Disimpan: {out_file}")


def main():
    csv_path = os.path.join(RESULT, "hasil_komparasi.csv")
    rows = read_data(csv_path)
    if not rows:
        print(f"File {csv_path} belum ditemukan. Jalankan simulasi terlebih dahulu.")
        return

    print("\nMenghasilkan grafik komparasi di folder results/grafik/ ...")
    for key, title, unit, slug in METRICS:
        plot_comparison_metric(rows, key, title, unit, slug)
    print("Grafik komparasi berhasil dibuat!")


if __name__ == "__main__":
    main()

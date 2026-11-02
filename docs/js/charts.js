/**
 * Charts Helper Module - SOKA Presentasi Metaheuristik
 * Menangani pemuatan dan animasi grafik komparasi (Tabu Search vs FPA)
 * menggunakan HTML5 Canvas tanpa dependensi eksternal.
 */

window.Charts = {
  /**
   * Menggambar Bar Chart Komparasi TS vs FPA dengan Animasi Tumbuh (Growth Animation)
   * @param {string} canvasId - ID elemen <canvas>
   * @param {Array<string>} labels - Label sumbu X (misal: ['GoCJ 100', 'GoCJ 500', 'GoCJ 1000'])
   * @param {Array<number>} dataTS - Array nilai metrik untuk Tabu Search
   * @param {Array<number>} dataFPA - Array nilai metrik untuk Flower Pollination Algorithm
   * @param {string} unitLabel - Satuan unit metrik (misal: 's', 'G$', 'tps', '%', 'ms')
   */
  renderComparisonBar: function (
    canvasId,
    labels,
    dataTS,
    dataFPA,
    unitLabel = "",
  ) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let progress = 0;
    const animationDuration = 500; // Durasi animasi dalam milidetik
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsedTime = currentTime - startTime;
      progress = Math.min(elapsedTime / animationDuration, 1);

      // Fungsi Easing Out Quad untuk kelancaran animasi
      const easeProgress = 1 - (1 - progress) * (1 - progress);

      // Bersihkan Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const paddingLeft = 65;
      const paddingRight = 30;
      const paddingTop = 35;
      const paddingBottom = 45;

      const chartWidth = canvas.width - paddingLeft - paddingRight;
      const chartHeight = canvas.height - paddingTop - paddingBottom;

      // Menentukan nilai maksimum sumbu Y
      const maxVal = Math.max(...dataTS, ...dataFPA, 0.0001) * 1.18;

      // Garis Grid Sumbu Y
      ctx.beginPath();
      ctx.strokeStyle = "#e2e8f0"; // slate-200
      ctx.lineWidth = 1;

      const gridTicks = 3;
      for (let i = 0; i <= gridTicks; i++) {
        const yPos =
          canvas.height - paddingBottom - (chartHeight / gridTicks) * i;
        ctx.moveTo(paddingLeft, yPos);
        ctx.lineTo(canvas.width - paddingRight, yPos);

        // Label Angka Sumbu Y
        const gridVal = (maxVal / gridTicks) * i;
        let formattedVal = gridVal.toFixed(1);
        if (gridVal >= 1000) formattedVal = (gridVal / 1000).toFixed(1) + "k";

        ctx.fillStyle = "#64748b";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`${formattedVal} ${unitLabel}`, paddingLeft - 8, yPos + 3);
      }
      ctx.stroke();

      // Sumbu Utama (X & Y)
      ctx.beginPath();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.moveTo(paddingLeft, paddingTop);
      ctx.lineTo(paddingLeft, canvas.height - paddingBottom);
      ctx.lineTo(canvas.width - paddingRight, canvas.height - paddingBottom);
      ctx.stroke();

      // Perhitungan Lebar Batang (Bar)
      const groupWidth = chartWidth / labels.length;
      const barWidth = Math.min(groupWidth * 0.3, 38);
      const gapBetweenBars = 6;

      labels.forEach((label, i) => {
        const groupX =
          paddingLeft +
          i * groupWidth +
          (groupWidth - (barWidth * 2 + gapBetweenBars)) / 2;

        // 1. Bar Tabu Search (Biru)
        const valTS = dataTS[i] || 0;
        const hTS = (valTS / maxVal) * chartHeight * easeProgress;
        const xTS = groupX;
        const yTS = canvas.height - paddingBottom - hTS;

        ctx.fillStyle = "#2563eb"; // Blue-600
        ctx.fillRect(xTS, yTS, barWidth, hTS);

        // Angka Nilai TS di atas batang
        if (progress > 0.4) {
          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            valTS % 1 === 0 ? valTS : valTS.toFixed(1),
            xTS + barWidth / 2,
            yTS - 5,
          );
        }

        // 2. Bar Flower Pollination Algorithm (Hijau Emerald)
        const valFPA = dataFPA[i] || 0;
        const hFPA = (valFPA / maxVal) * chartHeight * easeProgress;
        const xFPA = groupX + barWidth + gapBetweenBars;
        const yFPA = canvas.height - paddingBottom - hFPA;

        ctx.fillStyle = "#10b981"; // Emerald-500
        ctx.fillRect(xFPA, yFPA, barWidth, hFPA);

        // Angka Nilai FPA di atas batang
        if (progress > 0.4) {
          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            valFPA % 1 === 0 ? valFPA : valFPA.toFixed(1),
            xFPA + barWidth / 2,
            yFPA - 5,
          );
        }

        // Label Sumbu X (Nama Dataset)
        ctx.fillStyle = "#334155";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          label,
          groupX + barWidth + gapBetweenBars / 2,
          canvas.height - paddingBottom + 18,
        );
      });

      // Legend
      const legendX = canvas.width - paddingRight - 170;
      const legendY = 15;

      // Legend TS
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(legendX, legendY - 9, 12, 12);
      ctx.fillStyle = "#1e293b";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Tabu Search", legendX + 16, legendY);

      // Legend FPA
      ctx.fillStyle = "#10b981";
      ctx.fillRect(legendX + 95, legendY - 9, 12, 12);
      ctx.fillStyle = "#1e293b";
      ctx.fillText("FPA", legendX + 111, legendY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  },
};

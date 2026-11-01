/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/charts.js
 * Pemilik : [Orang 4]
 * Tujuan  : Helper pembuatan grafik komparasi (Chart.js / SVG chart components)
 * ============================================================================
 * 
 * PANDUAN UNTUK ORANG 4:
 * Modul ini menyediakan utilitas rendering grafik metrik hasil simulasi:
 * - Makespan (s)
 * - Total Cost (G$)
 * - Degree of Imbalance (DI)
 * - Throughput (task/s)
 * - CPU Utilization (%)
 * - Scheduling Time / Konvergensi (ms)
 */

// STUB SAJA - Dikerjakan oleh Orang 4
window.CHARTS = window.CHARTS || {
  version: '1.0.0-stub',
  
  /**
   * Placeholder render bar/line chart komparasi TS vs FPA
   * @param {HTMLElement|string} targetEl Kontainer target
   * @param {Object} options Konfigurasi data & metrik
   */
  renderComparison(targetEl, options = {}) {
    const el = typeof targetEl === 'string' ? document.querySelector(targetEl) : targetEl;
    if (!el) return;
    el.innerHTML = `
      <div class="chart-stub-container">
        <p class="chart-stub-title">📊 Komparasi Metrik: ${options.metric || 'Performa'}</p>
        <p class="chart-stub-desc">[Grafik akan dirender di sini oleh Orang 4 menggunakan Chart.js/SVG]</p>
      </div>
    `;
  }
};

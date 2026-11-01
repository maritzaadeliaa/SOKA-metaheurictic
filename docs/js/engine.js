/**
 * ============================================================================
 * SOKA-metaheurictic: Slide Presentation Framework
 * File    : js/engine.js
 * Pemilik : [Orang 1]
 * Tujuan  : Core Engine Presentasi Slide HTML 16:9 Interaktif Step-by-Step
 * ============================================================================
 * 
 * KONTRAK ENGINE (Slides Framework):
 * ----------------------------------------------------------------------------
 * 1. Registrasi Slide:
 *    Slides.register({
 *      id    : 'slide-id',      // Identifier unik slide (string)
 *      title : 'Judul Slide',   // Judul presentasi untuk header/daftar
 *      steps : [                // Array langkah animasi/tahapan
 *        {
 *          label : 'Nama Langkah',
 *          enter(ctx) { ... },  // Dipanggil saat langkah aktif (bisa async)
 *          exit(ctx) { ... }    // Opsional: cleanup saat berpindah langkah
 *        }
 *      ]
 *    });
 * 
 * 2. Konteks `ctx` yang diberikan ke enter/exit:
 *    - `ctx.root`      : HTMLElement pembungkus konten slide aktif
 *    - `ctx.svg`       : Helper manipulasi & pembuatan elemen SVG
 *    - `ctx.sleep(ms)` : Promise delay untuk sequence animasi
 *    - `ctx.slideIndex`: Indeks slide saat ini (0-based)
 *    - `ctx.stepIndex` : Indeks step saat ini (0-based)
 *    - `ctx.totalSteps`: Total step pada slide saat ini
 * 
 * 3. Navigasi & Fitur:
 *    - Next / Prev via tombol UI & Keyboard (ArrowRight, ArrowLeft, Space)
 *    - Tombol Reset step (kembali ke step 0 pada slide saat ini)
 *    - Tombol Play/Pause (Auto-advance tiap 1.5 detik)
 *    - Sinkronisasi URL Hash (#1, #2, dst.)
 *    - Auto-scaling layout 16:9 presisi di semua resolusi layar
 * ============================================================================
 */

(function () {
  'use strict';

  // SVG Helper namespace
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const svgHelper = {
    /**
     * Membuat elemen SVG dengan atribut yang diberikan
     * @param {string} tag Nama tag SVG (rect, circle, path, dll)
     * @param {Object} attrs Atribut key-value
     * @returns {SVGElement}
     */
    create(tag, attrs = {}) {
      const el = document.createElementNS(SVG_NS, tag);
      for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
          el.setAttribute('class', value);
        } else if (key === 'textContent') {
          el.textContent = value;
        } else if (key === 'innerHTML') {
          el.innerHTML = value;
        } else if (value !== undefined && value !== null) {
          el.setAttribute(key, value);
        }
      }
      return el;
    },

    rect(x, y, width, height, attrs = {}) {
      return this.create('rect', { x, y, width, height, ...attrs });
    },

    circle(cx, cy, r, attrs = {}) {
      return this.create('circle', { cx, cy, r, ...attrs });
    },

    line(x1, y1, x2, y2, attrs = {}) {
      return this.create('line', { x1, y1, x2, y2, ...attrs });
    },

    text(x, y, content, attrs = {}) {
      const el = this.create('text', { x, y, ...attrs });
      if (content !== undefined && content !== null) {
        el.textContent = String(content);
      }
      return el;
    },

    path(d, attrs = {}) {
      return this.create('path', { d, ...attrs });
    },

    group(attrs = {}) {
      return this.create('g', attrs);
    },

    clear(el) {
      if (!el) return;
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    },

    /**
     * Membuat container SVG siap pakai dengan viewBox 16:9 responsif
     * @param {number} width Lebar viewBox (default: 1200)
     * @param {number} height Tinggi viewBox (default: 620)
     * @param {Object} attrs Atribut tambahan
     * @returns {SVGSVGElement}
     */
    initContainer(width = 1200, height = 620, attrs = {}) {
      return this.create('svg', {
        viewBox: `0 0 ${width} ${height}`,
        preserveAspectRatio: 'xMidYMid meet',
        width: '100%',
        height: '100%',
        className: 'slide-svg-canvas',
        ...attrs
      });
    }
  };

  /**
   * Helper sleep / delay berbasis Promise
   * @param {number} ms Milidetik
   * @returns {Promise<void>}
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Engine Core State
  const state = {
    slides: [],
    currentSlideIndex: 0,
    currentStepIndex: 0,
    isPlaying: false,
    playInterval: null,
    playDelayMs: 1500,
    dom: {},
    isInitialized: false
  };

  const Slides = {
    /**
     * Mendaftarkan slide ke dalam deck presentasi
     * @param {Object} slideConfig Konfigurasi slide { id, title, steps }
     */
    register(slideConfig) {
      if (!slideConfig || !slideConfig.steps || slideConfig.steps.length === 0) {
        console.warn('[Engine] Slide dilewati: konfigurasi tidak valid atau tanpa step', slideConfig);
        return;
      }
      state.slides.push({
        id: slideConfig.id || `slide-${state.slides.length + 1}`,
        title: slideConfig.title || `Slide ${state.slides.length + 1}`,
        steps: slideConfig.steps
      });
    },

    /**
     * Mengambil daftar seluruh slide terdaftar
     */
    getSlides() {
      return state.slides;
    },

    /**
     * Inisialisasi engine slide dan binding navigasi DOM
     */
    init() {
      if (state.isInitialized) return;
      if (state.slides.length === 0) {
        console.warn('[Engine] Belum ada slide yang didaftarkan.');
        return;
      }

      // Cache elemen DOM utama
      state.dom = {
        viewport: document.getElementById('slide-viewport'),
        container: document.getElementById('slide-container'),
        slideTitle: document.getElementById('slide-title'),
        stepBadge: document.getElementById('step-badge'),
        slideCounter: document.getElementById('slide-counter'),
        progressBar: document.getElementById('progress-bar-fill'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        btnPlay: document.getElementById('btn-play'),
        btnReset: document.getElementById('btn-reset'),
        stage: document.getElementById('slide-stage')
      };

      this._bindEvents();
      this._applyAutoScaling();
      window.addEventListener('resize', () => this._applyAutoScaling());

      // Parse awal URL hash (misal #3 atau #slide-fitness)
      const initialIndex = this._parseHash();
      this.goToSlide(initialIndex, 0, false);

      state.isInitialized = true;
      console.log(`[Engine] Berhasil memuat ${state.slides.length} slide presentasi.`);
    },

    /**
     * Skala dinamis 16:9 agar muat di layar tanpa scrollbar
     */
    _applyAutoScaling() {
      const stage = state.dom.stage;
      if (!stage) return;

      const baseWidth = 1280;
      const baseHeight = 720;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Sisakan ruang untuk top bar & bottom navigation (~140px)
      const availableWidth = windowWidth - 32;
      const availableHeight = windowHeight - 120;

      const scaleX = availableWidth / baseWidth;
      const scaleY = availableHeight / baseHeight;
      const scale = Math.min(scaleX, scaleY, 1.4); // batasi maksimal 1.4x

      stage.style.width = `${baseWidth}px`;
      stage.style.height = `${baseHeight}px`;
      stage.style.transform = `scale(${Math.max(scale, 0.4)})`;
    },

    /**
     * Membaca URL hash saat load atau popstate
     */
    _parseHash() {
      const hash = window.location.hash.replace('#', '').trim();
      if (!hash) return 0;

      // Cek jika angka (#1, #2, ...)
      const num = parseInt(hash, 10);
      if (!isNaN(num) && num >= 1 && num <= state.slides.length) {
        return num - 1;
      }

      // Cek berdasarkan ID slide (#slide-fitness, ...)
      const foundIdx = state.slides.findIndex((s) => s.id === hash);
      return foundIdx >= 0 ? foundIdx : 0;
    },

    /**
     * Update URL hash saat berpindah slide
     */
    _syncHash() {
      const current = state.slides[state.currentSlideIndex];
      const targetHash = `#${state.currentSlideIndex + 1}`;
      if (window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    },

    /**
     * Event listeners (keyboard, tombol kontrol, hashchange)
     */
    _bindEvents() {
      // Tombol UI
      if (state.dom.btnPrev) {
        state.dom.btnPrev.addEventListener('click', () => {
          this.pause();
          this.prev();
        });
      }
      if (state.dom.btnNext) {
        state.dom.btnNext.addEventListener('click', () => {
          this.pause();
          this.next();
        });
      }
      if (state.dom.btnReset) {
        state.dom.btnReset.addEventListener('click', () => {
          this.pause();
          this.resetCurrentSlide();
        });
      }
      if (state.dom.btnPlay) {
        state.dom.btnPlay.addEventListener('click', () => {
          this.togglePlay();
        });
      }

      // Navigasi Keyboard
      window.addEventListener('keydown', (e) => {
        // Jangan intercept jika user sedang mengetik di input/textarea
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        if (e.key === 'ArrowRight' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          this.pause();
          this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.pause();
          this.prev();
        } else if (e.key === 'Home') {
          e.preventDefault();
          this.pause();
          this.goToSlide(0, 0);
        } else if (e.key === 'End') {
          e.preventDefault();
          this.pause();
          const lastIdx = state.slides.length - 1;
          this.goToSlide(lastIdx, state.slides[lastIdx].steps.length - 1);
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          this.pause();
          this.resetCurrentSlide();
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          this.togglePlay();
        }
      });

      // Handle navigasi tombol browser Back/Forward
      window.addEventListener('hashchange', () => {
        const idx = this._parseHash();
        if (idx !== state.currentSlideIndex) {
          this.goToSlide(idx, 0, false);
        }
      });
    },

    /**
     * Menjalankan step pada slide saat ini
     */
    async _renderCurrentStep() {
      const slide = state.slides[state.currentSlideIndex];
      if (!slide) return;

      const step = slide.steps[state.currentStepIndex];
      if (!step) return;

      const ctx = {
        root: state.dom.container,
        svg: svgHelper,
        sleep: sleep,
        slideIndex: state.currentSlideIndex,
        stepIndex: state.currentStepIndex,
        totalSteps: slide.steps.length,
        slideConfig: slide
      };

      // Update UI Header & Counter
      if (state.dom.slideTitle) {
        state.dom.slideTitle.textContent = slide.title;
      }
      if (state.dom.stepBadge) {
        state.dom.stepBadge.textContent = `Langkah ${state.currentStepIndex + 1}/${slide.steps.length}: ${step.label || 'Tahap Aktif'}`;
      }
      if (state.dom.slideCounter) {
        state.dom.slideCounter.textContent = `${state.currentSlideIndex + 1} / ${state.slides.length}`;
      }

      // Update Progress Bar
      this._updateProgress();

      // Eksekusi fungsi enter pada step
      try {
        if (typeof step.enter === 'function') {
          await step.enter(ctx);
        }
      } catch (err) {
        console.error(`[Engine] Error mengeksekusi step [${slide.id}:${step.label}]:`, err);
      }
    },

    /**
     * Menghitung dan memperbarui progress bar
     */
    _updateProgress() {
      if (!state.dom.progressBar) return;
      let totalStepsAll = 0;
      let currentGlobalStep = 0;

      for (let i = 0; i < state.slides.length; i++) {
        const stepsCount = state.slides[i].steps.length;
        totalStepsAll += stepsCount;
        if (i < state.currentSlideIndex) {
          currentGlobalStep += stepsCount;
        } else if (i === state.currentSlideIndex) {
          currentGlobalStep += (state.currentStepIndex + 1);
        }
      }

      const percent = totalStepsAll > 0 ? (currentGlobalStep / totalStepsAll) * 100 : 0;
      state.dom.progressBar.style.width = `${percent.toFixed(1)}%`;
    },

    /**
     * Berpindah ke langkah berikutnya (atau slide berikutnya jika step habis)
     */
    next() {
      const slide = state.slides[state.currentSlideIndex];
      if (!slide) return;

      // Panggil exit step saat ini jika ada
      const currentStep = slide.steps[state.currentStepIndex];
      if (currentStep && typeof currentStep.exit === 'function') {
        currentStep.exit({
          root: state.dom.container,
          svg: svgHelper,
          sleep: sleep
        });
      }

      if (state.currentStepIndex < slide.steps.length - 1) {
        // Lanjut ke step berikutnya dalam slide yang sama
        state.currentStepIndex++;
        this._renderCurrentStep();
      } else if (state.currentSlideIndex < state.slides.length - 1) {
        // Lanjut ke slide berikutnya, mulai dari step 0
        this.goToSlide(state.currentSlideIndex + 1, 0);
      } else {
        // Sudah mencapai akhir presentasi
        if (state.isPlaying) {
          this.pause();
        }
      }
    },

    /**
     * Mundur ke langkah sebelumnya (atau slide sebelumnya)
     */
    prev() {
      const slide = state.slides[state.currentSlideIndex];
      if (!slide) return;

      const currentStep = slide.steps[state.currentStepIndex];
      if (currentStep && typeof currentStep.exit === 'function') {
        currentStep.exit({
          root: state.dom.container,
          svg: svgHelper,
          sleep: sleep
        });
      }

      if (state.currentStepIndex > 0) {
        // Mundur step dalam slide yang sama
        state.currentStepIndex--;
        this._renderCurrentStep();
      } else if (state.currentSlideIndex > 0) {
        // Mundur ke slide sebelumnya di step terakhirnya
        const prevSlideIdx = state.currentSlideIndex - 1;
        const prevSlideLastStep = state.slides[prevSlideIdx].steps.length - 1;
        this.goToSlide(prevSlideIdx, prevSlideLastStep);
      }
    },

    /**
     * Berpindah langsung ke slide & step tertentu
     * @param {number} slideIdx Indeks slide
     * @param {number} stepIdx Indeks step (default: 0)
     * @param {boolean} updateHash Apakah perlu sinkronkan hash URL
     */
    goToSlide(slideIdx, stepIdx = 0, updateHash = true) {
      if (slideIdx < 0 || slideIdx >= state.slides.length) return;

      state.currentSlideIndex = slideIdx;
      const targetSlide = state.slides[slideIdx];
      const validStep = Math.max(0, Math.min(stepIdx, targetSlide.steps.length - 1));
      state.currentStepIndex = validStep;

      // Bersihkan container sebelum render slide baru
      if (state.dom.container) {
        state.dom.container.innerHTML = '';
      }

      if (updateHash) {
        this._syncHash();
      }

      this._renderCurrentStep();
    },

    /**
     * Reset slide saat ini ke step 0
     */
    resetCurrentSlide() {
      this.goToSlide(state.currentSlideIndex, 0);
    },

    /**
     * Toggle status putar otomatis
     */
    togglePlay() {
      if (state.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    /**
     * Memulai auto-play tiap 1.5 detik
     */
    play() {
      if (state.isPlaying) return;
      state.isPlaying = true;
      if (state.dom.btnPlay) {
        state.dom.btnPlay.innerHTML = '⏸ <span class="nav-label">Pause</span>';
        state.dom.btnPlay.classList.add('playing');
      }

      // Jika sudah di ujung slide terakhir, ulang dari awal
      if (
        state.currentSlideIndex === state.slides.length - 1 &&
        state.currentStepIndex === state.slides[state.currentSlideIndex].steps.length - 1
      ) {
        this.goToSlide(0, 0);
      }

      state.playInterval = setInterval(() => {
        const isLastSlide = state.currentSlideIndex === state.slides.length - 1;
        const isLastStep = state.currentStepIndex === state.slides[state.currentSlideIndex].steps.length - 1;

        if (isLastSlide && isLastStep) {
          this.pause();
        } else {
          this.next();
        }
      }, state.playDelayMs);
    },

    /**
     * Menghentikan auto-play
     */
    pause() {
      if (!state.isPlaying) return;
      state.isPlaying = false;
      if (state.playInterval) {
        clearInterval(state.playInterval);
        state.playInterval = null;
      }
      if (state.dom.btnPlay) {
        state.dom.btnPlay.innerHTML = '▶ <span class="nav-label">Play</span>';
        state.dom.btnPlay.classList.remove('playing');
      }
    }
  };

  // Export ke global window
  window.Slides = Slides;
})();

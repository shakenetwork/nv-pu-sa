/* ============================================================
   女菩萨 · X 博主精选画廊  —  应用逻辑
   ============================================================ */
(function () {
  "use strict";

  const CONFIG = window.__CONFIG || {};
  const RAW = window.__ARCHIVE || [];
  const R2 = CONFIG.r2_public_domain || "";

  const FALLBACK_COVERS = [
    "photo-1550745165-9bc0b252726f",
    "photo-1526374965328-7f61d4dc18c5",
    "photo-1620712943543-bcc4688e7485",
    "photo-1507238691740-187a5b1d37b8",
    "photo-1618005182384-a83a8bd57fbe",
    "photo-1634017839464-5c339ebe3cb4",
  ];
  const PAGE = 24, PAGE_STEP = 18;
  const DAY = 86400000;

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function compact(n) {
    n = Number(n) || 0;
    if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, "") + "亿";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  function daysSince(iso) {
    const d = new Date(iso); if (isNaN(d)) return 0;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / DAY));
  }
  function avatarSrc(r) {
    const u = r.avatar_url || "";
    const m = u.match(/[?&]key=([^&]+)/);
    const key = m ? decodeURIComponent(m[1]) : u.replace(/^\/?api\/media\?key=/, "");
    if (/^https?:\/\//.test(u)) return u;
    return R2 ? R2 + "/" + key : u;
  }
  /* 原站 resolveMediaUrl 的等价实现：R2 公开域按 screen_name 归档命名；未归档则交由预设背景 */
  function coverSrc(r) {
    if (!r.cover_url) return '';
    return R2 ? R2 + "/covers/" + encodeURIComponent(r.screen_name) + "_banner.jpg" : "";
  }
  function fallbackCover(i) {
    return "https://images.unsplash.com/" + FALLBACK_COVERS[i % FALLBACK_COVERS.length] + "?w=800&auto=format&fit=crop&q=80";
  }
  /* CSS 背景无法 onerror 兜底：先用预设图，探测到 R2 归档封面存在后再无缝升级 */
  function probeCssCover(src, el) {
    if (!src) return;
    const img = new Image();
    img.onload = () => { el.style.backgroundImage = `url('${src}')`; };
    img.src = src;
  }
  /* ---------- 原站逐字复制：SVG Icon Templates (Iconify / Lucide & Phosphor Standard) ---------- */
  const ICONS = {
    verifiedNative: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>`,
    users: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    external: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    ghost: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>`,
    history: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,
    stamp: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    candle: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-.5 2.5-2 3.5-2 5a2 2 0 0 0 4 0c0-1.5-1.5-2.5-2-5z"/><path d="M8 11h8v10H8z"/></svg>`,
    markdown: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="7 15 7 9 10 12 13 9 13 15"/><polyline points="18 12 16 14 16 10"/></svg>`,
    copy: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    chevronDown: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`
  };

  /* ---------- 原站逐字复制：Canvas Color Extraction Engine for Dynamic Ambient Glow ---------- */
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 16;
  sampleCanvas.height = 16;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

  // 12 Evenly Distributed Spectral Neon Accents for Creators
  const VIBRANT_ACCENTS = [
    '244, 63, 94',    // Rose Red (350°)
    '236, 72, 153',   // Neon Pink (330°)
    '217, 70, 239',   // Vivid Fuchsia (290°)
    '168, 85, 247',   // Electric Purple (270°)
    '129, 140, 248',  // Periwinkle Indigo (235°)
    '14, 165, 233',   // Sky Cyan (195°)
    '20, 184, 166',   // Mint Teal (175°)
    '16, 185, 129',   // Emerald Green (150°)
    '132, 204, 22',   // Lime Green (85°)
    '245, 158, 11',   // Amber Gold (40°)
    '249, 115, 22',   // Orange Flame (25°)
    '239, 68, 68'     // Ruby Crimson (0°)
  ];

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h / 360 + 1/3);
    const g = hue2rgb(p, q, h / 360);
    const b = hue2rgb(p, q, h / 360 - 1/3);
    return `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
  }

  function getFallbackAccent(key) {
    let hash = 0;
    const str = String(key || 'creator');
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return VIBRANT_ACCENTS[Math.abs(hash) % VIBRANT_ACCENTS.length];
  }

  // Chrominance-Peak HSL Dominant Color Extractor
  function extractDominantColor(img, defaultKey = 'creator') {
    try {
      sampleCtx.clearRect(0, 0, 16, 16);
      sampleCtx.drawImage(img, 0, 0, 16, 16);
      const imgData = sampleCtx.getImageData(0, 0, 16, 16).data;
      const buckets = new Array(12).fill(0);
      const hueSums = new Array(12).fill(0);
      let totalVibrantWeight = 0;

      for (let i = 0; i < imgData.length; i += 4) {
        const pr = imgData[i];
        const pg = imgData[i + 1];
        const pb = imgData[i + 2];
        const pa = imgData[i + 3];
        if (pa < 100) continue;

        const [h, s, l] = rgbToHsl(pr, pg, pb);
        if (s < 0.18 || l < 0.12 || l > 0.90) continue;

        const weight = Math.pow(s, 2.2) * (1 - Math.abs(l - 0.5) * 1.4);
        const bIdx = Math.floor(h / 30) % 12;
        buckets[bIdx] += weight;
        hueSums[bIdx] += h * weight;
        totalVibrantWeight += weight;
      }

      if (totalVibrantWeight < 0.1) {
        return getFallbackAccent(defaultKey);
      }

      let bestBucket = -1, maxWeight = 0;
      for (let i = 0; i < 12; i++) {
        if (buckets[i] > maxWeight) {
          maxWeight = buckets[i];
          bestBucket = i;
        }
      }

      if (bestBucket === -1 || buckets[bestBucket] === 0) {
        return getFallbackAccent(defaultKey);
      }

      const winningHue = Math.round(hueSums[bestBucket] / buckets[bestBucket]);
      return hslToRgb(winningHue, 0.82, 0.58);
    } catch (e) {
      return getFallbackAccent(defaultKey);
    }
  }

  // 专属极速霓虹光谱氛围色：零额外网络请求、零 CORS 隐患、100% 稳定出图
  function extractDominantColorWithProbe(imgSrc, fallbackKey, onColorReady) {
    if (!imgSrc || imgSrc.startsWith('data:')) return;
    try {
      const urlObj = new URL(imgSrc, window.location.href);
      if (urlObj.origin !== window.location.origin) {
        return;
      }
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.decoding = 'async';
      probe.onload = () => {
        try {
          const rgb = extractDominantColor(probe, fallbackKey);
          if (rgb && onColorReady) onColorReady(rgb);
        } catch (e) {}
      };
      probe.onerror = () => {};
      probe.src = imgSrc;
    } catch (e) {}
  }

  function attachSpotlightEffect(cardElement) {
    if (!cardElement) return;
    cardElement.classList.add('spotlight-interactive');

    cardElement.addEventListener('mousemove', (e) => {
      const rect = cardElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cardElement.style.setProperty('--mouse-x', `${x}px`);
      cardElement.style.setProperty('--mouse-y', `${y}px`);
    });
  }

  function attach3DTilt(element, maxTilt = 7) {
    if (!element) return;
    element.classList.add('tilt-card-wrap');

    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      element.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  }

  /* ---------- 原站逐字复制：Utilities ---------- */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }
  function formatBioWithLinks(text) {
    if (!text) return '暂无个人简介';
    let safe = escapeHtml(text);
    const urlRegex = /(https?:\/\/[^\s<"'`]+)/g;
    return safe.replace(urlRegex, (url) => {
      const cleanUrl = sanitizeUrl(url);
      if (!cleanUrl) return url;
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">${escapeHtml(cleanUrl)} ↗</a>`;
    });
  }
  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (/^(https?:\/\/|\/|data:image\/)/i.test(trimmed)) {
      if (/javascript:/i.test(trimmed)) return '';
      return trimmed;
    }
    return '';
  }
  function formatFollowers(num) {
    const n = Number(num) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  /* ---------- derive records ---------- */
  const RECORDS = RAW.map((r, i) => {
    const dead = Number(r.is_blocked) === 1 || Number(r.is_suspended) === 1;
    const f = Number(r.followers_count) || 0;
    return {
      ...r, _i: i, dead, followers: f,
      tier: f >= 500000 ? "top" : (f >= 100000 ? "creator" : "normal"),
      days: daysSince(r.backed_up_at),
      xUrl: "https://x.com/" + encodeURIComponent(r.screen_name),
    };
  });

  /* ---------- state ---------- */
  const PARAMS = new URLSearchParams(location.search);
  const storedView = PARAMS.get("view") || localStorage.getItem("np.view") || "grid";
  const state = {
    view: storedView === "masonry" ? "grid" : storedView,
    filter: PARAMS.get("filter") || "all",
    sort: "followers_desc",
    query: "",
    shown: PAGE,
    list: [],
    columnElements: [],
    isShuffling: false,
  };

  /* ---------- DOM ---------- */
  const $ = (s) => document.querySelector(s);
  const grid = $("#grid"), filtersEl = $("#filters"), resultCount = $("#resultCount");
  const loadMore = $("#loadMore"), emptyState = $("#emptyState"), sentinel = $("#sentinel");
  const toastContainer = $("#toast-container");
  const inspectorBackdrop = $("#inspector-backdrop");
  const drawerBody = $("#drawer-body-content");
  const drawerCloseBtn = $("#drawer-close-btn");
  const themeBtn = $("#theme-btn");
  const themeIconSun = $("#theme-icon-sun");
  const themeIconMoon = $("#theme-icon-moon");
  const globalSearch = $("#global-search");
  const searchClearBtn = $("#search-clear-btn");
  const btnLuckyPick = $("#btn-lucky-pick");

  /* ---------- theme (原站逐字复制：Pure Icon Dual-Theme Toggle Engine) ---------- */
  function applyTheme(t) {
    const theme = t === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("np.theme", theme);
    if (theme === "light") {
      themeIconSun?.classList.remove("hidden");
      themeIconMoon?.classList.add("hidden");
      themeBtn?.setAttribute("title", "当前: 清爽浅色 · 点击切换为纯黑极简 (OLED) [快捷键: T]");
    } else {
      themeIconSun?.classList.add("hidden");
      themeIconMoon?.classList.remove("hidden");
      themeBtn?.setAttribute("title", "当前: 纯黑极简 · 点击切换为清爽浅色 (Light) [快捷键: T]");
    }
  }
  applyTheme(PARAMS.get("theme") || localStorage.getItem("np.theme") || "dark");

  /* ---------- stats ---------- */
  function renderStats() {
    const total = RECORDS.length;
    const ver = RECORDS.filter((r) => Number(r.verified) === 1).length;
    const max = RECORDS.reduce((m, r) => Math.max(m, r.followers), 0);
    $("#statTotal").textContent = total;
    $("#statVerified").textContent = Math.round((ver / total) * 100) + "%";
    $("#statMax").textContent = compact(max);
  }

  /* ---------- filters ---------- */
  const I = (d, sw) => `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 2.2}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const FILTERS = [
    { key: "all", label: "全部", test: () => true },
    { key: "hot", label: "热度排行", title: "按访客点击跳转 X 主页的热度排行", icon: I('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'), test: (r) => (Number(r.total_clicks) || 0) > 0 },
    { key: "verified", label: "蓝标认证", icon: I('<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>'), test: (r) => Number(r.verified) === 1 },
    { key: "top", label: "Top 头部 (50万+)", icon: I('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>', 2), test: (r) => r.followers >= 500000 },
    { key: "creator", label: "知名创作者 (10万+)", icon: I('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', 2), test: (r) => r.followers >= 100000 && r.followers < 500000 },
    { key: "recent", label: "最新归档", icon: I('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', 2), test: (r) => r.days <= 30 },
    { key: "grave", label: "赛博坟场", title: "X 官方已被封号或注销的博主档案（赛博坟场）", icon: I('<path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>', 2), test: (r) => r.dead },
  ];
  function renderFilters() {
    filtersEl.innerHTML = FILTERS.map((f) => {
      const n = RECORDS.filter(f.test).length;
      return `<button class="filter-btn${f.key === state.filter ? " is-active" : ""}" data-filter="${f.key}" role="tab"
        ${f.title ? `title="${esc(f.title)}"` : ""} aria-selected="${f.key === state.filter}">
        ${f.icon || ""}${esc(f.label)} <span class="filter-count">${n}</span></button>`;
    }).join("");
  }

  /* ---------- filter + sort + search ---------- */
  const SORTS = {
    followers_desc: (a, b) => b.followers - a.followers,
    followers_asc: (a, b) => a.followers - b.followers,
    clicks_desc: (a, b) => (Number(b.total_clicks) || 0) - (Number(a.total_clicks) || 0),
    recent_desc: (a, b) => new Date(b.backed_up_at) - new Date(a.backed_up_at),
    name_asc: (a, b) => String(a.name || a.screen_name).localeCompare(String(b.name || b.screen_name), "zh"),
  };
  function computeList() {
    const f = FILTERS.find((x) => x.key === state.filter) || FILTERS[0];
    let arr = RECORDS.filter(f.test);
    const q = state.query.trim().toLowerCase();
    if (q) arr = arr.filter((r) =>
      (r.screen_name || "").toLowerCase().includes(q) ||
      (r.name || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q));
    if (state.filter === "hot") arr.sort(SORTS.clicks_desc);
    else arr.sort(SORTS[state.sort] || SORTS.followers_desc);
    state.list = arr;
  }

  /* ---------- 原站逐字复制：Karpathy Discrete Column Masonry Engine (Zero Layout Shifting) ---------- */
  function getResponsiveColumnCount(view) {
    const w = window.innerWidth;
    if (view === 'list') return 1;
    if (view === 'compact') {
      if (w <= 640) return 2;
      if (w <= 1024) return 3;
      return 4;
    }
    if (w <= 640) return 1;
    if (w <= 1024) return 2;
    return 3;
  }

  function initMasonryStructure() {
    grid.innerHTML = '';
    grid.className = `blogger-wall ${state.view}-view`;
    state.columnElements = [];

    if (state.view === 'list') {
      state.columnElements = [grid];
    } else {
      const numCols = getResponsiveColumnCount(state.view);
      for (let i = 0; i < numCols; i++) {
        const col = document.createElement('div');
        col.className = 'masonry-column';
        grid.appendChild(col);
        state.columnElements.push(col);
      }
    }
  }

  function appendCard(card) {
    if (state.view === 'list') { grid.appendChild(card); return; }
    let shortestCol = state.columnElements[0];
    let minHeight = shortestCol.offsetHeight;
    for (let c = 1; c < state.columnElements.length; c++) {
      const col = state.columnElements[c];
      if (col.offsetHeight < minHeight) {
        minHeight = col.offsetHeight;
        shortestCol = col;
      }
    }
    shortestCol.appendChild(card);
  }

  let resizeDebounceTimer = null;
  let activeColCount = getResponsiveColumnCount(state.view);
  window.addEventListener('resize', () => {
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
      const newCols = getResponsiveColumnCount(state.view);
      if (newCols !== activeColCount) {
        activeColCount = newCols;
        const currentCount = state.shown;
        state.shown = 0;
        initMasonryStructure();
        const total = state.list.length;
        const renderLimit = Math.min(Math.max(PAGE, currentCount), total);
        for (let i = 0; i < renderLimit; i++) appendCard(createBloggerCardElement(state.list[i], i));
        state.shown = renderLimit;
        syncListBar();
      }
    }, 180);
  });

  /* ---------- card (原站逐字复制：createBloggerCardElement) ---------- */
  function tombstoneOf(r) {
    const s = Number(r.is_suspended);
    const isSuspended = s === 1 || Number(r.is_blocked) === 1;
    const isDeleted = s === 2;
    return { isSuspended, isDeleted, isTombstone: isSuspended || isDeleted };
  }

  function createBloggerCardElement(user, idx) {
    const card = document.createElement('div');
    const { isSuspended, isDeleted, isTombstone } = tombstoneOf(user);

    card.className = `blogger-card ${isTombstone ? 'is-tombstone' : ''}`;
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');
    card.style.animationDelay = `${Math.min(idx * 20, 250)}ms`;

    const rawAvatar = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const avatar = avatarSrc(user);

    let cover = coverSrc(user);
    if (!cover) cover = fallbackCover(idx);

    const isTopTier = (user.followers >= 500000);
    const tierTag = isTopTier ? 'Top Creator' : 'Creator';
    const formattedBio = formatBioWithLinks(user.description);

    let statusBadgeHtml = '';
    if (isSuspended) {
      statusBadgeHtml = `<span class="badge-status-pill suspended" title="X 官方账号已被封禁/冻结，历史档案已永久冷备份">${ICONS.ghost} 已封号</span>`;
    } else if (isDeleted) {
      statusBadgeHtml = `<span class="badge-status-pill deleted" title="X 官方账号已注销或不存在，历史档案已永久冷备份">${ICONS.ghost} 已注销</span>`;
    }

    card.innerHTML = `
      <div class="card-ambient-glow"></div>
      <div class="card-header-banner">
        <img class="card-banner-img" src="${cover}" alt="${escapeHtml(user.name)}" loading="lazy" decoding="async">
        ${isTombstone ? '<div class="tombstone-banner-veil"></div>' : ''}
      </div>
      <div class="card-main-content">
        <div class="card-avatar-row">
          <div class="card-avatar-wrap">
            <img class="card-avatar-img" src="${avatar}" alt="${escapeHtml(user.name)}" loading="lazy" decoding="async">
            ${Number(user.verified) === 1 ? `<div class="badge-verified-native" title="Twitter 官方认证">${ICONS.verifiedNative}</div>` : ''}
          </div>
        </div>

        <div class="card-user-info">
          <div class="card-name-row">
            <span class="card-user-name" title="${escapeHtml(user.name)}">${escapeHtml(user.name)}</span>
            <span class="card-influence-pill ${isTopTier ? 'top-tier' : ''}">${escapeHtml(tierTag)}</span>
            ${statusBadgeHtml}
          </div>
          <a class="card-user-handle" href="https://x.com/${user.screen_name}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">@${escapeHtml(user.screen_name)}</a>
          <div class="card-metrics-chip">
            ${ICONS.users}
            <span>${formatFollowers(user.followers)} 关注者</span>
          </div>
        </div>

        <div class="card-bio-content">${formattedBio}</div>
      </div>

      <div class="card-action-footer">
        <button class="btn-inspect-profile" type="button">
          ${ICONS.eye}
          <span>时光档案</span>
        </button>
        <a class="btn-visit-x" href="https://x.com/${user.screen_name}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">
          <span>${isTombstone ? '原主页' : '访问 X'}</span>
          ${ICONS.external}
        </a>
      </div>
    `;

    const bannerImg = card.querySelector('.card-banner-img');
    if (bannerImg) {
      bannerImg.addEventListener('error', () => {
        bannerImg.onerror = null;
        bannerImg.src = fallbackCover(idx);
      }, { once: true });
    }
    const avatarImg = card.querySelector('.card-avatar-img');
    if (avatarImg) {
      avatarImg.addEventListener('error', () => {
        avatarImg.onerror = null;
        avatarImg.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
      }, { once: true });
    }

    // Initialize deterministic vibrant palette immediately
    const initialRgb = isTombstone ? '148, 163, 184' : getFallbackAccent(user.screen_name || user.name);
    card.style.setProperty('--card-accent-rgb', initialRgb);
    card.style.setProperty('--card-accent', `rgb(${initialRgb})`);

    // Dynamic Ambient Color Refinement via Progressive CORS Probe
    if (!isTombstone && avatar) {
      extractDominantColorWithProbe(avatar, user.screen_name || user.name, (refinedRgb) => {
        card.style.setProperty('--card-accent-rgb', refinedRgb);
        card.style.setProperty('--card-accent', `rgb(${refinedRgb})`);
      });
    }

    attachSpotlightEffect(card);

    card.addEventListener('click', () => openInspectorDrawer(user));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openInspectorDrawer(user);
    });

    return card;
  }

  /* ---------- render grid ---------- */
  function syncListBar() {
    resultCount.textContent = "共呈现 " + state.list.length + " 位博主归档";
    loadMore.hidden = !(state.shown < state.list.length);
    emptyState.hidden = state.list.length !== 0;
  }
  function renderGrid(reset) {
    if (reset) { state.shown = PAGE; initMasonryStructure(); }
    const from = reset ? 0 : state.shown - PAGE_STEP;
    const slice = state.list.slice(from, state.shown);
    slice.forEach((r, i) => appendCard(createBloggerCardElement(r, reset ? i : from + i)));
    syncListBar();
  }
  function refresh() { computeList(); renderGrid(true); }

  /* ---------- spotlight (原站逐字复制: Hero Right Spotlight) ---------- */
  const heroSpotlightCard = document.getElementById('hero-spotlight-card');
  const spotlightContent = document.getElementById('spotlight-dynamic-content');
  const btnShuffleSpotlight = document.getElementById('btn-shuffle-spotlight');

  function pickSpotlightCreator() {
    if (RECORDS.length === 0) {
      spotlightContent.innerHTML = `
        <div style="padding: 6px 0; color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
          <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">准备好探索精选博主了吗？</div>
          <div>在控制台配置 Cookie 并点击一键同步后，此处将为您自动推送主页优质创作者。</div>
        </div>
      `;
      return;
    }

    const activeUsers = RECORDS.filter(u => !u.dead);
    const basePool = activeUsers.length > 0 ? activeUsers : RECORDS;
    const candidates = basePool.filter(u => u.followers >= 50000 || Number(u.verified) === 1);
    const pool = candidates.length > 0 ? candidates : basePool;
    const randomUser = pool[Math.floor(Math.random() * pool.length)];

    renderSpotlightCard(randomUser);
  }

  function renderSpotlightCard(user) {
    if (!user) return;
    const rawAvatar = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const avatar = user.avatar_url ? avatarSrc(user) : rawAvatar;
    const isTopTier = (user.followers >= 500000);
    const tag = isTopTier ? 'Top Creator' : 'Creator';

    spotlightContent.innerHTML = `
      <div class="spotlight-avatar-wrap" onclick="window.open('${user.xUrl}', '_blank', 'noopener')">
        <img class="spotlight-avatar" src="${avatar}" alt="${escapeHtml(user.name)}" onerror="this.onerror=null;this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';">
        ${Number(user.verified) === 1 ? `<div class="badge-verified-native" style="bottom: 2px; right: 2px;" title="Twitter 官方认证">${ICONS.verifiedNative}</div>` : ''}
      </div>
      <div class="spotlight-meta">
        <div class="spotlight-name-row">
          <span class="spotlight-name" title="${escapeHtml(user.name)}">${escapeHtml(user.name)}</span>
          <span class="card-influence-pill ${isTopTier ? 'top-tier' : ''}">${escapeHtml(tag)}</span>
        </div>
        <a class="spotlight-handle" href="${user.xUrl}" target="_blank" rel="noopener noreferrer">@${escapeHtml(user.screen_name)} · ${formatFollowers(user.followers)} 关注</a>
        <div class="spotlight-bio-snippet">${formatBioWithLinks(user.description)}</div>
      </div>
    `;
    spotlightContent.dataset.id = user.id;
  }

  attachSpotlightEffect(heroSpotlightCard);
  attach3DTilt(heroSpotlightCard, 6);

  /* ---------- roulette (原站逐字复制: Frameless Slot Machine Decelerating Random Roulette Modal) ---------- */
  const rouletteBackdrop = $("#random-roulette-backdrop");
  const rouletteCardContainer = $("#roulette-card-container");
  const rouletteBanner = $("#roulette-banner");
  const rouletteAvatar = $("#roulette-avatar");
  const rouletteTag = $("#roulette-tag");
  const rouletteName = $("#roulette-name");
  const rouletteVerified = $("#roulette-verified");
  const rouletteHandle = $("#roulette-handle");
  const rouletteBio = $("#roulette-bio");
  const rouletteOutsideActions = $("#roulette-outside-actions");
  const rouletteDismissHint = $("#roulette-dismiss-hint");
  const btnRouletteVisit = $("#btn-roulette-visit");
  const btnReshuffleAgain = $("#btn-reshuffle-again");

  function triggerClickSpark(e, sparkCount = 12, color = 'var(--accent-spark)') {
    const x = e ? (e.clientX || window.innerWidth / 2) : window.innerWidth / 2;
    const y = e ? (e.clientY || window.innerHeight / 2) : window.innerHeight / 2;

    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'click-spark-particle';

      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.5;
      const distance = 35 + Math.random() * 40;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const size = 3 + Math.random() * 4;

      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.backgroundColor = color;
      spark.style.boxShadow = `0 0 12px ${color}`;
      spark.style.setProperty('--dx', `${dx}px`);
      spark.style.setProperty('--dy', `${dy}px`);

      document.body.appendChild(spark);

      setTimeout(() => spark.remove(), 650);
    }
  }

  function triggerLuxuryCelebrationFireworks(originElement) {
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;

    if (originElement) {
      const rect = originElement.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    }

    const colors = [
      '#f59e0b', // Luxury Gold
      '#fbbf24', // Amber
      '#38bdf8', // Electric Cyan
      '#ec4899', // Cyber Pink
      '#a855f7', // Purple Neon
      '#ffffff', // Diamond Sparkle
      '#10b981'  // Emerald
    ];

    const shapes = ['star', 'diamond', 'circle', 'ribbon'];
    const particleCount = 52;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'celebration-burst-particle';

      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.45;
      const distance = 85 + Math.random() * 240;
      const vx = Math.cos(angle) * distance;
      const vy = Math.sin(angle) * distance - (35 + Math.random() * 45); // Natural pop with upward velocity

      const duration = 0.95 + Math.random() * 0.75;
      const rotMid = `${(Math.random() - 0.5) * 360}deg`;
      const rotLate = `${(Math.random() - 0.5) * 720}deg`;
      const rotEnd = `${(Math.random() - 0.5) * 1080}deg`;

      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.setProperty('--vx', `${vx}px`);
      p.style.setProperty('--vy', `${vy}px`);
      p.style.setProperty('--duration', `${duration}s`);
      p.style.setProperty('--rot-mid', rotMid);
      p.style.setProperty('--rot-late', rotLate);
      p.style.setProperty('--rot-end', rotEnd);
      p.style.color = color;

      if (shape === 'star') {
        p.classList.add('celebration-star-particle');
        const size = 12 + Math.random() * 10;
        p.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      } else if (shape === 'diamond') {
        p.classList.add('celebration-star-particle');
        const size = 10 + Math.random() * 8;
        p.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><polygon points="12 2 22 12 12 22 2 12"/></svg>`;
      } else if (shape === 'ribbon') {
        p.classList.add('celebration-confetti-ribbon');
        const w = 5 + Math.random() * 5;
        const h = 10 + Math.random() * 10;
        p.style.width = `${w}px`;
        p.style.height = `${h}px`;
        p.style.backgroundColor = color;
      } else {
        const size = 6 + Math.random() * 6;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.borderRadius = '50%';
        p.style.backgroundColor = color;
        p.style.boxShadow = `0 0 12px ${color}, 0 0 22px ${color}`;
      }

      document.body.appendChild(p);

      setTimeout(() => {
        p.remove();
      }, duration * 1000 + 100);
    }
  }

  function startRandomRouletteShuffle() {
    if (RECORDS.length === 0) {
      showToast('归档库中暂无博主数据，请先同步或载入样例数据');
      return;
    }

    if (state.isShuffling) return;
    state.isShuffling = true;

    // Open center frameless modal
    rouletteBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Hide actions during shuffle
    rouletteOutsideActions?.classList.remove('is-visible');
    rouletteDismissHint?.classList.remove('is-visible');

    rouletteCardContainer.classList.remove('is-settled');
    rouletteCardContainer.classList.add('is-shuffling');

    // 过滤掉已封号/已注销 (is_suspended 1/2) 的博主，只抽取正常活跃博主
    const activeUsers = RECORDS.filter(u => { const s = Number(u.is_suspended); return !s || s === 0; });
    const pool = activeUsers.length > 0 ? activeUsers : RECORDS;

    // 30+ Frames Realistic Slot Machine Deceleration Curve:
    // Phase 1: High-speed dash (20 frames, ~28ms each, dazzling motion blur)
    // Phase 2: Deceleration braking (9 frames, physical brake stagger)
    const dashFrames = Array(20).fill(28);
    const brakingFrames = [45, 70, 110, 165, 240, 340, 470, 620, 800];
    const delays = [...dashFrames, ...brakingFrames];
    let stepIndex = 0;

    // Pick final target winner
    const winnerIndex = Math.floor(Math.random() * pool.length);
    const winnerUser = pool[winnerIndex];

    function nextShuffleStep() {
      const tempUser = pool[Math.floor(Math.random() * pool.length)];
      renderRouletteCardPreview(tempUser, false);

      if (stepIndex < delays.length) {
        const delay = delays[stepIndex];
        stepIndex++;
        setTimeout(nextShuffleStep, delay);
      } else {
        finalizeRouletteWinner(winnerUser);
      }
    }

    nextShuffleStep();
  }

  function renderRouletteCardPreview(user, isFinal) {
    const rawAvatar = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const avatarSrcVal = user.avatar_url ? avatarSrc(user) : rawAvatar;
    const cover = coverSrc(user) || fallbackCover(user._i);

    const isTopTier = (user.followers >= 500000);
    const tierTag = isTopTier ? 'Top Creator' : 'Creator';

    rouletteBanner.style.backgroundImage = `url('${fallbackCover(user._i)}')`;
    if (isFinal) probeCssCover(cover, rouletteBanner);
    rouletteAvatar.src = avatarSrcVal;
    rouletteTag.className = `card-influence-pill ${isTopTier ? 'top-tier' : ''}`;
    rouletteTag.textContent = tierTag;
    rouletteName.textContent = user.name;
    rouletteVerified.style.display = Number(user.verified) === 1 ? 'flex' : 'none';
    rouletteHandle.textContent = `@${user.screen_name} · ${formatFollowers(user.followers)} 关注者`;
    rouletteBio.innerHTML = formatBioWithLinks(user.description);
    btnRouletteVisit.href = user.xUrl;
  }

  function finalizeRouletteWinner(user) {
    // 1. 倒数第二张卡片顺着滚轮惯性向上平滑滚出 (140ms)
    rouletteCardContainer.classList.add('is-rolling-out');

    setTimeout(() => {
      // 2. 注入获胜博主数据
      renderRouletteCardPreview(user, true);

      // 3. 移除滚出状态，触发最终卡片从下方滑入 + 拟真弹性卡扣回弹落定 (Spring Bounce)
      rouletteCardContainer.classList.remove('is-rolling-out', 'is-shuffling');
      void rouletteCardContainer.offsetWidth; // 强制触发 CSS 关键帧重绘
      rouletteCardContainer.classList.add('is-settled');
      state.isShuffling = false;

      // 4. 触发金色粒子爆破与星芒礼花
      triggerLuxuryCelebrationFireworks(rouletteCardContainer);

      // 5. 平滑展现底部操作栏
      setTimeout(() => {
        rouletteOutsideActions?.classList.add('is-visible');
        rouletteDismissHint?.classList.add('is-visible');
      }, 160);

      showToast(`抽取命中：@${user.screen_name}`);
    }, 140);
  }

  function closeRouletteModal() {
    if (state.isShuffling) return;
    rouletteBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ---------- drawer (原站逐字复制：Polaroid Time Capsule & Mutation Timeline) ---------- */
  function openInspectorDrawer(user) {
    const rawAvatar = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const avatar = user.avatar_url ? avatarSrc(user) : rawAvatar;
    const cover = coverSrc(user) || fallbackCover(user._i);
    const { isSuspended, isDeleted, isTombstone } = tombstoneOf(user);
    const isTop = (user.followers >= 500000);
    const verified = Number(user.verified) === 1;

    const archivedTime = user.backed_up_at ? new Date(user.backed_up_at) : new Date();
    const archiveDateStr = !isNaN(archivedTime.getTime()) ? archivedTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '已收录';
    const daysSinceArchive = !isNaN(archivedTime.getTime()) ? Math.max(1, Math.floor((Date.now() - archivedTime.getTime()) / (1000 * 60 * 60 * 24))) : 1;
    const vaultNo = 'VAULT-' + String(user.id || user.screen_name).slice(-5).toUpperCase().padStart(5, '0');

    let memorialNotice = '';
    if (isSuspended) {
      memorialNotice = `
        <div class="memorial-banner">
          <div class="memorial-banner-header">
            ${ICONS.ghost}
            <span><strong>赛博坟场 · 信号沉寂</strong></span>
          </div>
          <p>该博主 X 官方账号已被封禁/冻结。本档案馆已永久冷固化其最后的历史头像、背景及简介资产。</p>
          <div class="memorial-actions">
            <button class="btn-send-candle" id="btn-send-candle" type="button">
              ${ICONS.candle}
              <span>为 TA 点亮一盏微光</span>
            </button>
          </div>
        </div>
      `;
    } else if (isDeleted) {
      memorialNotice = `
        <div class="memorial-banner deleted">
          <div class="memorial-banner-header">
            ${ICONS.ghost}
            <span><strong>赛博坟场 · 账号注销</strong></span>
          </div>
          <p>该博主 X 官方账号已注销或不存在。历史数据已在此永久留档存续。</p>
          <div class="memorial-actions">
            <button class="btn-send-candle" id="btn-send-candle" type="button">
              ${ICONS.candle}
              <span>为 TA 点亮一盏微光</span>
            </button>
          </div>
        </div>
      `;
    }

    drawerBody.innerHTML = `
      <div class="polaroid-capsule-card ${isTombstone ? 'is-tombstone' : ''}">
        <!-- Top Full-Bleed Polaroid Header Banner -->
        <div class="polaroid-header-wrap">
          <div class="polaroid-banner-img" style="background-image: url('${fallbackCover(user._i)}');">
            <div class="polaroid-banner-scrim"></div>
          </div>
          <div class="polaroid-stamp">
            <div class="stamp-border">
              <span class="stamp-title">ARCHIVE CERTIFIED</span>
              <span class="stamp-id">${vaultNo}</span>
              <span class="stamp-date">${archiveDateStr}</span>
            </div>
          </div>
        </div>

        <!-- Floating Avatar & Tags Row -->
        <div class="polaroid-profile-row">
          <div class="polaroid-avatar-wrap">
            <img class="polaroid-avatar-img" src="${avatar}" alt="${escapeHtml(user.name)}" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';">
            ${verified ? `<div class="badge-verified-native" title="Twitter 官方认证">${ICONS.verifiedNative}</div>` : ''}
          </div>
          <div class="polaroid-tags-group">
            ${isSuspended ? `<span class="badge-status-pill suspended">${ICONS.ghost} 已封号</span>` : ''}
            ${isDeleted ? `<span class="badge-status-pill deleted">${ICONS.ghost} 已注销</span>` : ''}
            <span class="card-influence-pill ${isTop ? 'top-tier' : ''}">${isTop ? 'Top 头部创作者' : '精选创作者'}</span>
          </div>
        </div>

        <!-- Identity & Handle -->
        <div class="polaroid-name-block">
          <h2 id="drawer-user-name" class="polaroid-user-name">${escapeHtml(user.name)}</h2>
          <div class="polaroid-handle-row">
            <span class="polaroid-handle-text">@${escapeHtml(user.screen_name)}</span>
            <button id="btn-copy-handle" class="btn-chip-copy" title="复制 @ID">
              ${ICONS.copy}
              <span>复制 ID</span>
            </button>
          </div>
        </div>

        ${memorialNotice}

        <!-- 4-Cell Time Capsule Metric Grid -->
        <div class="polaroid-metric-grid">
          <div class="metric-cell">
            <div class="metric-val">${formatFollowers(user.followers)}</div>
            <div class="metric-lbl">关注者 (粉丝)</div>
          </div>
          <div class="metric-cell">
            <div class="metric-val ${verified ? 'is-verified' : ''}">${verified ? '官方认证' : '普通用户'}</div>
            <div class="metric-lbl">蓝标状态</div>
          </div>
          <div class="metric-cell">
            <div class="metric-val">${archiveDateStr}</div>
            <div class="metric-lbl">首次归档日</div>
          </div>
          <div class="metric-cell">
            <div class="metric-val highlight">${daysSinceArchive} 天</div>
            <div class="metric-lbl">已留存时光</div>
          </div>
        </div>

        <!-- Full Bio Section -->
        <div class="polaroid-bio-section">
          <div class="section-title-tag">博主简介 (Bio)</div>
          <div class="polaroid-bio-card">
            ${formatBioWithLinks(user.description)}
          </div>
        </div>

        <!-- Mutation Timeline Collapsible Section -->
        <details class="polaroid-history-accordion" id="drawer-history-details">
          <summary class="polaroid-history-summary">
            <div class="summary-left">
              ${ICONS.history}
              <span>变迁履历档案 (Profile Timeline)</span>
            </div>
            <div class="summary-arrow">${ICONS.chevronDown}</div>
          </summary>
          <div class="polaroid-history-content" id="drawer-history-list">
            <div class="timeline-loading-spinner">
              <div class="skeleton-spinner"></div>
              <span>正在调取时光变迁档案...</span>
            </div>
          </div>
        </details>

        <!-- Action Footer -->
        <div class="polaroid-actions-row">
          <a class="btn-drawer-primary" href="https://x.com/${user.screen_name}" target="_blank" rel="noopener noreferrer">
            <span>${isTombstone ? '前往 X 查看原账号' : '前往 X 个人主页'}</span>
            ${ICONS.external}
          </a>
          <button class="btn-drawer-secondary" id="btn-copy-markdown" type="button" title="一键复制 Markdown 档案卡">
            ${ICONS.markdown}
            <span>复制 Markdown</span>
          </button>
        </div>
      </div>
    `;

    if (!isTombstone) probeCssCover(cover, drawerBody.querySelector('.polaroid-banner-img'));

    // Initialize drawer ambient tint immediately
    const initialDrawerRgb = isTombstone ? '148, 163, 184' : getFallbackAccent(user.screen_name || user.name);
    drawerBody.style.setProperty('--card-accent-rgb', initialDrawerRgb);
    drawerBody.style.setProperty('--card-accent', `rgb(${initialDrawerRgb})`);

    const drawerAvatarImg = drawerBody.querySelector('.polaroid-avatar-img');
    if (drawerAvatarImg && !isTombstone) {
      const isSameOrigin = drawerAvatarImg.src && drawerAvatarImg.src.startsWith(window.location.origin);
      if (isSameOrigin) {
        const applyDrawerColor = () => {
          const rgb = extractDominantColor(drawerAvatarImg, user.screen_name);
          drawerBody.style.setProperty('--card-accent-rgb', rgb);
          drawerBody.style.setProperty('--card-accent', `rgb(${rgb})`);
        };
        if (drawerAvatarImg.complete && drawerAvatarImg.naturalWidth !== 0) {
          applyDrawerColor();
        } else {
          drawerAvatarImg.addEventListener('load', applyDrawerColor, { once: true });
        }
      }
    }

    // Copy Handle Handler
    document.getElementById('btn-copy-handle')?.addEventListener('click', (e) => {
      triggerClickSpark(e, 8, 'var(--card-accent)');
      navigator.clipboard.writeText(`@${user.screen_name}`);
      showToast(`已复制 @${user.screen_name} 到剪贴板`);
    });

    // Copy Markdown Card Handler
    document.getElementById('btn-copy-markdown')?.addEventListener('click', (e) => {
      triggerClickSpark(e, 10, 'var(--card-accent)');
      const mdContent = `### ${user.name} (@${user.screen_name})\n\n- **粉丝数**：${formatFollowers(user.followers)}\n- **认证状态**：${verified ? '已蓝标认证' : '未认证'}\n- **归档编号**：${vaultNo}\n- **首次收录**：${archiveDateStr}\n- **已留存**：${daysSinceArchive} 天\n- **个人简介**：${user.description || '暂无简介'}\n- **主页链接**：https://x.com/${user.screen_name}`;
      navigator.clipboard.writeText(mdContent);
      showToast('已复制博主 Markdown 档案卡到剪贴板');
    });

    // Send Candle / Memorial Spark Handler
    document.getElementById('btn-send-candle')?.addEventListener('click', (e) => {
      triggerLuxuryCelebrationFireworks(e.currentTarget);
      showToast(`已为 @${user.screen_name} 点亮一盏赛博微光`);
    });

    // Mutation Timeline Lazy Loader
    const historyDetails = document.getElementById('drawer-history-details');
    const historyList = document.getElementById('drawer-history-list');
    let historyLoaded = false;

    historyDetails?.addEventListener('toggle', async () => {
      if (!historyDetails.open || historyLoaded) return;
      historyLoaded = true;

      try {
        const res = await fetch(`/api/history?id=${encodeURIComponent(user.id || '')}&screen_name=${encodeURIComponent(user.screen_name || '')}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const validHistory = [];
          for (const item of json.data) {
            const prev = validHistory[validHistory.length - 1];
            if (prev && prev.field === item.field && prev.new_value === item.new_value && prev.old_value === item.old_value) {
              continue;
            }
            validHistory.push(item);
          }
          historyList.innerHTML = validHistory.map(item => {
            const dateStr = item.changed_at ? new Date(item.changed_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '记录时间';
            let fieldLabel = '字段更新';
            if (item.field === 'name') fieldLabel = '博主昵称变迁';
            else if (item.field === 'avatar_url') fieldLabel = '头像变迁更新';
            else if (item.field === 'cover_url') fieldLabel = 'Banner 背景图更换';
            else if (item.field === 'description') fieldLabel = '个人简介 (Bio) 修改';
            else if (item.field === 'screen_name') fieldLabel = 'Handle @ID 更名';
            else if (item.field === 'is_suspended') fieldLabel = '账号状态异动 (封禁/注销)';

            return `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-type">${escapeHtml(fieldLabel)}</span>
                    <span class="timeline-date">${escapeHtml(dateStr)}</span>
                  </div>
                  <div class="timeline-diff">
                    ${item.old_value ? `<div class="diff-line diff-del"><span class="diff-tag">- 旧</span> ${escapeHtml(item.old_value)}</div>` : ''}
                    ${item.new_value ? `<div class="diff-line diff-add"><span class="diff-tag">+ 新</span> ${escapeHtml(item.new_value)}</div>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('');
        } else {
          // If no history in D1 yet, show initial archive creation event
          const initialDate = user.backed_up_at ? new Date(user.backed_up_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '首次归档';
          historyList.innerHTML = `
            <div class="timeline-item">
              <div class="timeline-dot active"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-type">创世归档入库</span>
                  <span class="timeline-date">${escapeHtml(initialDate)}</span>
                </div>
                <div class="timeline-desc">博主档案首次被收录至女菩萨精选画廊，媒体资产与档案快照已永久冷固化。</div>
              </div>
            </div>
            <div class="timeline-empty-hint">暂无后续改名或头像更迭记录（同步引擎将在博主资料变更时自动捕获快照）</div>
          `;
        }
      } catch (e) {
        const initialDate = user.backed_up_at ? new Date(user.backed_up_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '首次归档';
        const daysAgo = user.backed_up_at ? Math.max(1, Math.floor((Date.now() - new Date(user.backed_up_at).getTime()) / (1000 * 3600 * 24))) : 1;
        historyList.innerHTML = `
          <div class="timeline-item">
            <div class="timeline-dot active"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-type">创世归档入库</span>
                <span class="timeline-date">${escapeHtml(initialDate)}</span>
              </div>
              <div class="timeline-desc">博主档案已收录至精选画廊，已在安全归档库中留存 ${daysAgo} 天。媒体资产与资料快照已永久冷固化。</div>
            </div>
          </div>
          <div class="timeline-empty-hint">当前处于静态容灾模式，详细变迁履历档案将在服务配额重置后自动恢复。</div>
        `;
      }
    });

    inspectorBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeInspectorDrawer() {
    inspectorBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ---------- 原站逐字复制：Toast Notification System ---------- */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
      <span style="color: var(--accent-primary); display: flex; align-items: center;">${ICONS.verifiedNative}</span>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    }, 2400);
  }

  /* ---------- events ---------- */
  function bind() {
    // search (原站逐字复制)
    globalSearch?.addEventListener('input', (e) => {
      state.query = e.target.value;
      searchClearBtn.classList.toggle('hidden', !state.query);
      refresh();
    });
    searchClearBtn?.addEventListener('click', () => {
      globalSearch.value = '';
      state.query = '';
      searchClearBtn.classList.add('hidden');
      globalSearch.focus();
      refresh();
    });

    // filters
    filtersEl.addEventListener("click", (e) => {
      const b = e.target.closest(".filter-btn"); if (!b) return;
      state.filter = b.dataset.filter; renderFilters(); refresh();
    });

    // view toggle
    $("#viewToggle").addEventListener("click", (e) => {
      const b = e.target.closest(".view-btn"); if (!b) return; setView(b.dataset.view);
    });

    // sort
    $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; refresh(); });

    // spotlight shuffle (原站逐字复制绑定)
    btnShuffleSpotlight?.addEventListener('click', (e) => {
      triggerClickSpark(e, 12, 'var(--accent-primary)');
      pickSpotlightCreator();
    });

    // roulette (原站逐字复制绑定)
    btnLuckyPick?.addEventListener('click', (e) => {
      triggerClickSpark(e, 10, 'var(--accent-spark)');
      startRandomRouletteShuffle();
    });
    btnReshuffleAgain?.addEventListener('click', (e) => {
      triggerClickSpark(e, 10, 'var(--accent-spark)');
      startRandomRouletteShuffle();
    });
    rouletteBackdrop?.addEventListener('click', (e) => {
      if (e.target === rouletteBackdrop) closeRouletteModal();
    });

    // drawer (原站逐字复制绑定)
    drawerCloseBtn?.addEventListener('click', closeInspectorDrawer);
    inspectorBackdrop?.addEventListener('click', (e) => {
      if (e.target === inspectorBackdrop) closeInspectorDrawer();
    });

    // theme (原站逐字复制绑定)
    themeBtn?.addEventListener('click', (e) => {
      triggerClickSpark(e, 8, 'var(--accent-primary)');
      const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      showToast(`已切换至 ${nextTheme === 'light' ? '清爽浅色' : '纯黑极简 (OLED)'} 模式`);
    });

    // back to top
    const bt = $("#backTop");
    window.addEventListener("scroll", () => {
      bt.classList.toggle("show", window.scrollY > 500);
    }, { passive: true });
    bt.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // keyboard (原站逐字复制)
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== globalSearch) {
        e.preventDefault();
        globalSearch.focus();
      }
      if (e.key === 'Escape') {
        if (!rouletteBackdrop.classList.contains('hidden')) {
          closeRouletteModal();
        } else if (!inspectorBackdrop.classList.contains('hidden')) {
          closeInspectorDrawer();
        } else if (document.activeElement === globalSearch) {
          globalSearch.blur();
        }
      }
      if ((e.key === 'r' || e.key === 'R') && document.activeElement !== globalSearch) {
        e.preventDefault();
        startRandomRouletteShuffle();
      }
      if (document.activeElement !== globalSearch) {
        if (e.key === '1') document.querySelector('[data-view="grid"]')?.click();
        if (e.key === '2') document.querySelector('[data-view="compact"]')?.click();
        if (e.key === '3') document.querySelector('[data-view="list"]')?.click();
        if (e.key === 't' || e.key === 'T') {
          const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          applyTheme(nextTheme);
          showToast(`已切换至 ${nextTheme === 'light' ? '清爽浅色' : '纯黑极简 (OLED)'} 模式`);
        }
        if (e.key === 'Home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });

    // infinite scroll
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.isIntersecting && state.shown < state.list.length) {
          const from = state.shown;
          state.shown += PAGE_STEP;
          state.list.slice(from, state.shown).forEach((r, i) => appendCard(createBloggerCardElement(r, from + i)));
          syncListBar();
        }
      });
    }, { rootMargin: "400px" });
    io.observe(sentinel);
  }
  function setView(v) {
    state.view = v; localStorage.setItem("np.view", v);
    document.querySelectorAll(".view-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.view === v));
    renderGrid(true);
  }

  /* ---------- init ---------- */
  function init() {
    renderStats(); renderFilters(); refresh(); pickSpotlightCreator(); bind();
    document.querySelectorAll(".view-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.view === state.view));
    const open = PARAMS.get("open");
    if (open === "roulette") startRandomRouletteShuffle();
    else if (open === "drawer") {
      const id = PARAMS.get("id");
      const r = (id ? RECORDS.find((x) => String(x.id) === String(id)) : null) || state.list[0];
      if (r) openInspectorDrawer(r);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

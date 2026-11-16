/**
 * SDGs 3D 永續星雲 - 主互動邏輯
 * 包含：星空粒子背景、3D 球體手勢撥弄引擎、雙模式切換、搜尋篩選、Modal 互動、可拖曳吉祥物
 */

(function () {
  'use strict';

  // 若要串接 Google Apps Script (GAS) 綁定試算表同步，可將部署後的 Web App URL 填入此處
  const GAS_WEB_APP_URL = '';

  let sdgsData = typeof SDGS_DATA !== 'undefined' ? SDGS_DATA : [];

  // DOM 元素
  const topHeaderShell = document.querySelector('.top-header-shell');
  const stage = document.getElementById('stage');
  const sphereContainer = document.getElementById('sphere-container');
  const filterBar = document.getElementById('goal-filter-bar');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const modeGoalsBtn = document.getElementById('mode-goals-btn');
  const modeTargetsBtn = document.getElementById('mode-targets-btn');
  const toggleRotateBtn = document.getElementById('toggle-rotate-btn');
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  const langToggleLabel = document.getElementById('lang-toggle-label');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const themeToggleLabel = document.getElementById('theme-toggle-label');
  const siteTitleEl = document.getElementById('site-title');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const resetViewBtn = document.getElementById('reset-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  const interactionHint = document.getElementById('interaction-hint');

  // 詳細資訊 Modal 元素
  const detailModal = document.getElementById('detail-modal');
  const modalHeaderBg = document.getElementById('modal-header-bg');
  const modalGoalImg = document.getElementById('modal-goal-img');
  const modalGoalZoomBtn = document.getElementById('modal-goal-zoom-btn');
  const modalGoalBadge = document.getElementById('modal-goal-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalDescription = document.getElementById('modal-description');
  const copyGoalBtn = document.getElementById('copy-goal-btn');
  const modalTargetCount = document.getElementById('modal-target-count');
  const modalTargetsGrid = document.getElementById('modal-targets-grid');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');

  // 總覽 Modal 元素
  const overviewModal = document.getElementById('overview-modal');
  const overviewGrid = document.getElementById('overview-grid');
  const overviewCloseBtn = document.getElementById('overview-close-btn');

  // 單張圖片展開燈箱 (Lightbox) 元素
  const imageLightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxBadge = document.getElementById('lightbox-badge');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxCopyBtn = document.getElementById('lightbox-copy-btn');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');

  // Toast 提示與吉祥物元素
  const copyToast = document.getElementById('copy-toast');
  const copyToastText = document.getElementById('copy-toast-text');
  const mascotWidget = document.getElementById('mascot-widget');

  // 狀態變數
  let currentLang = 'zh'; // 'zh' | 'en'
  let isLightTheme = false;
  let viewMode = 'goals'; // 'goals' | 'targets'
  const selectedGoals = new Set(); // 空集合代表「全部」；有值時代表多選目標 ID
  let searchQuery = '';
  let autoRotate = true;
  let zoomScale = 1;
  let currentModalGoalId = 1;
  let lightboxItems = [];
  let lightboxIndex = 0;

  const I18N = {
    zh: {
      docTitle: 'SDGs永續發展目標｜3D互動星雲球體展示系統',
      siteTitle: 'SDGs3D互動星雲球體展示系統',
      subtitle: '2030 聯合國永續發展目標互動展示',
      searchPlaceholder: '搜尋目標或指標 (例: 氣候、13.1)...',
      modeGoals: '17 大目標',
      modeTargets: '169 細項星雲',
      autoRotate: '自轉',
      filterAll: '全部',
      hintText: '拖曳撥弄 3D 球體・滾輪縮放・點擊圖卡查看指標',
      coreVision: '目標核心願景',
      targetsTitle: '細項指標',
      clickToZoom: '點擊任一圖卡可展開大圖',
      prevGoal: '上一個目標',
      nextGoal: '下一個目標',
      overviewTitle: '17 項永續發展目標總覽',
      overviewSubtitle: '點擊任意目標卡片即可檢視完整細項指標',
      targetUnit: '項細項指標',
      targetPrefix: '指標',
      langSwitchBtn: 'EN',
      themeLight: '淺色',
      themeDark: '深色',
      copyAll: '一鍵複製全部指標',
      copySingle: '複製指標內容',
      copiedToast: '已複製指標內容到剪貼簿'
    },
    en: {
      docTitle: 'SDGs 3D Interactive Nebula Sphere System',
      siteTitle: 'SDGs 3D Interactive Nebula Sphere System',
      subtitle: '2030 UN Sustainable Development Goals',
      searchPlaceholder: 'Search goals or targets (e.g. Climate, 13.1)...',
      modeGoals: '17 Goals',
      modeTargets: '169 Targets',
      autoRotate: 'Spin',
      filterAll: 'All',
      hintText: 'Drag to rotate 3D sphere ・ Scroll to zoom ・ Click card for details',
      coreVision: 'Core Vision',
      targetsTitle: 'Targets',
      clickToZoom: 'Click any card to expand image',
      prevGoal: 'Prev Goal',
      nextGoal: 'Next Goal',
      overviewTitle: '17 Sustainable Development Goals Overview',
      overviewSubtitle: 'Click any goal card to inspect all targets',
      targetUnit: 'Targets',
      targetPrefix: 'Target',
      langSwitchBtn: '繁中',
      themeLight: 'Light',
      themeDark: 'Dark',
      copyAll: 'Copy All Targets',
      copySingle: 'Copy Target',
      copiedToast: 'Copied to clipboard!'
    }
  };

  function getGoalTitle(goal) {
    return currentLang === 'en' ? goal.enTitle : goal.title;
  }

  function getGoalSubtitle(goal) {
    return currentLang === 'en' ? goal.title : goal.enTitle;
  }

  function getGoalDesc(goal) {
    if (currentLang === 'en' && typeof SDGS_EN_DATA !== 'undefined' && SDGS_EN_DATA.goalDesc[goal.id]) {
      return SDGS_EN_DATA.goalDesc[goal.id];
    }
    return goal.description;
  }

  function getTargetTitle(t) {
    if (currentLang === 'en' && typeof SDGS_EN_DATA !== 'undefined' && SDGS_EN_DATA.targets[t.code]) {
      return SDGS_EN_DATA.targets[t.code];
    }
    return t.title;
  }

  function getTargetText(t) {
    if (currentLang === 'en') {
      const enTitle = typeof SDGS_EN_DATA !== 'undefined' ? SDGS_EN_DATA.targets[t.code] : '';
      return enTitle ? `UN SDG Target ${t.code}: ${enTitle}.` : t.text;
    }
    return t.text;
  }

  // 3D 球體節點與旋轉矩陣狀態
  let sphereNodes = [];
  let rotX = 0.2;
  let rotY = 0;
  let velX = 0;
  let velY = 0.0035; // 預設輕微自轉速度

  // 指標拖曳狀態
  let isDraggingSphere = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let pointerMovedDist = 0;

  /* ========================================================================
     1. 初始化
     ======================================================================== */
  async function init() {
    initStarfield();
    await trySyncFromGAS();
    buildFilterChips();
    buildOverviewGrid();
    buildSphereNodes();
    bindEvents();
    initMascotDrag();
    syncStagePadding();
    window.addEventListener('resize', syncStagePadding);
    requestAnimationFrame(animateSphere);

    // 8 秒後淡化操作提示
    setTimeout(() => {
      if (interactionHint) {
        interactionHint.style.opacity = '0.45';
      }
    }, 8000);
  }

  function syncStagePadding() {
    if (!topHeaderShell || !stage) return;
    const h = topHeaderShell.getBoundingClientRect().height;
    stage.style.paddingTop = `${Math.round(h)}px`;
  }

  /**
   * 選配：從 Google Apps Script (GAS) 同步 Google 試算表資料
   */
  async function trySyncFromGAS() {
    if (!GAS_WEB_APP_URL) return;
    try {
      const res = await fetch(GAS_WEB_APP_URL);
      if (!res.ok) return;
      const remoteData = await res.json();
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        sdgsData = remoteData;
      }
    } catch (err) {
      console.warn('GAS 試算表同步失敗，改用內建完整資料庫:', err);
    }
  }

  /* ========================================================================
     2. 繽紛星空銀河 Canvas (星雲帶 + 彩色星點 + 十字星芒 + 流星)
     ======================================================================== */
  function initStarfield() {
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const starColors = [
      '255, 255, 255',
      '125, 211, 252', // 星空青藍
      '196, 181, 253', // 星雲紫羅蘭
      '249, 168, 212', // 玫瑰粉
      '253, 224, 71',  // 金星黃
      '110, 231, 183'  // 翡翠綠
    ];

    const starCount = Math.min(340, Math.floor((width * height) / 4200));
    const stars = Array.from({ length: starCount }, (_, idx) => {
      const inMilkyWay = idx % 3 === 0;
      const t = Math.random();
      const x = inMilkyWay ? t * width : Math.random() * width;
      const bandY = height * (0.85 - 0.65 * t) + (Math.random() - 0.5) * height * 0.34;
      return {
        x,
        y: inMilkyWay ? bandY : Math.random() * height,
        r: Math.random() * 1.9 + 0.35,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        alpha: Math.random() * 0.75 + 0.25,
        twinkleSpeed: Math.random() * 0.025 + 0.006,
        phase: Math.random() * Math.PI * 2,
        sparkle: Math.random() < 0.08
      };
    });

    const shootingStars = [];
    function spawnShootingStar() {
      const color = starColors[1 + Math.floor(Math.random() * (starColors.length - 1))];
      shootingStars.push({
        x: Math.random() * width * 0.8 + width * 0.1,
        y: Math.random() * height * 0.45,
        vx: (Math.random() * 6 + 7) * (Math.random() < 0.5 ? 1 : -1),
        vy: Math.random() * 3.5 + 3.5,
        len: Math.random() * 75 + 65,
        alpha: 1,
        color
      });
    }

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    let frame = 0;
    function drawGalaxy() {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 銀河斜向星雲帶
      const nebulaGrad = ctx.createLinearGradient(0, height * 0.9, width, height * 0.1);
      nebulaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
      nebulaGrad.addColorStop(0.28, 'rgba(168, 85, 247, 0.11)');
      nebulaGrad.addColorStop(0.55, 'rgba(236, 72, 153, 0.09)');
      nebulaGrad.addColorStop(0.8, 'rgba(16, 185, 129, 0.07)');
      nebulaGrad.addColorStop(1, 'rgba(56, 189, 248, 0.04)');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // 繪製彩色閃爍星點與十字星芒
      for (const s of stars) {
        s.phase += s.twinkleSpeed;
        const opacity = s.alpha * (0.48 + 0.52 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color}, ${opacity.toFixed(2)})`;
        ctx.fill();

        if (s.sparkle && opacity > 0.72) {
          const arm = s.r * 3.4;
          ctx.strokeStyle = `rgba(${s.color}, ${(opacity * 0.55).toFixed(2)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(s.x - arm, s.y);
          ctx.lineTo(s.x + arm, s.y);
          ctx.moveTo(s.x, s.y - arm);
          ctx.lineTo(s.x, s.y + arm);
          ctx.stroke();
        }
      }

      // 定時產生繽紛流星
      if (frame % 150 === 0 && shootingStars.length < 3) {
        spawnShootingStar();
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const m = shootingStars[i];
        m.x += m.vx;
        m.y += m.vy;
        m.alpha -= 0.016;
        if (m.alpha <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }
        const tailX = m.x - m.vx * (m.len / 10);
        const tailY = m.y - m.vy * (m.len / 10);
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.alpha})`);
        grad.addColorStop(0.35, `rgba(${m.color}, ${(m.alpha * 0.75).toFixed(2)})`);
        grad.addColorStop(1, `rgba(${m.color}, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      requestAnimationFrame(drawGalaxy);
    }
    drawGalaxy();
  }

  /* ========================================================================
     3. 建立 17 目標篩選列與總覽清單
     ======================================================================== */
  function buildFilterChips() {
    // 保留第一個「全部 / All」按鈕
    const allBtn = filterBar.querySelector('[data-goal="all"]');
    filterBar.innerHTML = '';
    if (allBtn) filterBar.appendChild(allBtn);

    sdgsData.forEach((goal) => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.goal = String(goal.id);
      btn.innerHTML = `<span class="filter-dot" style="background:${goal.color}"></span> ${goal.id}. ${getGoalTitle(goal)}`;
      filterBar.appendChild(btn);
    });
    updateFilterActiveUI();
  }

  function buildOverviewGrid() {
    const t = I18N[currentLang];
    overviewGrid.innerHTML = '';
    sdgsData.forEach((goal) => {
      const item = document.createElement('div');
      item.className = 'overview-item';
      item.style.borderTop = `3px solid ${goal.color}`;
      item.innerHTML = `
        <img src="${goal.icon}" alt="${goal.code} ${getGoalTitle(goal)}" loading="lazy" />
        <div class="overview-item-title">${goal.id}. ${getGoalTitle(goal)}</div>
        <div class="overview-item-count"><i class="${goal.faIcon}"></i> ${goal.targets.length} ${t.targetUnit}</div>
      `;
      item.addEventListener('click', () => {
        closeOverviewModal();
        openDetailModal(goal.id);
      });
      overviewGrid.appendChild(item);
    });
  }

  /* ========================================================================
     4. 建立 3D 球體節點 (Fibonacci Sphere 均勻分佈)
     ======================================================================== */
  function getSphereRadius() {
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const base = viewMode === 'goals' ? minDim * 0.33 : minDim * 0.37;
    const clamped = Math.max(135, Math.min(base, 350));
    return clamped * zoomScale;
  }

  function buildSphereNodes() {
    sphereContainer.innerHTML = '';
    sphereNodes = [];

    const items = [];
    if (viewMode === 'goals') {
      sdgsData.forEach((goal) => {
        const displayTitle = getGoalTitle(goal);
        items.push({
          type: 'goal',
          goalId: goal.id,
          code: goal.code,
          title: displayTitle,
          enTitle: goal.enTitle,
          color: goal.color,
          imgSrc: goal.icon,
          label: `${goal.id}. ${displayTitle}`,
          searchBlob: `${goal.id} ${goal.code} ${goal.title} ${goal.enTitle} ${goal.description} ${getGoalDesc(goal)} ${goal.targets.map((t) => t.code + ' ' + t.title + ' ' + getTargetTitle(t) + ' ' + t.text).join(' ')}`.toLowerCase()
        });
      });
    } else {
      sdgsData.forEach((goal) => {
        goal.targets.forEach((target) => {
          const displayTitle = getTargetTitle(target);
          items.push({
            type: 'target',
            goalId: goal.id,
            code: target.code,
            title: displayTitle,
            color: goal.color,
            imgSrc: `sdgs-goal-image/GOAL_${goal.id}_TARGET_${target.code}.svg`,
            label: `${target.code} ${displayTitle}`,
            searchBlob: `${goal.id} ${goal.title} ${goal.enTitle} ${target.code} ${target.title} ${displayTitle} ${target.text}`.toLowerCase()
          });
        });
      });
    }

    const total = items.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    items.forEach((item, index) => {
      const y = total === 1 ? 0 : 1 - (index / (total - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * index;

      const nx = Math.cos(theta) * radiusAtY;
      const ny = y;
      const nz = Math.sin(theta) * radiusAtY;

      const nodeEl = document.createElement('div');
      nodeEl.className = `sdg-node ${item.type === 'target' ? 'target-mode' : ''}`;
      nodeEl.style.setProperty('--sdg-color', item.color);
      nodeEl.style.setProperty('--sdg-glow', `${item.color}66`);

      nodeEl.innerHTML = `
        <div class="sdg-card">
          <img src="${item.imgSrc}" alt="${item.label}" loading="lazy" />
          <div class="sdg-card-label">${item.label}</div>
        </div>
      `;

      nodeEl.addEventListener('click', (e) => {
        if (pointerMovedDist > 6) return; // 拖曳時不觸發點擊
        e.stopPropagation();
        openDetailModal(item.goalId, item.type === 'target' ? item.code : null);
      });

      sphereContainer.appendChild(nodeEl);
      sphereNodes.push({
        el: nodeEl,
        nx,
        ny,
        nz,
        data: item
      });
    });

    applyFilterAndSearch();
  }

  function applyFilterAndSearch() {
    const q = searchQuery.trim().toLowerCase();
    sphereNodes.forEach((node) => {
      const matchGoal = selectedGoals.size === 0 || selectedGoals.has(String(node.data.goalId));
      const matchQuery = !q || node.data.searchBlob.includes(q);
      node.isMatched = matchGoal && matchQuery;
      node.el.classList.toggle('dimmed', !node.isMatched);
    });
  }

  /* ========================================================================
     5. 3D 球體動畫迴圈與透視投影
     ======================================================================== */
  function animateSphere() {
    if (!isDraggingSphere) {
      if (autoRotate && Math.abs(velY) < 0.0022 && Math.abs(velX) < 0.0022) {
        velY += (0.0032 - velY) * 0.03;
      } else {
        velX *= 0.95;
        velY *= 0.95;
      }
      rotY += velY;
      rotX += velX;
      // 限制上下俯仰角度避免翻轉不自然
      rotX = Math.max(-1.35, Math.min(1.35, rotX));
    }

    const radius = getSphereRadius();
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const perspective = 1000;

    for (let i = 0; i < sphereNodes.length; i++) {
      const node = sphereNodes[i];
      // 繞 Y 軸旋轉
      const x1 = node.nx * cosY - node.nz * sinY;
      const z1 = node.nz * cosY + node.nx * sinY;
      // 繞 X 軸旋轉
      const y2 = node.ny * cosX - z1 * sinX;
      const z2 = z1 * cosX + node.ny * sinX;

      const px = x1 * radius;
      const py = y2 * radius;
      const pz = z2 * radius;

      const depthRatio = (pz + radius) / (2 * radius); // 0 (背面) ~ 1 (正面)
      const scale = (perspective / (perspective - pz)) * (0.72 + 0.34 * depthRatio);

      let opacity = 0.2 + 0.8 * Math.pow(depthRatio, 1.15);
      if (!node.isMatched) {
        opacity *= 0.14;
      }

      node.el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      node.el.style.opacity = opacity.toFixed(3);
      node.el.style.zIndex = String(Math.round(depthRatio * 1000));
    }

    requestAnimationFrame(animateSphere);
  }

  /* ========================================================================
     6. 事件綁定 (手勢撥弄球體、滾輪縮放、按鈕控制)
     ======================================================================== */
  function bindEvents() {
    // 舞台手勢撥弄 (滑鼠 + 觸控統一使用 Pointer Events)
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.mascot-widget')) return;
      isDraggingSphere = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      pointerMovedDist = 0;
      velX = 0;
      velY = 0;
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDraggingSphere) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      pointerMovedDist += Math.hypot(dx, dy);

      const sensitivity = 0.0055;
      velY = dx * sensitivity;
      velX = -dy * sensitivity;
      rotY += velY;
      rotX = Math.max(-1.35, Math.min(1.35, rotX + velX));

      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      isDraggingSphere = false;
    });

    window.addEventListener('pointercancel', () => {
      isDraggingSphere = false;
    });

    // 滾輪縮放
    stage.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(zoomScale + delta);
      },
      { passive: false }
    );

    // 模式切換
    modeGoalsBtn.addEventListener('click', () => {
      if (viewMode === 'goals') return;
      viewMode = 'goals';
      modeGoalsBtn.classList.add('active');
      modeTargetsBtn.classList.remove('active');
      buildSphereNodes();
    });

    modeTargetsBtn.addEventListener('click', () => {
      if (viewMode === 'targets') return;
      viewMode = 'targets';
      modeTargetsBtn.classList.add('active');
      modeGoalsBtn.classList.remove('active');
      buildSphereNodes();
    });

    // 自轉開關
    toggleRotateBtn.addEventListener('click', () => {
      autoRotate = !autoRotate;
      toggleRotateBtn.classList.toggle('active', autoRotate);
    });

    // 中英文雙語切換
    if (langToggleBtn) {
      langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'zh' ? 'en' : 'zh';
        applyLanguage();
      });
    }

    // 明暗模式切換
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        isLightTheme = !isLightTheme;
        applyTheme();
      });
    }

    // 縮放與重置按鈕
    zoomInBtn.addEventListener('click', () => setZoom(zoomScale + 0.15));
    zoomOutBtn.addEventListener('click', () => setZoom(zoomScale - 0.15));
    resetViewBtn.addEventListener('click', () => {
      zoomScale = 1;
      rotX = 0.2;
      rotY = 0;
      velX = 0;
      velY = 0.0032;
      selectedGoals.clear();
      searchQuery = '';
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      updateFilterActiveUI();
      applyFilterAndSearch();
    });

    // 總覽清單
    listViewBtn.addEventListener('click', openOverviewModal);
    overviewCloseBtn.addEventListener('click', closeOverviewModal);
    overviewModal.addEventListener('click', (e) => {
      if (e.target === overviewModal) closeOverviewModal();
    });

    // 17 目標多選篩選列
    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      const goalId = chip.dataset.goal;
      if (goalId === 'all') {
        selectedGoals.clear();
      } else {
        if (selectedGoals.has(goalId)) {
          selectedGoals.delete(goalId);
        } else {
          selectedGoals.add(goalId);
        }
      }
      updateFilterActiveUI();
      applyFilterAndSearch();
    });

    // 搜尋輸入
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn.classList.toggle('hidden', !searchQuery);
      applyFilterAndSearch();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      applyFilterAndSearch();
    });

    // 詳細資訊 Modal 控制
    modalCloseBtn.addEventListener('click', closeDetailModal);
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal();
    });

    modalPrevBtn.addEventListener('click', () => {
      const prevId = currentModalGoalId <= 1 ? sdgsData.length : currentModalGoalId - 1;
      openDetailModal(prevId);
    });

    modalNextBtn.addEventListener('click', () => {
      const nextId = currentModalGoalId >= sdgsData.length ? 1 : currentModalGoalId + 1;
      openDetailModal(nextId);
    });

    // 圖片展開燈箱控制
    lightboxCloseBtn.addEventListener('click', closeLightbox);
    imageLightbox.addEventListener('click', (e) => {
      if (e.target === imageLightbox) closeLightbox();
    });
    lightboxPrevBtn.addEventListener('click', () => {
      if (lightboxItems.length === 0) return;
      lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
      renderLightbox();
    });
    lightboxNextBtn.addEventListener('click', () => {
      if (lightboxItems.length === 0) return;
      lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
      renderLightbox();
    });
    if (lightboxCopyBtn) {
      lightboxCopyBtn.addEventListener('click', () => {
        const item = lightboxItems[lightboxIndex];
        if (!item) return;
        copyTextToClipboard(`${item.badge} - ${item.title}\n${item.desc}`, lightboxCopyBtn);
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!imageLightbox.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          closeLightbox();
          return;
        }
        if (e.key === 'ArrowLeft') {
          lightboxPrevBtn.click();
          return;
        }
        if (e.key === 'ArrowRight') {
          lightboxNextBtn.click();
          return;
        }
      }
      if (e.key === 'Escape') {
        closeDetailModal();
        closeOverviewModal();
      }
    });
  }

  function applyTheme() {
    document.body.classList.toggle('light-theme', isLightTheme);
    const t = I18N[currentLang];
    if (themeToggleIcon) {
      themeToggleIcon.className = isLightTheme ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
    if (themeToggleLabel) {
      themeToggleLabel.textContent = isLightTheme ? t.themeDark : t.themeLight;
    }
  }

  let toastTimer = null;
  async function copyTextToClipboard(text, btnEl = null) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      if (btnEl) {
        const icon = btnEl.querySelector('i');
        const prevClass = icon ? icon.className : '';
        btnEl.classList.add('copied');
        if (icon) icon.className = 'fa-solid fa-check';
        setTimeout(() => {
          btnEl.classList.remove('copied');
          if (icon && prevClass) icon.className = prevClass;
        }, 1600);
      }

      if (copyToast && copyToastText) {
        copyToastText.textContent = I18N[currentLang].copiedToast;
        copyToast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          copyToast.classList.add('hidden');
        }, 2000);
      }
    } catch (err) {
      console.warn('複製失敗:', err);
    }
  }

  function applyLanguage() {
    const t = I18N[currentLang];
    document.documentElement.lang = currentLang === 'zh' ? 'zh-Hant' : 'en';
    document.title = t.docTitle;
    if (siteTitleEl) siteTitleEl.textContent = t.siteTitle;
    if (langToggleLabel) langToggleLabel.textContent = t.langSwitchBtn;
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;
    if (themeToggleLabel) {
      themeToggleLabel.textContent = isLightTheme ? t.themeDark : t.themeLight;
    }

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    buildFilterChips();
    buildOverviewGrid();
    buildSphereNodes();
    syncStagePadding();

    if (!detailModal.classList.contains('hidden')) {
      openDetailModal(currentModalGoalId);
    }
  }

  function setZoom(nextZoom) {
    zoomScale = Math.max(0.6, Math.min(1.65, nextZoom));
  }

  function updateFilterActiveUI() {
    const chips = filterBar.querySelectorAll('.filter-chip');
    const isAll = selectedGoals.size === 0;
    chips.forEach((chip) => {
      const gId = chip.dataset.goal;
      if (gId === 'all') {
        chip.classList.toggle('active', isAll);
        chip.style.background = isAll ? 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' : '';
      } else {
        const isSelected = selectedGoals.has(gId);
        chip.classList.toggle('active', isSelected);
        if (isSelected) {
          const goal = sdgsData.find((g) => String(g.id) === gId);
          chip.style.background = goal ? goal.color : '';
        } else {
          chip.style.background = '';
        }
      }
    });
  }

  /* ========================================================================
     7. 詳細資訊、總覽 Modal 與單張圖片展開燈箱
     ======================================================================== */
  function openDetailModal(goalId, highlightTargetCode = null) {
    const goal = sdgsData.find((g) => g.id === Number(goalId));
    if (!goal) return;
    currentModalGoalId = goal.id;
    const dict = I18N[currentLang];
    const mainTitle = getGoalTitle(goal);
    const subTitle = getGoalSubtitle(goal);
    const desc = getGoalDesc(goal);

    modalHeaderBg.style.background = `linear-gradient(135deg, ${goal.color}dd 0%, rgba(13, 19, 43, 0.96) 80%)`;
    modalGoalImg.src = goal.icon;
    modalGoalImg.alt = `${goal.code} ${mainTitle}`;
    modalGoalBadge.innerHTML = `<i class="${goal.faIcon}"></i> ${goal.code}`;
    modalTitle.textContent = mainTitle;
    modalSubtitle.textContent = subTitle;
    modalDescription.textContent = desc;
    modalTargetCount.textContent = String(goal.targets.length);

    if (copyGoalBtn) {
      copyGoalBtn.onclick = () => {
        const lines = [
          `${goal.code} ${mainTitle} (${subTitle})`,
          desc,
          '',
          ...goal.targets.map((t) => `${t.code} ${getTargetTitle(t)}：${getTargetText(t)}`)
        ];
        copyTextToClipboard(lines.join('\n'), copyGoalBtn);
      };
    }

    // 準備此目標的圖片展開清單 (第 0 張為主目標圖，後續為所有細項圖)
    const gallery = [
      {
        src: goal.icon,
        badge: `${goal.code}`,
        color: goal.color,
        title: `${mainTitle} (${subTitle})`,
        desc
      },
      ...goal.targets.map((t) => ({
        src: `sdgs-goal-image/GOAL_${goal.id}_TARGET_${t.code}.svg`,
        badge: `${dict.targetPrefix} ${t.code}`,
        color: goal.color,
        title: getTargetTitle(t),
        desc: getTargetText(t)
      }))
    ];

    if (modalGoalZoomBtn) {
      modalGoalZoomBtn.onclick = () => openLightbox(gallery, 0);
    }

    modalTargetsGrid.innerHTML = '';
    goal.targets.forEach((t, idx) => {
      const card = document.createElement('div');
      card.className = 'target-item';
      card.title = dict.clickToZoom;
      if (highlightTargetCode && highlightTargetCode === t.code) {
        card.style.borderColor = '#fff';
        card.style.boxShadow = `0 0 18px ${goal.color}`;
      }
      const targetTitle = getTargetTitle(t);
      const targetText = getTargetText(t);
      card.innerHTML = `
        <div class="target-thumb-wrap">
          <img src="sdgs-goal-image/GOAL_${goal.id}_TARGET_${t.code}.svg" alt="${dict.targetPrefix} ${t.code}" loading="lazy" />
          <span class="target-zoom-icon"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
        </div>
        <div class="target-info">
          <span class="target-code" style="background:${goal.color}">${t.code}</span>
          <div class="target-text"><strong>${targetTitle}</strong><br />${targetText}</div>
        </div>
        <button type="button" class="target-copy-btn" title="${dict.copySingle}" aria-label="${dict.copySingle}">
          <i class="fa-regular fa-copy"></i>
        </button>
      `;
      const targetCopyBtn = card.querySelector('.target-copy-btn');
      if (targetCopyBtn) {
        targetCopyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          copyTextToClipboard(`${t.code} ${targetTitle}\n${targetText}`, targetCopyBtn);
        });
      }
      card.addEventListener('click', () => openLightbox(gallery, idx + 1));
      modalTargetsGrid.appendChild(card);
    });

    detailModal.classList.remove('hidden');
  }

  function openLightbox(items, startIndex = 0) {
    lightboxItems = items;
    lightboxIndex = startIndex;
    renderLightbox();
    imageLightbox.classList.remove('hidden');
  }

  function renderLightbox() {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    lightboxImg.src = item.src;
    lightboxImg.alt = item.title;
    lightboxBadge.textContent = item.badge;
    lightboxBadge.style.background = item.color;
    lightboxTitle.textContent = item.title;
    lightboxDesc.textContent = item.desc;
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
  }

  function closeLightbox() {
    imageLightbox.classList.add('hidden');
  }

  function closeDetailModal() {
    detailModal.classList.add('hidden');
  }

  function openOverviewModal() {
    overviewModal.classList.remove('hidden');
  }

  function closeOverviewModal() {
    overviewModal.classList.add('hidden');
  }

  /* ========================================================================
     8. 左下角吉祥物可拖曳移動到任何地方
     ======================================================================== */
  function initMascotDrag() {
    if (!mascotWidget) return;

    let isDraggingMascot = false;
    let offsetX = 0;
    let offsetY = 0;

    mascotWidget.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      isDraggingMascot = true;
      const rect = mascotWidget.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      // 切換為 left/top 定位以自由拖曳至任何角落
      mascotWidget.style.left = `${rect.left}px`;
      mascotWidget.style.top = `${rect.top}px`;
      mascotWidget.style.bottom = 'auto';
      mascotWidget.style.right = 'auto';
      mascotWidget.setPointerCapture(e.pointerId);
    });

    mascotWidget.addEventListener('pointermove', (e) => {
      if (!isDraggingMascot) return;
      e.stopPropagation();
      const maxLeft = window.innerWidth - mascotWidget.offsetWidth;
      const maxTop = window.innerHeight - mascotWidget.offsetHeight;
      const nextLeft = Math.max(0, Math.min(maxLeft, e.clientX - offsetX));
      const nextTop = Math.max(0, Math.min(maxTop, e.clientY - offsetY));

      mascotWidget.style.left = `${nextLeft}px`;
      mascotWidget.style.top = `${nextTop}px`;
    });

    const endMascotDrag = (e) => {
      if (!isDraggingMascot) return;
      isDraggingMascot = false;
      if (e && e.pointerId !== undefined && mascotWidget.hasPointerCapture(e.pointerId)) {
        mascotWidget.releasePointerCapture(e.pointerId);
      }
    };

    mascotWidget.addEventListener('pointerup', endMascotDrag);
    mascotWidget.addEventListener('pointercancel', endMascotDrag);

    // 視窗大小改變時確保吉祥物留在畫面內
    window.addEventListener('resize', () => {
      if (mascotWidget.style.top && mascotWidget.style.top !== 'auto') {
        const rect = mascotWidget.getBoundingClientRect();
        const maxLeft = window.innerWidth - mascotWidget.offsetWidth;
        const maxTop = window.innerHeight - mascotWidget.offsetHeight;
        mascotWidget.style.left = `${Math.max(0, Math.min(maxLeft, rect.left))}px`;
        mascotWidget.style.top = `${Math.max(0, Math.min(maxTop, rect.top))}px`;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

(function () {
  'use strict';

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ============================================================
  // 1. FAQ Accordion + Click Tracking
  // ============================================================
  var CLICK_KEY = 'shophelp_faq_clicks';
  var clickCounts = {};
  try { clickCounts = JSON.parse(localStorage.getItem(CLICK_KEY)) || {}; } catch (e) { clickCounts = {}; }

  function saveClickCounts() {
    try { localStorage.setItem(CLICK_KEY, JSON.stringify(clickCounts)); } catch (e) {}
  }

  function getFaqItemId(item) {
    var textEl = item.querySelector('.q-text');
    if (textEl) return textEl.textContent.trim().substring(0, 60);
    return 'unknown';
  }

  function incrementFaqClick(item) {
    var id = item.getAttribute('data-entry-id') || getFaqItemId(item);
    clickCounts[id] = (clickCounts[id] || 0) + 1;
    saveClickCounts();
  }

  var faqList = document.getElementById('faqList');
  var faqItems = document.querySelectorAll('.faq-item');

  function bindFaqAccordion() {
    faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
      var q = item.querySelector('.faq-q');
      if (q._bound) return;
      q._bound = true;
      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        faqItems.forEach(function (other) { other.classList.remove('open'); });
        if (!isOpen) {
          item.classList.add('open');
          incrementFaqClick(item);
        }
      });
    });
  }
  bindFaqAccordion();

  // ============================================================
  // 2. FAQ Category Filter
  // ============================================================
  var filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');
      faqItems.forEach(function (item) {
        if (filter === 'all' || item.getAttribute('data-cat') === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
          item.classList.remove('open');
        }
      });
      updateNoResult();
      var searchInput = document.getElementById('searchInput');
      if (searchInput.value) { applySearch(searchInput.value); }
    });
  });

  // ============================================================
  // 3. Search Functionality
  // ============================================================
  var searchInput = document.getElementById('searchInput');
  var searchClear = document.getElementById('searchClear');
  var noResult = document.getElementById('faqNoResult');

  function applySearch(query) {
    var q = query.trim().toLowerCase();
    if (!q) {
      faqItems.forEach(function (item) { item.classList.remove('hidden'); });
      var activeFilter = document.querySelector('.filter-btn.active');
      if (activeFilter && activeFilter.getAttribute('data-filter') !== 'all') {
        faqItems.forEach(function (item) {
          if (item.getAttribute('data-cat') !== activeFilter.getAttribute('data-filter')) {
            item.classList.add('hidden');
          }
        });
      }
      noResult.classList.remove('visible');
      return;
    }
    var matched = 0;
    faqItems.forEach(function (item) {
      var text = item.textContent.toLowerCase();
      var keywords = (item.getAttribute('data-keywords') || '').toLowerCase();
      if (text.indexOf(q) !== -1 || keywords.indexOf(q) !== -1) {
        item.classList.remove('hidden');
        item.classList.add('open');
        matched++;
      } else {
        item.classList.add('hidden');
        item.classList.remove('open');
      }
    });
    noResult.classList.toggle('visible', matched === 0);
  }

  function updateNoResult() {
    var visible = Array.prototype.some.call(faqItems, function (item) {
      return !item.classList.contains('hidden');
    });
    noResult.classList.toggle('visible', !visible);
  }

  searchInput.addEventListener('input', function () {
    searchClear.classList.toggle('visible', !!searchInput.value);
    applySearch(searchInput.value);
  });

  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    applySearch('');
    searchInput.focus();
  });

  document.querySelectorAll('.tag[data-search]').forEach(function (tag) {
    tag.addEventListener('click', function (e) {
      e.preventDefault();
      var term = tag.getAttribute('data-search');
      searchInput.value = term;
      searchClear.classList.add('visible');
      applySearch(term);
      var faqSection = document.getElementById('faq');
      if (faqSection) faqSection.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ============================================================
  // 4. Scroll Spy for Sidebar
  // ============================================================
  var sidebarLinks = document.querySelectorAll('.sidebar a[data-section]');
  var sections = [];
  sidebarLinks.forEach(function (link) {
    var secId = link.getAttribute('data-section');
    var sec = document.getElementById(secId);
    if (sec) sections.push({ link: link, el: sec, id: secId });
  });

  function updateActiveSection() {
    var scrollPos = window.scrollY + 120;
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].el.offsetTop <= scrollPos) { current = sections[i]; }
    }
    sidebarLinks.forEach(function (link) { link.classList.remove('active'); });
    if (current) { current.link.classList.add('active'); }
  }

  var scrollTimer = null;
  window.addEventListener('scroll', function () {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () {
      scrollTimer = null;
      updateActiveSection();
      updateBackTop();
    }, 50);
  });
  updateActiveSection();

  // ============================================================
  // 5. Back to Top
  // ============================================================
  var backTop = document.getElementById('backTop');
  function updateBackTop() {
    backTop.classList.toggle('visible', window.scrollY > 400);
  }
  backTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  updateBackTop();

  // ============================================================
  // 6. Category Card Click
  // ============================================================
  document.querySelectorAll('.cat-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      var href = card.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        var target = document.querySelector(href);
        if (target) { target.scrollIntoView({ behavior: 'smooth' }); }
      }
    });
  });

  // ============================================================
  // 7. Mermaid Init
  // ============================================================
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: true, theme: 'neutral', securityLevel: 'loose',
      flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
      themeVariables: {
        primaryColor: accent + '15', primaryTextColor: ink, primaryBorderColor: accent,
        lineColor: accent, secondaryColor: bg2, tertiaryColor: '#ffffff', fontSize: '14px'
      }
    });
  }

  // ============================================================
  // 8. ECharts Radar Chart
  // ============================================================
  if (typeof echarts !== 'undefined') {
    var chartEl = document.getElementById('chart-service');
    if (chartEl) {
      var chart = echarts.init(chartEl, null, { renderer: 'svg' });
      chart.setOption({
        animation: false, tooltip: { trigger: 'item', appendToBody: true },
        radar: {
          indicator: [
            { name: '响应速度', max: 100 }, { name: '问题解决率', max: 100 },
            { name: '服务态度', max: 100 }, { name: '专业知识', max: 100 },
            { name: '用户满意度', max: 100 }
          ],
          radius: '62%', center: ['50%', '52%'], splitNumber: 4,
          axisName: { color: ink, fontSize: 13, fontWeight: 600 },
          splitLine: { lineStyle: { color: rule, width: 1 } },
          splitArea: { areaStyle: { color: ['rgba(99,102,241,0.02)', 'rgba(99,102,241,0.04)', 'rgba(99,102,241,0.06)', 'rgba(99,102,241,0.08)'] } },
          axisLine: { lineStyle: { color: rule } }
        },
        series: [{
          type: 'radar',
          data: [{
            value: [95, 92, 96, 94, 93], name: '服务质量评分',
            symbol: 'circle', symbolSize: 8,
            lineStyle: { color: accent, width: 2.5 },
            itemStyle: { color: accent, borderColor: '#fff', borderWidth: 2 },
            areaStyle: { color: { type: 'radial', x: 0.5, y: 0.5, r: 0.8, colorStops: [
              { offset: 0, color: 'rgba(99,102,241,0.25)' },
              { offset: 1, color: 'rgba(99,102,241,0.05)' }
            ]}},
            label: { show: true, color: ink, fontSize: 13, fontWeight: 700, formatter: function (p) { return p.value + '分'; } }
          }]
        }]
      });
      window.addEventListener('resize', function () { chart.resize(); });
    }
  }

  // ============================================================
  // 9. Knowledge Management (CRUD + Product/Brand + Clicks)
  // ============================================================
  var STORAGE_KEY = 'shophelp_kb_custom_entries';
  var customEntries = [];
  var kbList = document.getElementById('kbList');
  var kbListHint = document.getElementById('kbListHint');
  var kbCountBadge = document.getElementById('kbCountBadge');
  var kbForm = document.getElementById('kbForm');
  var entryIdInput = document.getElementById('entryId');
  var entryQuestionInput = document.getElementById('entryQuestion');
  var entryCategorySelect = document.getElementById('entryCategory');
  var entryProductSelect = document.getElementById('entryProduct');
  var entryBrandInput = document.getElementById('entryBrand');
  var entryKeywordsInput = document.getElementById('entryKeywords');
  var entryAnswerInput = document.getElementById('entryAnswer');
  var formTitle = document.getElementById('formTitle');
  var submitBtn = document.getElementById('submitBtn');
  var resetBtn = document.getElementById('resetBtn');
  var kbFilterProduct = document.getElementById('kbFilterProduct');
  var kbFilterBrand = document.getElementById('kbFilterBrand');
  var kbSortBy = document.getElementById('kbSortBy');
  var kbFilterCategory = document.getElementById('kbFilterCategory');
  var kbFilterProductName = document.getElementById('kbFilterProductName');
  var kbFilterDateStart = document.getElementById('kbFilterDateStart');
  var kbFilterDateEnd = document.getElementById('kbFilterDateEnd');
  var entryProductNameInput = document.getElementById('entryProductName');
  var entryMerchantCodeInput = document.getElementById('entryMerchantCode');
  var catManageToggle = document.getElementById('catManageToggle');
  var catManagePanel = document.getElementById('catManagePanel');
  var catManageList = document.getElementById('catManageList');
  var newCategoryNameInput = document.getElementById('newCategoryName');
  var addCategoryBtn = document.getElementById('addCategoryBtn');
  var kbModalOverlay = document.getElementById('kbModalOverlay');
  var kbModalBody = document.getElementById('kbModalBody');
  var kbModalClose = document.getElementById('kbModalClose');
  var kbModalCloseBtn = document.getElementById('kbModalCloseBtn');
  var kbModalEditBtn = document.getElementById('kbModalEditBtn');
  var kbModalCurrentId = null;

  var CAT_STORAGE_KEY = 'shophelp_kb_categories';
  var DEFAULT_CATEGORIES = [
    { value: 'shopping', label: '购物咨询', isDefault: true },
    { value: 'orders', label: '订单管理', isDefault: true },
    { value: 'general', label: '综合问题', isDefault: true },
    { value: 'custom', label: '自定义分类', isDefault: true }
  ];
  var customCategories = [];

  var PRODUCT_LABELS = {
    electronics: '电子产品', clothing: '服装鞋帽', food: '食品饮料',
    home: '家居家电', beauty: '美妆个护', sports: '运动户外',
    books: '图书音像', other: '其他'
  };

  function loadCustomCategories() {
    try {
      var raw = localStorage.getItem(CAT_STORAGE_KEY);
      if (raw) { customCategories = JSON.parse(raw); }
    } catch (e) { customCategories = []; }
  }

  function saveCustomCategories() {
    try { localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(customCategories)); } catch (e) {}
  }

  function populateCategorySelect() {
    if (!entryCategorySelect) return;
    var currentVal = entryCategorySelect.value;
    var html = '';
    DEFAULT_CATEGORIES.forEach(function (c) {
      html += '<option value="' + c.value + '">' + c.label + '</option>';
    });
    customCategories.forEach(function (c) {
      html += '<option value="' + c.value + '">' + escapeHtml(c.label) + '</option>';
    });
    entryCategorySelect.innerHTML = html;
    entryCategorySelect.value = currentVal || 'custom';
    populateFilterCategory();
  }

  function populateFilterCategory() {
    if (!kbFilterCategory) return;
    var currentVal = kbFilterCategory.value;
    var html = '<option value="">全部问题分类</option>';
    DEFAULT_CATEGORIES.forEach(function (c) {
      html += '<option value="' + c.value + '">' + c.label + '</option>';
    });
    if (customCategories.length > 0) {
      html += '<optgroup label="自定义分类">';
      customCategories.forEach(function (c) {
        html += '<option value="' + c.value + '">' + escapeHtml(c.label) + '</option>';
      });
      html += '</optgroup>';
    }
    kbFilterCategory.innerHTML = html;
    if (currentVal) kbFilterCategory.value = currentVal;
  }

  function renderCatManagePanel() {
    if (!catManageList) return;
    var html = '';
    DEFAULT_CATEGORIES.forEach(function (c) {
      html += '<div class="cat-manage-item"><div class="cat-name"><span>' + escapeHtml(c.label) + '</span><span class="cat-tag default">默认</span></div></div>';
    });
    customCategories.forEach(function (c) {
      html += '<div class="cat-manage-item"><div class="cat-name"><span>' + escapeHtml(c.label) + '</span><span class="cat-tag custom">自定义</span></div><button class="cat-del" data-cat-value="' + c.value + '" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>';
    });
    catManageList.innerHTML = html;
    catManageList.querySelectorAll('.cat-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-cat-value');
        customCategories = customCategories.filter(function (c) { return c.value !== val; });
        saveCustomCategories();
        populateCategorySelect();
        renderCatManagePanel();
      });
    });
  }

  function addCustomCategory() {
    var name = newCategoryNameInput.value.trim();
    if (!name) return;
    var value = 'cat_' + Date.now();
    customCategories.push({ value: value, label: name });
    saveCustomCategories();
    populateCategorySelect();
    entryCategorySelect.value = value;
    renderCatManagePanel();
    newCategoryNameInput.value = '';
  }

  function showEntryDetail(id) {
    var entry = customEntries.find(function (en) { return String(en.id) === String(id); });
    if (!entry || !kbModalOverlay) return;
    kbModalCurrentId = id;
    incrementEntryClick(entry);
    var badge = getCategoryBadge(entry.category);
    var clicks = getEntryClickCount(entry);
    var dateStr = new Date(entry.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    var updateStr = entry.updatedAt ? new Date(entry.updatedAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;

    var tagsHtml = '<span class="detail-tag category">' + escapeHtml(badge.label) + '</span>';
    if (entry.product) tagsHtml += '<span class="detail-tag product">' + escapeHtml(PRODUCT_LABELS[entry.product] || entry.product) + '</span>';
    if (entry.brand) tagsHtml += '<span class="detail-tag brand">' + escapeHtml(entry.brand) + '</span>';
    if (entry.productName) tagsHtml += '<span class="detail-tag product-name">' + escapeHtml(entry.productName) + '</span>';
    if (entry.merchantCode) tagsHtml += '<span class="detail-tag merchant-code">' + escapeHtml(entry.merchantCode) + '</span>';
    tagsHtml += '<span class="detail-tag clicks"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' + clicks + ' 次点击</span>';

    var keywordsHtml = '';
    if (entry.keywords) {
      var kws = entry.keywords.split(/\s+/).filter(function (k) { return k; });
      kws.forEach(function (kw) {
        keywordsHtml += '<span class="keyword-chip">' + escapeHtml(kw) + '</span>';
      });
    }

    kbModalBody.innerHTML =
      '<div class="detail-section">' +
        '<div class="detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>问题标题</div>' +
        '<div class="detail-value" style="font-size:1rem;font-weight:600">' + escapeHtml(entry.question) + '</div>' +
      '</div>' +
      '<div class="detail-section">' +
        '<div class="detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>分类标签</div>' +
        '<div class="detail-tags">' + tagsHtml + '</div>' +
      '</div>' +
      '<div class="detail-section">' +
        '<div class="detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>回答内容</div>' +
        '<div class="detail-answer">' + escapeHtml(entry.answer) + '</div>' +
      '</div>' +
      (keywordsHtml ? '<div class="detail-section"><div class="detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>搜索关键词</div><div class="detail-keywords">' + keywordsHtml + '</div></div>' : '') +
      '<div class="detail-meta">' +
        '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>创建于 ' + dateStr + '</span>' +
        (updateStr ? '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>更新于 ' + updateStr + '</span>' : '') +
      '</div>';

    kbModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeEntryDetail() {
    if (!kbModalOverlay) return;
    kbModalOverlay.style.display = 'none';
    document.body.style.overflow = '';
    kbModalCurrentId = null;
    renderKbList();
  }

  function loadCustomEntries() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { customEntries = JSON.parse(raw); }
    } catch (e) { customEntries = []; }
  }

  function saveCustomEntries() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(customEntries)); }
    catch (e) {}
  }

  function getCategoryBadge(cat) {
    var map = {
      shopping: { cls: 'shopping', label: '购物' },
      orders: { cls: 'orders', label: '订单' },
      general: { cls: 'general', label: '综合' },
      custom: { cls: 'general', label: '自定义' }
    };
    if (map[cat]) return map[cat];
    var customCat = customCategories.find(function (c) { return c.value === cat; });
    if (customCat) return { cls: 'general', label: customCat.label };
    return map.custom;
  }

  function getEntryClickCount(entry) {
    var id = String(entry.id);
    return clickCounts['custom_' + id] || 0;
  }

  function incrementEntryClick(entry) {
    var id = String(entry.id);
    var key = 'custom_' + id;
    clickCounts[key] = (clickCounts[key] || 0) + 1;
    saveClickCounts();
  }

  function updateBrandFilter() {
    if (!kbFilterBrand) return;
    var brands = {};
    customEntries.forEach(function (e) {
      if (e.brand && e.brand.trim()) { brands[e.brand.trim()] = true; }
    });
    var currentVal = kbFilterBrand.value;
    var html = '<option value="">全部品牌</option>';
    Object.keys(brands).sort().forEach(function (b) {
      html += '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + '</option>';
    });
    kbFilterBrand.innerHTML = html;
    kbFilterBrand.value = currentVal;
  }

  function getFilteredSortedEntries() {
    var filtered = customEntries.slice();
    var prodFilter = kbFilterProduct ? kbFilterProduct.value : '';
    var brandFilter = kbFilterBrand ? kbFilterBrand.value : '';
    var catFilter = kbFilterCategory ? kbFilterCategory.value : '';
    var productNameQuery = kbFilterProductName ? kbFilterProductName.value.trim().toLowerCase() : '';
    var sortBy = kbSortBy ? kbSortBy.value : 'newest';

    if (catFilter) {
      filtered = filtered.filter(function (e) { return e.category === catFilter; });
    }
    if (prodFilter) {
      filtered = filtered.filter(function (e) { return e.product === prodFilter; });
    }
    if (brandFilter) {
      filtered = filtered.filter(function (e) { return e.brand === brandFilter; });
    }
    if (productNameQuery) {
      filtered = filtered.filter(function (e) {
        return e.productName && e.productName.toLowerCase().indexOf(productNameQuery) !== -1;
      });
    }
    var dateStart = kbFilterDateStart ? kbFilterDateStart.value : '';
    var dateEnd = kbFilterDateEnd ? kbFilterDateEnd.value : '';
    if (dateStart) {
      var startTime = new Date(dateStart + 'T00:00:00').getTime();
      filtered = filtered.filter(function (e) { return (e.createdAt || 0) >= startTime; });
    }
    if (dateEnd) {
      var endTime = new Date(dateEnd + 'T23:59:59').getTime();
      filtered = filtered.filter(function (e) { return (e.createdAt || 0) <= endTime; });
    }

    if (sortBy === 'clicks') {
      filtered.sort(function (a, b) { return getEntryClickCount(b) - getEntryClickCount(a); });
    } else if (sortBy === 'alpha') {
      filtered.sort(function (a, b) { return a.question.localeCompare(b.question); });
    } else {
      filtered.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    }
    return filtered;
  }

  function renderKbList() {
    if (!kbList) return;
    var entries = getFilteredSortedEntries();

    if (entries.length === 0) {
      kbList.innerHTML = '<div class="kb-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 0.5rem"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>暂无匹配的知识条目，在上方表单中添加或调整筛选条件</p></div>';
    } else {
      var html = '';
      entries.forEach(function (entry) {
        var badge = getCategoryBadge(entry.category);
        var dateStr = new Date(entry.createdAt).toLocaleDateString('zh-CN');
        var clicks = getEntryClickCount(entry);
        var clickClass = clicks >= 5 ? 'hot' : '';
        var productTag = entry.product ? '<span class="meta-tag product">' + (PRODUCT_LABELS[entry.product] || entry.product) + '</span>' : '';
        var brandTag = entry.brand ? '<span class="meta-tag brand">' + escapeHtml(entry.brand) + '</span>' : '';
        var productNameTag = entry.productName ? '<span class="meta-tag product-name">' + escapeHtml(entry.productName) + '</span>' : '';
        var merchantCodeTag = entry.merchantCode ? '<span class="meta-tag merchant-code">' + escapeHtml(entry.merchantCode) + '</span>' : '';
        html += '<div class="kb-entry" data-entry-id="' + entry.id + '">' +
          '<div class="kb-entry-body">' +
            '<div class="kb-entry-q">' + escapeHtml(entry.question) +
              '<span class="custom-badge">' + badge.label + '</span>' +
              '<span class="kb-entry-clicks ' + clickClass + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
                clicks +
              '</span>' +
            '</div>' +
            '<div class="kb-entry-a">' + escapeHtml(entry.answer) + '</div>' +
            '<div class="kb-entry-meta">创建于 ' + dateStr + productTag + brandTag + productNameTag + merchantCodeTag + '</div>' +
          '</div>' +
          '<div class="kb-entry-actions">' +
            '<button class="edit-btn" data-id="' + entry.id + '" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="del-btn" data-id="' + entry.id + '" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
          '</div>' +
        '</div>';
      });
      kbList.innerHTML = html;

      kbList.querySelectorAll('.edit-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); editEntry(btn.getAttribute('data-id')); });
      });
      kbList.querySelectorAll('.del-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); deleteEntry(btn.getAttribute('data-id')); });
      });
      kbList.querySelectorAll('.kb-entry').forEach(function (entryEl) {
        entryEl.addEventListener('click', function () { showEntryDetail(entryEl.getAttribute('data-entry-id')); });
      });
    }
    if (kbListHint) kbListHint.textContent = '共 ' + entries.length + ' 条' + (entries.length !== customEntries.length ? '（已筛选）' : '') + ' · 点击条目可查看详情';
    if (kbCountBadge) kbCountBadge.textContent = customEntries.length + ' 条';
    updateBrandFilter();
  }

  function injectCustomFaqs() {
    if (!faqList) return;
    faqList.querySelectorAll('.custom-faq-item').forEach(function (el) { el.remove(); });
    customEntries.forEach(function (entry) {
      var badge = getCategoryBadge(entry.category);
      var div = document.createElement('div');
      div.className = 'faq-item custom-faq-item';
      div.setAttribute('data-cat', entry.category);
      div.setAttribute('data-keywords', entry.keywords || '');
      div.setAttribute('data-entry-id', entry.id);
      if (entry.product) div.setAttribute('data-product', entry.product);
      if (entry.brand) div.setAttribute('data-brand', entry.brand);
      var productBadge = entry.product ? ' · ' + (PRODUCT_LABELS[entry.product] || entry.product) : '';
      var brandBadge = entry.brand ? ' · ' + escapeHtml(entry.brand) : '';
      var productNameBadge = entry.productName ? ' · ' + escapeHtml(entry.productName) : '';
      var merchantCodeBadge = entry.merchantCode ? ' · ' + escapeHtml(entry.merchantCode) : '';
      div.innerHTML =
        '<div class="faq-q">' +
          '<span class="q-text">' + escapeHtml(entry.question) + '</span>' +
          '<span class="q-badge ' + badge.cls + '">' + badge.label + productBadge + brandBadge + productNameBadge + merchantCodeBadge + '</span>' +
          '<svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
        '</div>' +
        '<div class="faq-a">' + escapeHtml(entry.answer).replace(/\n/g, '<br>') + '</div>';
      faqList.appendChild(div);
    });
    bindFaqAccordion();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function addOrUpdateEntry(e) {
    e.preventDefault();
    var question = entryQuestionInput.value.trim();
    var answer = entryAnswerInput.value.trim();
    if (!question || !answer) return;
    var category = entryCategorySelect.value;
    var product = entryProductSelect.value;
    var brand = entryBrandInput.value.trim();
    var keywords = entryKeywordsInput.value.trim();
    var productName = entryProductNameInput ? entryProductNameInput.value.trim() : '';
    var merchantCode = entryMerchantCodeInput ? entryMerchantCodeInput.value.trim() : '';
    var id = entryIdInput.value;
    if (id) {
      var found = customEntries.find(function (en) { return String(en.id) === String(id); });
      if (found) {
        found.question = question;
        found.answer = answer;
        found.category = category;
        found.product = product;
        found.brand = brand;
        found.keywords = keywords;
        found.productName = productName;
        found.merchantCode = merchantCode;
        found.updatedAt = Date.now();
      }
    } else {
      customEntries.unshift({
        id: Date.now(),
        question: question,
        answer: answer,
        category: category,
        product: product,
        brand: brand,
        keywords: keywords,
        productName: productName,
        merchantCode: merchantCode,
        createdAt: Date.now()
      });
    }
    saveCustomEntries();
    renderKbList();
    injectCustomFaqs();
    resetForm();
  }

  function editEntry(id) {
    var entry = customEntries.find(function (en) { return String(en.id) === String(id); });
    if (!entry) return;
    entryIdInput.value = entry.id;
    entryQuestionInput.value = entry.question;
    entryCategorySelect.value = entry.category;
    entryProductSelect.value = entry.product || '';
    entryBrandInput.value = entry.brand || '';
    entryKeywordsInput.value = entry.keywords || '';
    if (entryProductNameInput) entryProductNameInput.value = entry.productName || '';
    if (entryMerchantCodeInput) entryMerchantCodeInput.value = entry.merchantCode || '';
    entryAnswerInput.value = entry.answer;
    formTitle.textContent = '编辑知识条目';
    submitBtn.textContent = '更新条目';
    entryQuestionInput.focus();
    document.getElementById('knowledge').scrollIntoView({ behavior: 'smooth' });
  }

  function deleteEntry(id) {
    if (!confirm('确定删除这条知识条目吗？')) return;
    customEntries = customEntries.filter(function (en) { return String(en.id) !== String(id); });
    saveCustomEntries();
    renderKbList();
    injectCustomFaqs();
  }

  function resetForm() {
    kbForm.reset();
    entryIdInput.value = '';
    entryCategorySelect.value = 'custom';
    entryProductSelect.value = '';
    formTitle.textContent = '添加新知识条目';
    submitBtn.textContent = '保存条目';
  }

  if (kbForm) {
    kbForm.addEventListener('submit', addOrUpdateEntry);
    resetBtn.addEventListener('click', resetForm);
  }
  if (kbFilterProduct) kbFilterProduct.addEventListener('change', renderKbList);
  if (kbFilterBrand) kbFilterBrand.addEventListener('change', renderKbList);
  if (kbFilterCategory) kbFilterCategory.addEventListener('change', renderKbList);
  if (kbFilterProductName) {
    kbFilterProductName.addEventListener('input', renderKbList);
  }
  if (kbFilterDateStart) kbFilterDateStart.addEventListener('change', renderKbList);
  if (kbFilterDateEnd) kbFilterDateEnd.addEventListener('change', renderKbList);
  if (kbSortBy) kbSortBy.addEventListener('change', renderKbList);
  if (catManageToggle) {
    catManageToggle.addEventListener('click', function () {
      if (catManagePanel.style.display === 'none' || !catManagePanel.style.display) {
        catManagePanel.style.display = 'block';
        renderCatManagePanel();
      } else {
        catManagePanel.style.display = 'none';
      }
    });
  }
  if (addCategoryBtn) addCategoryBtn.addEventListener('click', addCustomCategory);
  if (newCategoryNameInput) {
    newCategoryNameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); }
    });
  }
  if (kbModalClose) kbModalClose.addEventListener('click', closeEntryDetail);
  if (kbModalCloseBtn) kbModalCloseBtn.addEventListener('click', closeEntryDetail);
  if (kbModalOverlay) {
    kbModalOverlay.addEventListener('click', function (e) {
      if (e.target === kbModalOverlay) closeEntryDetail();
    });
  }
  if (kbModalEditBtn) {
    kbModalEditBtn.addEventListener('click', function () {
      if (kbModalCurrentId) {
        var id = kbModalCurrentId;
        closeEntryDetail();
        editEntry(id);
      }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && kbModalOverlay && kbModalOverlay.style.display !== 'none') {
      closeEntryDetail();
    }
  });

  loadCustomCategories();
  populateCategorySelect();
  loadCustomEntries();
  renderKbList();
  injectCustomFaqs();

  // ============================================================
  // 10. Section Edit Mode (contenteditable + localStorage)
  // ============================================================
  var EDITABLE_SECTIONS = ['faq', 'returns', 'logistics', 'payment', 'after-sales', 'errors'];
  var EDITABLE_SELECTOR = 'h2, .sec-sub, .info-card h4, .info-card p, .callout .co-body, .pay-card h4, .pay-card p, .policy-card h4, .policy-card p, .pay-card .pay-fee, .faq-q .q-text, .faq-a, .kb-table th, .kb-table td, .faq-badge, .kb-editable, .kb-form-title';

  function getEditableElements(sectionId) {
    var section = document.getElementById(sectionId);
    if (!section) return [];
    return Array.prototype.slice.call(section.querySelectorAll(EDITABLE_SELECTOR));
  }

  function getEditBar(sectionId) {
    return document.getElementById('editBar-' + sectionId);
  }

  function setEditMode(sectionId, editing) {
    var elements = getEditableElements(sectionId);
    elements.forEach(function (el) {
      el.setAttribute('contenteditable', editing ? 'true' : 'false');
    });
    var bar = getEditBar(sectionId);
    if (!bar) return;
    var exportBtnHTML =
      '<button class="section-edit-btn export" data-export="' + sectionId + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>导出' +
      '</button>';
    if (editing) {
      bar.innerHTML =
        '<button class="section-edit-btn save" data-save="' + sectionId + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>保存' +
        '</button>' +
        '<button class="section-edit-btn reset" data-reset="' + sectionId + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>恢复默认' +
        '</button>' +
        exportBtnHTML;
      var saveBtn = bar.querySelector('[data-save]');
      var resetBtn = bar.querySelector('[data-reset]');
      var exportBtn = bar.querySelector('[data-export]');
      if (saveBtn) saveBtn.addEventListener('click', function () { saveSectionContent(sectionId); });
      if (resetBtn) resetBtn.addEventListener('click', function () { resetSectionContent(sectionId); });
      if (exportBtn) exportBtn.addEventListener('click', function () { exportSectionContent(sectionId); });
    } else {
      bar.innerHTML =
        '<button class="section-edit-btn" data-edit="' + sectionId + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>编辑' +
        '</button>' +
        exportBtnHTML;
      var editBtn = bar.querySelector('[data-edit]');
      var exportBtn2 = bar.querySelector('[data-export]');
      if (editBtn) editBtn.addEventListener('click', function () { setEditMode(sectionId, true); });
      if (exportBtn2) exportBtn2.addEventListener('click', function () { exportSectionContent(sectionId); });
    }
  }

  function saveSectionContent(sectionId) {
    var elements = getEditableElements(sectionId);
    var content = {};
    elements.forEach(function (el, i) {
      content[i] = el.innerHTML;
    });
    try {
      localStorage.setItem('shophelp_edit_' + sectionId, JSON.stringify(content));
    } catch (e) {}
    setEditMode(sectionId, false);
    var hint = document.querySelector('.edit-hint[data-hint="' + sectionId + '"]');
    if (hint) hint.classList.remove('visible');
  }

  function restoreSectionContent(sectionId) {
    var raw;
    try { raw = localStorage.getItem('shophelp_edit_' + sectionId); } catch (e) { return; }
    if (!raw) return;
    try {
      var content = JSON.parse(raw);
      var elements = getEditableElements(sectionId);
      elements.forEach(function (el, i) {
        if (content[i] !== undefined) { el.innerHTML = content[i]; }
      });
      var bar = getEditBar(sectionId);
      if (bar) {
        bar.innerHTML =
          '<button class="section-edit-btn" data-edit="' + sectionId + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>编辑' +
          '</button>' +
          '<button class="section-edit-btn export" data-export="' + sectionId + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>导出' +
          '</button>';
        var editBtn = bar.querySelector('[data-edit]');
        var exportBtn = bar.querySelector('[data-export]');
        if (editBtn) editBtn.addEventListener('click', function () { setEditMode(sectionId, true); });
        if (exportBtn) exportBtn.addEventListener('click', function () { exportSectionContent(sectionId); });
      }
    } catch (e) {}
  }

  function resetSectionContent(sectionId) {
    if (!confirm('确定恢复默认内容？自定义修改将被清除。')) return;
    try { localStorage.removeItem('shophelp_edit_' + sectionId); } catch (e) {}
    location.reload();
  }

  EDITABLE_SECTIONS.forEach(function (sid) {
    var bar = getEditBar(sid);
    if (bar) {
      var editBtn = bar.querySelector('[data-edit]');
      var exportBtn = bar.querySelector('[data-export]');
      if (editBtn) editBtn.addEventListener('click', function () { setEditMode(sid, true); });
      if (exportBtn) exportBtn.addEventListener('click', function () { exportSectionContent(sid); });
    }
    restoreSectionContent(sid);
  });

  // ============================================================
  // 10b. Error Cases Management
  // ============================================================
  // Image Lightbox
  // ============================================================
  var imgLightbox = document.getElementById('imgLightbox');
  var imgLightboxImg = document.getElementById('imgLightboxImg');
  var imgLightboxClose = document.getElementById('imgLightboxClose');

  function openImgLightbox(src) {
    if (!imgLightbox || !imgLightboxImg) return;
    imgLightboxImg.src = src;
    imgLightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeImgLightbox() {
    if (!imgLightbox) return;
    imgLightbox.classList.remove('active');
    imgLightboxImg.src = '';
    document.body.style.overflow = '';
  }

  if (imgLightbox) imgLightbox.addEventListener('click', closeImgLightbox);
  if (imgLightboxClose) imgLightboxClose.addEventListener('click', function (e) { e.stopPropagation(); closeImgLightbox(); });

  // ============================================================
  var ERROR_STORAGE_KEY = 'shophelp_error_cases';
  var ERROR_CAT_STORAGE_KEY = 'shophelp_error_categories';
  var errorCases = [];
  var errorFormImages = [];
  var errorCustomCategories = [];

  var errorForm = document.getElementById('errorForm');
  var errorEntryIdInput = document.getElementById('errorEntryId');
  var errorStaffNameInput = document.getElementById('errorStaffName');
  var errorStoreNameInput = document.getElementById('errorStoreName');
  var errorCategorySelect = document.getElementById('errorCategory');
  var errorCatManageToggle = document.getElementById('errorCatManageToggle');
  var errorCatManagePanel = document.getElementById('errorCatManagePanel');
  var errorCatManageList = document.getElementById('errorCatManageList');
  var newErrorCategoryNameInput = document.getElementById('newErrorCategoryName');
  var addErrorCategoryBtn = document.getElementById('addErrorCategoryBtn');
  var errorRegTimeInput = document.getElementById('errorRegTime');
  var errorImgUpload = document.getElementById('errorImgUpload');
  var errorImgPlaceholder = document.getElementById('errorImgPlaceholder');
  var errorImgPreview = document.getElementById('errorImgPreview');
  var errorImgInput = document.getElementById('errorImgInput');
  var errorAnnotationInput = document.getElementById('errorAnnotation');
  var errorRectificationInput = document.getElementById('errorRectification');
  var errorSubmitBtn = document.getElementById('errorSubmitBtn');
  var errorResetBtn = document.getElementById('errorResetBtn');
  var errorList = document.getElementById('errorList');
  var errorEmpty = document.getElementById('errorEmpty');
  var errorListHint = document.getElementById('errorListHint');
  var errorCountBadge = document.getElementById('errorCountBadge');
  var errorFilterStaff = document.getElementById('errorFilterStaff');
  var errorFilterStore = document.getElementById('errorFilterStore');
  var errorFilterCategory = document.getElementById('errorFilterCategory');
  var errorFilterKeyword = document.getElementById('errorFilterKeyword');
  var errorModalOverlay = document.getElementById('errorModalOverlay');
  var errorModalBody = document.getElementById('errorModalBody');
  var errorModalClose = document.getElementById('errorModalClose');
  var errorModalCloseBtn = document.getElementById('errorModalCloseBtn');
  var errorModalEditBtn = document.getElementById('errorModalEditBtn');
  var errorModalCurrentId = null;

  function getErrorCatLabel(cat) {
    var map = { shopping: '购物咨询', orders: '订单管理', general: '综合问题', custom: '自定义' };
    if (map[cat]) return map[cat];
    var errorCat = errorCustomCategories.find(function (c) { return c.value === cat; });
    if (errorCat) return errorCat.label;
    var customCat = customCategories.find(function (c) { return c.value === cat; });
    if (customCat) return customCat.label;
    return '自定义';
  }

  function loadErrorCustomCategories() {
    try {
      var raw = localStorage.getItem(ERROR_CAT_STORAGE_KEY);
      if (raw) { errorCustomCategories = JSON.parse(raw); }
    } catch (e) { errorCustomCategories = []; }
  }

  function saveErrorCustomCategories() {
    try { localStorage.setItem(ERROR_CAT_STORAGE_KEY, JSON.stringify(errorCustomCategories)); } catch (e) {}
  }

  function renderErrorCatManagePanel() {
    if (!errorCatManageList) return;
    var html = '';
    DEFAULT_CATEGORIES.forEach(function (c) {
      html += '<div class="cat-manage-item"><div class="cat-name"><span>' + escapeHtml(c.label) + '</span><span class="cat-tag default">默认</span></div></div>';
    });
    errorCustomCategories.forEach(function (c) {
      html += '<div class="cat-manage-item"><div class="cat-name"><span>' + escapeHtml(c.label) + '</span><span class="cat-tag custom">自定义</span></div><button class="cat-del" data-cat-value="' + c.value + '" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>';
    });
    errorCatManageList.innerHTML = html;
    errorCatManageList.querySelectorAll('.cat-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-cat-value');
        errorCustomCategories = errorCustomCategories.filter(function (c) { return c.value !== val; });
        saveErrorCustomCategories();
        populateErrorCategorySelect();
        populateErrorFilters();
        renderErrorCatManagePanel();
      });
    });
  }

  function addErrorCustomCategory() {
    var name = newErrorCategoryNameInput.value.trim();
    if (!name) return;
    var value = 'ecat_' + Date.now();
    errorCustomCategories.push({ value: value, label: name });
    saveErrorCustomCategories();
    populateErrorCategorySelect();
    populateErrorFilters();
    renderErrorCatManagePanel();
    if (errorCategorySelect) errorCategorySelect.value = value;
    newErrorCategoryNameInput.value = '';
  }

  function loadErrorCases() {
    try {
      var raw = localStorage.getItem(ERROR_STORAGE_KEY);
      if (raw) { errorCases = JSON.parse(raw); }
    } catch (e) { errorCases = []; }
  }

  function saveErrorCases() {
    try { localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errorCases)); } catch (e) { alert('存储空间不足，请删除部分旧案例后重试。'); }
  }

  function formatMinute(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var Y = d.getFullYear();
    var M = String(d.getMonth() + 1).padStart(2, '0');
    var D = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return Y + '-' + M + '-' + D + ' ' + h + ':' + m;
  }

  function getFilteredErrorCases() {
    var filtered = errorCases.slice();
    var staffFilter = errorFilterStaff ? errorFilterStaff.value : '';
    var storeFilter = errorFilterStore ? errorFilterStore.value : '';
    var catFilter = errorFilterCategory ? errorFilterCategory.value : '';
    var kwQuery = errorFilterKeyword ? errorFilterKeyword.value.trim().toLowerCase() : '';
    if (staffFilter) filtered = filtered.filter(function (e) { return e.staffName === staffFilter; });
    if (storeFilter) filtered = filtered.filter(function (e) { return e.storeName === storeFilter; });
    if (catFilter) filtered = filtered.filter(function (e) { return e.category === catFilter; });
    if (kwQuery) {
      filtered = filtered.filter(function (e) {
        return (e.annotation && e.annotation.toLowerCase().indexOf(kwQuery) !== -1) ||
               (e.rectification && e.rectification.toLowerCase().indexOf(kwQuery) !== -1);
      });
    }
    filtered.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    return filtered;
  }

  function populateErrorFilters() {
    if (errorFilterStaff) {
      var staffs = [];
      errorCases.forEach(function (e) { if (e.staffName && staffs.indexOf(e.staffName) === -1) staffs.push(e.staffName); });
      staffs.sort();
      var curS = errorFilterStaff.value;
      errorFilterStaff.innerHTML = '<option value="">全部客服</option>' + staffs.map(function (s) { return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>'; }).join('');
      if (curS) errorFilterStaff.value = curS;
    }
    if (errorFilterStore) {
      var stores = [];
      errorCases.forEach(function (e) { if (e.storeName && stores.indexOf(e.storeName) === -1) stores.push(e.storeName); });
      stores.sort();
      var curSt = errorFilterStore.value;
      errorFilterStore.innerHTML = '<option value="">全部店铺</option>' + stores.map(function (s) { return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>'; }).join('');
      if (curSt) errorFilterStore.value = curSt;
    }
    if (errorFilterCategory) {
      var curC = errorFilterCategory.value;
      var html = '<option value="">全部问题分类</option>';
      DEFAULT_CATEGORIES.forEach(function (c) { html += '<option value="' + c.value + '">' + c.label + '</option>'; });
      if (errorCustomCategories.length > 0) {
        html += '<optgroup label="错误案例自定义分类">';
        errorCustomCategories.forEach(function (c) { html += '<option value="' + c.value + '">' + escapeHtml(c.label) + '</option>'; });
        html += '</optgroup>';
      }
      errorFilterCategory.innerHTML = html;
      if (curC) errorFilterCategory.value = curC;
    }
  }

  function populateErrorCategorySelect() {
    if (!errorCategorySelect) return;
    var currentVal = errorCategorySelect.value;
    var html = '';
    DEFAULT_CATEGORIES.forEach(function (c) { html += '<option value="' + c.value + '">' + c.label + '</option>'; });
    errorCustomCategories.forEach(function (c) { html += '<option value="' + c.value + '">' + escapeHtml(c.label) + '</option>'; });
    errorCategorySelect.innerHTML = html;
    errorCategorySelect.value = currentVal || 'shopping';
  }

  function renderErrorList() {
    if (!errorList) return;
    var entries = getFilteredErrorCases();
    if (errorListHint) errorListHint.textContent = '共 ' + entries.length + ' 条' + (entries.length !== errorCases.length ? '（已筛选）' : '') + ' · 点击案例查看详情';
    if (errorCountBadge) errorCountBadge.textContent = entries.length + ' 条';
    if (entries.length === 0) {
      errorList.innerHTML = '';
      if (errorEmpty) errorEmpty.style.display = '';
      return;
    }
    if (errorEmpty) errorEmpty.style.display = 'none';
    var html = '';
    entries.forEach(function (entry) {
      var dateStr = formatMinute(entry.createdAt);
      var imgCount = entry.images ? entry.images.length : 0;
      var imgTag = imgCount > 0 ? '<span class="meta-tag img-count"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' + imgCount + ' 张图片</span>' : '';
      var hasThumb = imgCount > 0 ? '<img src="' + entry.images[0] + '" style="width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid var(--rule);flex-shrink:0">' : '';
      html += '<div class="error-entry" data-error-id="' + entry.id + '">' +
        '<div class="error-entry-head">' +
          '<div style="display:flex;gap:0.5rem;flex:1;min-width:0">' +
            (hasThumb || '') +
            '<div style="flex:1;min-width:0">' +
              '<div class="error-entry-title">' + escapeHtml(entry.annotation) + '</div>' +
              '<div class="error-entry-meta">' +
                '<span class="meta-tag staff">' + escapeHtml(entry.staffName) + '</span>' +
                '<span class="meta-tag store">' + escapeHtml(entry.storeName) + '</span>' +
                '<span class="meta-tag category">' + escapeHtml(getErrorCatLabel(entry.category)) + '</span>' +
                imgTag +
                '<span style="color:var(--muted)">' + dateStr + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="error-entry-actions">' +
            '<button class="icon-btn edit-btn" data-id="' + entry.id + '" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="icon-btn del-btn" data-id="' + entry.id + '" title="删除" style="color:#ef4444"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    errorList.innerHTML = html;
    errorList.querySelectorAll('.edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); editErrorCase(btn.getAttribute('data-id')); });
    });
    errorList.querySelectorAll('.del-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); deleteErrorCase(btn.getAttribute('data-id')); });
    });
    errorList.querySelectorAll('.error-entry').forEach(function (entryEl) {
      entryEl.addEventListener('click', function () { showErrorDetail(entryEl.getAttribute('data-error-id')); });
    });
  }

  function renderErrorImagePreviews() {
    if (!errorImgPreview) return;
    if (errorFormImages.length === 0) {
      errorImgPreview.innerHTML = '';
      if (errorImgPlaceholder) errorImgPlaceholder.style.display = '';
      return;
    }
    if (errorImgPlaceholder) errorImgPlaceholder.style.display = 'none';
    var html = '';
    errorFormImages.forEach(function (img, i) {
      html += '<div class="img-preview-item"><img src="' + img + '"><button type="button" class="img-preview-remove" data-idx="' + i + '" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
    });
    errorImgPreview.innerHTML = html;
    errorImgPreview.querySelectorAll('.img-preview-remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        errorFormImages.splice(idx, 1);
        renderErrorImagePreviews();
      });
    });
  }

  function handleImageFiles(files) {
    var arr = Array.prototype.slice.call(files);
    arr.forEach(function (file) {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 2 * 1024 * 1024) { alert('图片 "' + file.name + '" 超过 2MB，请压缩后上传'); return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        errorFormImages.push(e.target.result);
        renderErrorImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function addOrUpdateErrorCase() {
    var staffName = errorStaffNameInput.value.trim();
    var storeName = errorStoreNameInput.value.trim();
    var category = errorCategorySelect.value;
    var annotation = errorAnnotationInput.value.trim();
    var rectification = errorRectificationInput.value.trim();
    var id = errorEntryIdInput.value;
    if (!staffName || !storeName || !annotation || !rectification) {
      alert('请填写所有必填字段');
      return;
    }
    if (id) {
      var found = errorCases.find(function (en) { return String(en.id) === String(id); });
      if (found) {
        found.staffName = staffName;
        found.storeName = storeName;
        found.category = category;
        found.annotation = annotation;
        found.rectification = rectification;
        found.images = errorFormImages.slice();
        found.updatedAt = Date.now();
      }
    } else {
      errorCases.unshift({
        id: Date.now(),
        staffName: staffName,
        storeName: storeName,
        category: category,
        annotation: annotation,
        rectification: rectification,
        images: errorFormImages.slice(),
        createdAt: Date.now()
      });
    }
    saveErrorCases();
    resetErrorForm();
    populateErrorFilters();
    renderErrorList();
  }

  function editErrorCase(id) {
    var entry = errorCases.find(function (en) { return String(en.id) === String(id); });
    if (!entry) return;
    errorEntryIdInput.value = entry.id;
    errorStaffNameInput.value = entry.staffName || '';
    errorStoreNameInput.value = entry.storeName || '';
    errorCategorySelect.value = entry.category || 'custom';
    errorAnnotationInput.value = entry.annotation || '';
    errorRectificationInput.value = entry.rectification || '';
    errorRegTimeInput.value = formatMinute(entry.createdAt);
    errorFormImages = (entry.images || []).slice();
    renderErrorImagePreviews();
    if (errorSubmitBtn) errorSubmitBtn.textContent = '更新案例';
    if (errorFormTitle) errorFormTitle.textContent = '编辑错误案例';
    errorFormArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function deleteErrorCase(id) {
    if (!confirm('确定删除此错误案例？')) return;
    errorCases = errorCases.filter(function (en) { return String(en.id) !== String(id); });
    saveErrorCases();
    populateErrorFilters();
    renderErrorList();
  }

  function resetErrorForm() {
    if (errorForm) errorForm.reset();
    errorEntryIdInput.value = '';
    errorRegTimeInput.value = '';
    errorFormImages = [];
    renderErrorImagePreviews();
    if (errorSubmitBtn) errorSubmitBtn.textContent = '保存案例';
    if (errorFormTitle) errorFormTitle.textContent = '登记错误案例';
  }

  function showErrorDetail(id) {
    var entry = errorCases.find(function (en) { return String(en.id) === String(id); });
    if (!entry || !errorModalOverlay) return;
    errorModalCurrentId = id;
    var dateStr = formatMinute(entry.createdAt);
    var updateStr = entry.updatedAt ? formatMinute(entry.updatedAt) : null;
    var imagesHtml = '';
    if (entry.images && entry.images.length > 0) {
      imagesHtml = '<div class="detail-section"><div class="detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>聊天记录凭证</div><div class="detail-images">' + entry.images.map(function (src) { return '<img src="' + src + '" alt="聊天截图">'; }).join('') + '</div></div>';
    }
    errorModalBody.innerHTML =
      '<div class="detail-section"><div class="detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>值班客服 / 店铺</div><div class="detail-tags"><span class="detail-tag category">' + escapeHtml(entry.staffName) + '</span><span class="detail-tag brand">' + escapeHtml(entry.storeName) + '</span><span class="detail-tag product">' + escapeHtml(getErrorCatLabel(entry.category)) + '</span></div></div>' +
      '<div class="detail-section"><div class="detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>问题批注</div><div class="detail-annotation">' + escapeHtml(entry.annotation) + '</div></div>' +
      '<div class="detail-section"><div class="detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>整改建议</div><div class="detail-rectification">' + escapeHtml(entry.rectification) + '</div></div>' +
      imagesHtml +
      '<div class="detail-meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>登记于 ' + dateStr + '</span>' + (updateStr ? '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>更新于 ' + updateStr + '</span>' : '') + '</div>';
    errorModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    var imgs = errorModalBody.querySelectorAll('.detail-images img');
    imgs.forEach(function (img) {
      img.addEventListener('click', function () { openImgLightbox(img.src); });
    });
  }

  function closeErrorDetail() {
    if (!errorModalOverlay) return;
    errorModalOverlay.style.display = 'none';
    document.body.style.overflow = '';
    errorModalCurrentId = null;
  }

  // Error case event listeners
  if (errorForm) {
    errorForm.addEventListener('submit', function (e) { e.preventDefault(); addOrUpdateErrorCase(); });
  }
  if (errorResetBtn) errorResetBtn.addEventListener('click', resetErrorForm);
  if (errorImgUpload) {
    errorImgUpload.addEventListener('click', function (e) {
      if (e.target === errorImgUpload || e.target === errorImgPlaceholder || e.target.closest('.img-upload-placeholder')) {
        errorImgInput.click();
      }
    });
    errorImgUpload.addEventListener('dragover', function (e) { e.preventDefault(); errorImgUpload.classList.add('dragover'); });
    errorImgUpload.addEventListener('dragleave', function () { errorImgUpload.classList.remove('dragover'); });
    errorImgUpload.addEventListener('drop', function (e) {
      e.preventDefault();
      errorImgUpload.classList.remove('dragover');
      handleImageFiles(e.dataTransfer.files);
    });
  }
  if (errorImgInput) {
    errorImgInput.addEventListener('change', function () {
      handleImageFiles(errorImgInput.files);
      errorImgInput.value = '';
    });
  }
  if (errorFilterStaff) errorFilterStaff.addEventListener('change', renderErrorList);
  if (errorFilterStore) errorFilterStore.addEventListener('change', renderErrorList);
  if (errorFilterCategory) errorFilterCategory.addEventListener('change', renderErrorList);
  if (errorFilterKeyword) errorFilterKeyword.addEventListener('input', renderErrorList);
  if (errorModalClose) errorModalClose.addEventListener('click', closeErrorDetail);
  if (errorModalCloseBtn) errorModalCloseBtn.addEventListener('click', closeErrorDetail);
  if (errorModalOverlay) {
    errorModalOverlay.addEventListener('click', function (e) {
      if (e.target === errorModalOverlay) closeErrorDetail();
    });
  }
  if (errorModalEditBtn) {
    errorModalEditBtn.addEventListener('click', function () {
      if (errorModalCurrentId) {
        var id = errorModalCurrentId;
        closeErrorDetail();
        editErrorCase(id);
      }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && errorModalOverlay && errorModalOverlay.style.display !== 'none') {
      closeErrorDetail();
    }
  });

  if (errorCatManageToggle) {
    errorCatManageToggle.addEventListener('click', function () {
      if (!errorCatManagePanel) return;
      var isOpen = errorCatManagePanel.style.display !== 'none';
      errorCatManagePanel.style.display = isOpen ? 'none' : '';
      errorCatManageToggle.textContent = isOpen ? '+ 管理分类' : '− 收起分类';
      if (!isOpen) renderErrorCatManagePanel();
    });
  }
  if (addErrorCategoryBtn) {
    addErrorCategoryBtn.addEventListener('click', addErrorCustomCategory);
  }
  if (newErrorCategoryNameInput) {
    newErrorCategoryNameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addErrorCustomCategory(); }
    });
  }

  loadErrorCustomCategories();
  loadErrorCases();
  populateErrorCategorySelect();
  populateErrorFilters();
  renderErrorList();

  // Sync error category select when custom categories change
  var origPopulateCatSelect = populateCategorySelect;
  populateCategorySelect = function () {
    origPopulateCatSelect();
    populateErrorFilters();
  };

  // ============================================================
  // 10c. Data Export
  // ============================================================
  var SECTION_LABELS = {
    'faq': '常见问题',
    'returns': '退换货政策',
    'logistics': '物流配送',
    'payment': '支付方式',
    'after-sales': '售后服务',
    'errors': '错误案例'
  };

  function exportToExcel(filename, sheets) {
    if (typeof XLSX === 'undefined') {
      alert('Excel导出库未加载，请检查网络连接后刷新页面重试。');
      return;
    }
    var wb = XLSX.utils.book_new();
    sheets.forEach(function (sheet) {
      var ws = XLSX.utils.aoa_to_sheet(sheet.data);
      var colWidths = [];
      sheet.data.forEach(function (row) {
        row.forEach(function (cell, ci) {
          var len = cell ? String(cell).length * 2 : 10;
          if (!colWidths[ci] || colWidths[ci].wch < len) colWidths[ci] = { wch: Math.min(len, 60) };
        });
      });
      ws['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    XLSX.writeFile(wb, filename);
  }

  function exportSectionContent(sectionId) {
    var elements = getEditableElements(sectionId);
    var rows = [['序号', '文本内容', 'HTML内容']];
    elements.forEach(function (el, i) {
      var text = el.textContent.trim();
      if (text) rows.push([i + 1, text, el.innerHTML]);
    });
    var rawData = null;
    try { rawData = localStorage.getItem('shophelp_edit_' + sectionId); } catch (e) {}
    if (rawData) {
      var saved = JSON.parse(rawData);
      var savedRows = [['序号', '已保存的编辑内容']];
      Object.keys(saved).forEach(function (k) {
        savedRows.push([parseInt(k) + 1, saved[k]]);
      });
      var filename = 'shophelp_' + sectionId + '_' + new Date().toISOString().slice(0, 10) + '.xlsx';
      exportToExcel(filename, [
        { name: SECTION_LABELS[sectionId] || sectionId, data: rows },
        { name: '已保存编辑', data: savedRows }
      ]);
    } else {
      var filename2 = 'shophelp_' + sectionId + '_' + new Date().toISOString().slice(0, 10) + '.xlsx';
      exportToExcel(filename2, [{ name: SECTION_LABELS[sectionId] || sectionId, data: rows }]);
    }
  }

  function exportKbData() {
    var entryRows = [['标题', '问题分类', '商品分类', '商品名称', '商家编码', '品牌', '关键词', '回答内容', '创建时间']];
    customEntries.forEach(function (e) {
      entryRows.push([
        e.question || '',
        getCatLabel(e.category),
        getProductCatLabel(e.productCategory),
        e.productName || '',
        e.merchantCode || '',
        e.brand || '',
        (e.keywords || []).join('、'),
        e.answer || '',
        e.createdAt ? new Date(e.createdAt).toLocaleString('zh-CN') : ''
      ]);
    });
    var catRows = [['分类值', '分类名称', '类型']];
    DEFAULT_CATEGORIES.forEach(function (c) { catRows.push([c.value, c.label, '默认']); });
    customCategories.forEach(function (c) { catRows.push([c.value, c.label, '自定义']); });
    var filename = 'shophelp_kb_entries_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    exportToExcel(filename, [
      { name: '知识条目 (' + customEntries.length + '条)', data: entryRows },
      { name: '问题分类', data: catRows }
    ]);
  }

  function exportErrorData() {
    var caseRows = [['值班客服', '店铺名称', '问题分类', '登记时间', '问题批注', '整改建议', '图片数量']];
    errorCases.forEach(function (c) {
      caseRows.push([
        c.staffName || '',
        c.storeName || '',
        getErrorCatLabel(c.category),
        c.createdAt ? formatMinute(c.createdAt) : '',
        c.annotation || '',
        c.rectification || '',
        (c.images || []).length
      ]);
    });
    var catRows = [['分类值', '分类名称', '类型']];
    DEFAULT_CATEGORIES.forEach(function (c) { catRows.push([c.value, c.label, '默认']); });
    errorCustomCategories.forEach(function (c) { catRows.push([c.value, c.label, '自定义']); });
    var filename = 'shophelp_error_cases_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    exportToExcel(filename, [
      { name: '错误案例 (' + errorCases.length + '条)', data: caseRows },
      { name: '问题分类', data: catRows }
    ]);
  }

  var kbExportBtn = document.getElementById('kbExportBtn');
  var errorExportBtn = document.getElementById('errorExportBtn');
  if (kbExportBtn) kbExportBtn.addEventListener('click', exportKbData);
  if (errorExportBtn) errorExportBtn.addEventListener('click', exportErrorData);

  // ============================================================
  // 11. Dialogue Simulation
  // ============================================================
  var scenarios = {
    return: {
      name: '退货客户 小王', avatar: '王',
      rounds: [
        {
          customer: '你好，我三天前在你们这买的衣服不太合适，想退货，能退吗？',
          keyPoints: ['7天', '无理由', '退货', '原包装', '吊牌'],
          politePhrases: ['您好', '请问', '帮', '抱歉', '感谢'],
          minLength: 15,
          followUps: {
            good: '好的，吊牌和包装都还在呢，那我怎么申请退货？',
            ok: '包装都在，具体怎么操作你跟我说说？',
            bad: '你能不能直接说能不能退？我问你吊牌在不在干嘛？'
          },
          idealAnswer: '您好，很抱歉商品不合适。我们支持签收后7天无理由退货。请问商品是否保持原包装和吊牌完好？如果完好，您可以在订单详情页点击"申请退货"，或我帮您登记退货申请。'
        },
        {
          customer: '好的，那我退货之后多久能收到退款？',
          keyPoints: ['1-3', '工作日', '退款', '原路', '退回'],
          politePhrases: ['您好', '帮', '请'],
          minLength: 10,
          followUps: {
            good: '明白了，退款到原支付账户是吧，谢谢你的耐心解答！',
            ok: '嗯，知道了，退款到原来的账户是吧。',
            bad: '怎么要这么久？别的平台都是秒退的。'
          },
          idealAnswer: '仓库收到退货商品并验货通过后，退款将在1-3个工作日内原路退回到您的支付账户。您可以在订单详情中查看退款进度，如有问题随时联系我们。'
        },
        {
          customer: '对了，退货的运费谁来出？',
          keyPoints: ['运费', '无理由', '买家', '质量问题', '卖家'],
          politePhrases: ['您好', '请'],
          minLength: 10,
          followUps: {
            good: '好的，明白了，谢谢你，我现在就去申请退货！',
            ok: '嗯，好的，我知道了。',
            bad: '凭什么我出运费？衣服质量也有问题你们也不说！'
          },
          idealAnswer: '您好，7天无理由退货的运费由买家承担。但如果是商品质量问题导致的退货，运费由我们承担。请问您的商品是否有质量问题呢？'
        }
      ]
    },
    logistics: {
      name: '催单客户 李女士', avatar: '李',
      rounds: [
        {
          customer: '我的订单都下单三天了，怎么还没发货？订单号 20260815001',
          keyPoints: ['订单', '查询', '物流', '发货', '抱歉'],
          politePhrases: ['您好', '帮', '抱歉', '请'],
          minLength: 15,
          followUps: {
            good: '好吧，那帮我催一下可以吗？大概什么时候能发？',
            ok: '那你帮我看看什么时候能发货。',
            bad: '三天了都不发货，你们是不是骗子公司？'
          },
          idealAnswer: '您好，非常抱歉让您久等了。请提供一下订单号，我帮您查询订单状态和发货进度。一般情况下订单会在付款后48小时内发货，如果超出时效我会帮您加急处理。'
        },
        {
          customer: '那你们最多多久能发货？我急着要。',
          keyPoints: ['24小时', '48小时', '加急', '发货', '抱歉'],
          politePhrases: ['您好', '帮', '抱歉'],
          minLength: 10,
          followUps: {
            good: '好的，那就帮我加急处理吧，谢谢。',
            ok: '嗯，那你帮我催一下吧。',
            bad: '又是48小时？我已经等了三天了！'
          },
          idealAnswer: '您好，我理解您的心情。我已经帮您标记为加急订单，最迟会在24小时内安排发货。发货后您会收到短信通知，也可以在订单详情中查看物流信息。给您带来不便非常抱歉。'
        },
        {
          customer: '发货后物流大概几天能到？我在北京。',
          keyPoints: ['1-2', '天', '北京', '物流', '追踪'],
          politePhrases: ['您好', '请'],
          minLength: 10,
          followUps: {
            good: '好的，明白了，谢谢你的帮助！',
            ok: '嗯，知道了，谢谢。',
            bad: '那我要是一直不到怎么办？'
          },
          idealAnswer: '您好，北京地区一般发货后1-2天即可送达。发货后您可以在订单详情页点击"查看物流"实时追踪包裹位置。如果超时未送达，请随时联系我们处理。'
        }
      ]
    },
    complaint: {
      name: '投诉客户 张先生', avatar: '张',
      rounds: [
        {
          customer: '你们发来的电饭煲外观有划痕，而且按键也不灵，什么质量！',
          keyPoints: ['抱歉', '质量问题', '退换', '照片', '凭证'],
          politePhrases: ['您好', '抱歉', '帮', '请'],
          minLength: 15,
          followUps: {
            good: '好的，照片我现在就拍，发给你们哪里？',
            ok: '那我拍照发给你们看看？',
            bad: '还要拍照？你们发个坏的东西还有理了？'
          },
          idealAnswer: '您好，非常抱歉给您带来不好的体验。质量问题我们一定负责到底。请您拍几张商品问题的照片（包括划痕和按键位置），发给我们这边核实，我们马上为您办理退换货，运费由我们承担。'
        },
        {
          customer: '照片拍了，我要求换一个新的，不要退货。',
          keyPoints: ['换货', '换新', '运费', '承担', '寄回'],
          politePhrases: ['您好', '帮', '请'],
          minLength: 10,
          followUps: {
            good: '好的，那我寄回去的地址是什么？',
            ok: '那我寄到哪？',
            bad: '又要我寄回去？我不能直接去门店换吗？'
          },
          idealAnswer: '您好，没问题，我们为您办理换货，寄一台全新的同款商品给您。请您将原商品寄回，运费由我们承担（到付即可）。我发您一个退货地址，收到商品验货后48小时内发出新商品。'
        },
        {
          customer: '这次的质量你们怎么保证？别又发个坏的来。',
          keyPoints: ['质检', '检测', '保证', '包装', '抱歉'],
          politePhrases: ['您好', '抱歉', '保证'],
          minLength: 10,
          followUps: {
            good: '好的，那我等着收货吧，希望这次没问题。',
            ok: '嗯，希望这次质量好一点。',
            bad: '你们每次都这么说，质量还是不行。'
          },
          idealAnswer: '您好，非常理解您的顾虑。我保证这次发出的商品会经过仓库质检人员再次检测确认无误后才发出，同时加强包装保护。如果收到的商品仍有任何问题，我们支持再次退换，并额外补偿您20元优惠券。给您带来的不便再次表示歉意。'
        }
      ]
    },
    payment: {
      name: '支付客户 陈小姐', avatar: '陈',
      rounds: [
        {
          customer: '我付款的时候显示支付失败，但是我银行卡钱扣了，怎么回事？',
          keyPoints: ['支付', '核实', '订单', '退款', '抱歉'],
          politePhrases: ['您好', '帮', '抱歉', '请'],
          minLength: 15,
          followUps: {
            good: '好的，订单号是 20260816002，麻烦你帮我查一下。',
            ok: '订单号 20260816002，你帮我看看。',
            bad: '你们系统有问题还让我等？我钱都扣了！'
          },
          idealAnswer: '您好，非常抱歉遇到这个问题。这种情况可能是支付通道延迟导致的。请您提供一下订单号，我帮您核实支付状态。如果确认扣款但订单未支付成功，系统会在1-3个工作日内自动退款到您的银行卡。'
        },
        {
          customer: '那我现在能重新支付吗？还是等退款到了再买？',
          keyPoints: ['重新支付', '订单', '保留', '退款', '到账'],
          politePhrases: ['您好', '帮', '请'],
          minLength: 10,
          followUps: {
            good: '好的，我现在重新支付，谢谢。',
            ok: '嗯，那我重新付一下。',
            bad: '万一又扣钱怎么办？你们系统可靠吗？'
          },
          idealAnswer: '您好，建议您可以直接重新支付该订单，订单商品会为您保留。之前的扣款会在1-3个工作日内原路退回到您的银行卡，不会造成重复扣款。如果您不急，也可以等退款到账后再重新下单。您看哪种方式方便？'
        },
        {
          customer: '好的我重新支付成功了，之前的退款大概几天到账？',
          keyPoints: ['1-3', '工作日', '退款', '到账', '银行卡'],
          politePhrases: ['您好', '请'],
          minLength: 8,
          followUps: {
            good: '好的，谢谢你的耐心帮助！',
            ok: '嗯，知道了。',
            bad: '又是1-3天？能不能快点？'
          },
          idealAnswer: '您好，恭喜订单支付成功！之前的扣款退款会在1-3个工作日内原路退回到您的银行卡。不同银行到账时间可能略有差异，如超过3个工作日未到账，请随时联系我们处理。感谢您的耐心配合！'
        }
      ]
    },
    invoice: {
      name: '发票客户 刘总', avatar: '刘',
      rounds: [
        {
          customer: '你好，我这边是公司采购，需要开增值税专用发票，怎么操作？',
          keyPoints: ['发票', '增值税', '专用', '税号', '订单'],
          politePhrases: ['您好', '帮', '请'],
          minLength: 15,
          followUps: {
            good: '好的，税号是 91110000XXXXXX，资料我发到哪里？',
            ok: '那我提供税号给你们？',
            bad: '我下单的时候怎么没看到开发票的地方？'
          },
          idealAnswer: '您好，公司采购可以开具增值税专用发票。请您提供以下信息：企业名称、税号、注册地址、注册电话、开户银行和账号。您可以在下单时结算页勾选"开具发票"填写信息，也可以在订单完成后联系我帮您补开。'
        },
        {
          customer: '发票开好后多久能收到？是电子的还是纸质的？',
          keyPoints: ['电子', '纸质', '邮寄', '3-5', '工作日'],
          politePhrases: ['您好', '帮', '请'],
          minLength: 10,
          followUps: {
            good: '好的，那我用电子的吧，方便一点。',
            ok: '嗯，电子的可以吗？',
            bad: '为什么不能当场开？别的平台都是电子发票秒开的。'
          },
          idealAnswer: '您好，增值税专用发票目前只提供纸质版，开具周期3-5个工作日。开好后会通过顺丰快递邮寄到您指定的地址，邮费由我们承担。如果您急需，也可以先开电子普通发票作为临时凭证，专票后续补寄。'
        },
        {
          customer: '那如果发票信息开错了，能重新开吗？',
          keyPoints: ['重开', '作废', '修改', '换开', '寄回'],
          politePhrases: ['您好', '帮', '请'],
          minLength: 10,
          followUps: {
            good: '好的，明白了，谢谢你详细的解答！',
            ok: '嗯，知道了，谢谢。',
            bad: '还要我把原票寄回？太麻烦了吧。'
          },
          idealAnswer: '您好，如果发票信息开错了是可以重开的。请您将原发票寄回（电子普通发票无需寄回，我们直接作废重开），我们在收到原发票后3个工作日内为您重新开具正确的发票。重开不产生额外费用，给您带来不便非常抱歉。'
        }
      ]
    }
  };

  var simState = { scenarioId: 'return', roundIndex: 0, totalScore: 0, roundScores: [], active: false, finished: false };
  var simMessages = document.getElementById('simMessages');
  var simStartOverlay = document.getElementById('simStartOverlay');
  var simInputArea = document.getElementById('simInputArea');
  var simInput = document.getElementById('simInput');
  var simSendBtn = document.getElementById('simSendBtn');
  var simStartBtn = document.getElementById('simStartBtn');
  var simScoreEl = document.getElementById('simScore');
  var simCustomerName = document.getElementById('simCustomerName');
  var simAvatar = document.getElementById('simAvatar');
  var simStatus = document.getElementById('simStatus');
  var simSummaryArea = document.getElementById('simSummaryArea');
  var simSuggestPanel = document.getElementById('simSuggestPanel');
  var simSuggestBody = document.getElementById('simSuggestBody');
  var simHintBtn = document.getElementById('simHintBtn');
  var simSuggestClose = document.getElementById('simSuggestClose');
  var simUseBtn = document.getElementById('simUseBtn');
  var scenarioBtns = document.querySelectorAll('.scenario-btn');

  scenarioBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      scenarioBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      simState.scenarioId = btn.getAttribute('data-scenario');
      var sc = scenarios[simState.scenarioId];
      if (sc) { simCustomerName.textContent = sc.name; simAvatar.textContent = sc.avatar; }
      resetSimulation();
    });
  });

  function resetSimulation() {
    simState.roundIndex = 0; simState.totalScore = 0; simState.roundScores = [];
    simState.active = false; simState.finished = false;
    simScoreEl.textContent = '0'; simStatus.textContent = '等待开始对话...';
    simInputArea.style.display = 'none'; simStartOverlay.style.display = 'flex';
    simMessages.innerHTML = ''; simMessages.appendChild(simStartOverlay);
    simSummaryArea.innerHTML = ''; simInput.value = '';
    if (simSuggestPanel) simSuggestPanel.style.display = 'none';
    if (simHintBtn) simHintBtn.classList.remove('active');
  }

  function startSimulation() {
    var sc = scenarios[simState.scenarioId];
    if (!sc) return;
    simState.active = true; simState.finished = false;
    simState.roundIndex = 0; simState.totalScore = 0; simState.roundScores = [];
    simScoreEl.textContent = '0'; simSummaryArea.innerHTML = '';
    simStartOverlay.style.display = 'none'; simInputArea.style.display = 'flex';
    simStatus.textContent = '对话进行中...';
    simCustomerName.textContent = sc.name; simAvatar.textContent = sc.avatar;
    setTimeout(function () { addCustomerMessage(sc.rounds[0].customer); }, 500);
  }

  function addCustomerMessage(text) {
    var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    var msg = document.createElement('div');
    msg.className = 'sim-msg customer';
    msg.innerHTML = '<div class="msg-avatar">客</div><div><div class="msg-bubble">' + escapeHtml(text) + '</div><div class="msg-time">' + time + '</div></div>';
    simMessages.appendChild(msg);
    simMessages.scrollTop = simMessages.scrollHeight;
  }

  function addAgentMessage(text) {
    var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    var msg = document.createElement('div');
    msg.className = 'sim-msg agent';
    msg.innerHTML = '<div class="msg-avatar">我</div><div><div class="msg-bubble">' + escapeHtml(text) + '</div><div class="msg-time">' + time + '</div></div>';
    simMessages.appendChild(msg);
    simMessages.scrollTop = simMessages.scrollHeight;
  }

  function updateSuggestPanel(round) {
    if (!simSuggestBody || !round) return;
    var tipsHtml = '';
    round.keyPoints.forEach(function (kp) { tipsHtml += '<span class="tip-chip">' + escapeHtml(kp) + '</span>'; });
    simSuggestBody.innerHTML =
      '<div class="suggest-label">建议回复话术</div>' +
      '<div class="suggest-answer">' + escapeHtml(round.idealAnswer) + '</div>' +
      '<div class="suggest-tips"><strong>话术要点：</strong>建议在回复中提及以下关键词</div>' +
      '<div class="tip-list">' + tipsHtml + '</div>';
  }

  function showSuggestPanel() {
    if (!simState.active || simState.finished) return;
    var sc = scenarios[simState.scenarioId];
    var round = sc.rounds[simState.roundIndex];
    if (!round) return;
    updateSuggestPanel(round);
    if (simSuggestPanel) simSuggestPanel.style.display = 'block';
    if (simHintBtn) simHintBtn.classList.add('active');
  }

  function hideSuggestPanel() {
    if (simSuggestPanel) simSuggestPanel.style.display = 'none';
    if (simHintBtn) simHintBtn.classList.remove('active');
  }

  function useSuggestScript() {
    var sc = scenarios[simState.scenarioId];
    var round = sc.rounds[simState.roundIndex];
    if (!round) return;
    simInput.value = round.idealAnswer;
    simInput.focus();
    simInput.style.height = 'auto';
    simInput.style.height = Math.min(simInput.scrollHeight, 100) + 'px';
  }

  function addFeedback(feedback) {
    var fb = document.createElement('div');
    fb.className = 'sim-feedback ' + feedback.rating;
    var tagsHtml = '';
    feedback.tags.forEach(function (tag) {
      tagsHtml += '<span class="fb-tag ' + (tag.hit ? 'hit' : 'miss') + '">' + (tag.hit ? '' : '未提及 ') + escapeHtml(tag.text) + '</span>';
    });
    var idealHtml = '';
    if (feedback.idealAnswer) {
      idealHtml = '<div class="sim-ideal-in-feedback">' +
        '<div class="if-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>建议话术 · 参考回复</div>' +
        '<div class="if-body">' + escapeHtml(feedback.idealAnswer) + '</div></div>';
    }
    fb.innerHTML = '<strong>评分：' + feedback.score + '/100</strong> — ' + feedback.comment + '<div class="fb-tags">' + tagsHtml + '</div>' + idealHtml;
    simMessages.appendChild(fb);
    simMessages.scrollTop = simMessages.scrollHeight;
  }

  function evaluateResponse(response, round) {
    var lowerResp = response.toLowerCase();
    var respText = response;
    var hitPoints = [], missPoints = [];
    round.keyPoints.forEach(function (kp) {
      if (respText.indexOf(kp) !== -1 || lowerResp.indexOf(kp.toLowerCase()) !== -1) { hitPoints.push(kp); }
      else { missPoints.push(kp); }
    });
    var hitPolite = [];
    round.politePhrases.forEach(function (pp) { if (respText.indexOf(pp) !== -1) { hitPolite.push(pp); } });
    var keyScore = (hitPoints.length / round.keyPoints.length) * 50;
    var politeScore = hitPolite.length > 0 ? 20 : 0;
    var lengthScore = respText.length >= round.minLength ? 15 : (respText.length / round.minLength) * 15;
    var bonus = 0;
    if (missPoints.length === 0 && hitPolite.length >= 2) { bonus = 15; }
    else if (missPoints.length <= 1) { bonus = 8; }
    var total = Math.round(keyScore + politeScore + lengthScore + bonus);
    var rating, comment;
    if (total >= 80) { rating = 'good'; comment = '回答专业完整，关键信息覆盖全面，服务态度良好！'; }
    else if (total >= 50) { rating = 'warn'; comment = '回答基本到位，但部分关键信息遗漏，可以更完整。'; }
    else { rating = 'warn'; comment = '回复不够完整，缺少重要信息，请参考建议话术改进。'; }
    var tags = round.keyPoints.map(function (kp) { return { text: kp, hit: hitPoints.indexOf(kp) !== -1 }; });
    return { score: total, rating: rating, comment: comment, tags: tags, hitCount: hitPoints.length, totalCount: round.keyPoints.length, idealAnswer: round.idealAnswer };
  }

  function handleSend() {
    if (!simState.active || simState.finished) return;
    var text = simInput.value.trim();
    if (!text) return;
    addAgentMessage(text);
    simInput.value = '';
    simInput.style.height = 'auto';
    hideSuggestPanel();
    var sc = scenarios[simState.scenarioId];
    var round = sc.rounds[simState.roundIndex];
    var feedback = evaluateResponse(text, round);
    simState.totalScore += feedback.score;
    simState.roundScores.push(feedback.score);
    simScoreEl.textContent = simState.totalScore;
    setTimeout(function () {
      addFeedback(feedback);
      setTimeout(function () {
        var nextRoundIndex = simState.roundIndex + 1;
        if (nextRoundIndex < sc.rounds.length) {
          var ratingKey = feedback.rating === 'good' ? 'good' : (feedback.score >= 50 ? 'ok' : 'bad');
          addCustomerMessage(round.followUps[ratingKey]);
          simState.roundIndex = nextRoundIndex;
        } else { finishSimulation(); }
      }, 800);
    }, 500);
  }

  function finishSimulation() {
    simState.finished = true; simState.active = false;
    simInputArea.style.display = 'none'; hideSuggestPanel();
    simStatus.textContent = '对话已结束';
    var sc = scenarios[simState.scenarioId];
    var avgScore = Math.round(simState.totalScore / sc.rounds.length);
    var grade, gradeColor;
    if (avgScore >= 85) { grade = '优秀'; gradeColor = '#22c55e'; }
    else if (avgScore >= 70) { grade = '良好'; gradeColor = '#6366f1'; }
    else if (avgScore >= 50) { grade = '及格'; gradeColor = '#f97316'; }
    else { grade = '需改进'; gradeColor = '#ef4444'; }
    var scoreBars = '';
    sc.rounds.forEach(function (r, i) {
      var score = simState.roundScores[i] || 0;
      var barColor = score >= 80 ? '#22c55e' : (score >= 50 ? '#f97316' : '#ef4444');
      scoreBars += '<div style="margin-bottom:0.5rem"><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.2rem"><span>第' + (i + 1) + '轮</span><span style="font-weight:700;color:' + barColor + '">' + score + '分</span></div><div style="height:6px;background:var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + score + '%;background:' + barColor + ';border-radius:3px;transition:width 0.5s"></div></div></div>';
    });
    var summary = document.createElement('div');
    summary.className = 'sim-summary';
    summary.innerHTML =
      '<h5>演练总结报告</h5>' +
      '<div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.75rem"><div class="summary-score">' + avgScore + '</div><div><div style="font-size:1.1rem;font-weight:700;color:' + gradeColor + '">' + grade + '</div><div style="font-size:0.8rem;color:var(--muted)">' + sc.name + '场景</div></div></div>' +
      '<div class="summary-row"><div class="summary-item">总分 <strong>' + simState.totalScore + '</strong></div><div class="summary-item">轮次 <strong>' + sc.rounds.length + '</strong></div><div class="summary-item">平均 <strong>' + avgScore + '</strong></div></div>' +
      '<div style="margin-top:1rem">' + scoreBars + '</div>' +
      '<div style="display:flex;gap:0.6rem;margin-top:1rem"><button class="btn-primary" id="simRetryBtn">再次演练</button><button class="btn-secondary" id="simShowIdealBtn">查看参考话术</button></div>' +
      '<div id="idealAnswers" style="display:none;margin-top:1rem"></div>';
    simSummaryArea.appendChild(summary);
    document.getElementById('simRetryBtn').addEventListener('click', function () { resetSimulation(); startSimulation(); });
    document.getElementById('simShowIdealBtn').addEventListener('click', function () {
      var idealDiv = document.getElementById('idealAnswers');
      if (idealDiv.style.display === 'none') {
        var html = '<h5 style="font-size:0.9rem;font-weight:700;margin-bottom:0.5rem">参考话术</h5>';
        sc.rounds.forEach(function (r, i) {
          html += '<div style="background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.15);border-radius:8px;padding:0.65rem 0.85rem;margin-bottom:0.5rem"><div style="font-size:0.76rem;color:var(--muted);margin-bottom:0.3rem">第' + (i + 1) + '轮 · 客户：' + escapeHtml(r.customer) + '</div><div style="font-size:0.84rem;color:var(--ink);line-height:1.6">' + escapeHtml(r.idealAnswer) + '</div></div>';
        });
        idealDiv.innerHTML = html; idealDiv.style.display = 'block';
        document.getElementById('simShowIdealBtn').textContent = '隐藏参考话术';
      } else { idealDiv.style.display = 'none'; document.getElementById('simShowIdealBtn').textContent = '查看参考话术'; }
    });
    summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (simStartBtn) simStartBtn.addEventListener('click', startSimulation);
  if (simSendBtn) simSendBtn.addEventListener('click', handleSend);
  if (simInput) {
    simInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    simInput.addEventListener('input', function () { simInput.style.height = 'auto'; simInput.style.height = Math.min(simInput.scrollHeight, 100) + 'px'; });
  }
  if (simHintBtn) simHintBtn.addEventListener('click', function () { if (simSuggestPanel && simSuggestPanel.style.display === 'block') { hideSuggestPanel(); } else { showSuggestPanel(); } });
  if (simSuggestClose) simSuggestClose.addEventListener('click', hideSuggestPanel);
  if (simUseBtn) simUseBtn.addEventListener('click', useSuggestScript);

  // Update sections list for scroll spy
  var newSidebarLinks = document.querySelectorAll('.sidebar a[data-section]');
  sections = [];
  newSidebarLinks.forEach(function (link) {
    var secId = link.getAttribute('data-section');
    var sec = document.getElementById(secId);
    if (sec) sections.push({ link: link, el: sec, id: secId });
  });

  // ============================================================
  // 12. Password Protection
  // ============================================================
  var PWD_KEY = 'shophelp_password';
  var AUTH_KEY = 'shophelp_authed';
  var DEFAULT_PWD = 'shophelp2026';
  var ADMIN_PWD = '63553612';

  function getStoredPassword() {
    try {
      var stored = localStorage.getItem(PWD_KEY);
      return stored || DEFAULT_PWD;
    } catch (e) { return DEFAULT_PWD; }
  }

  function isAuthed() {
    try { return sessionStorage.getItem(AUTH_KEY) === '1'; } catch (e) { return false; }
  }

  function showLogin() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'flex';
    var pwdInput = document.getElementById('loginPassword');
    if (pwdInput) { pwdInput.value = ''; pwdInput.focus(); }
  }

  function hideLogin() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function handleLogin() {
    var pwdInput = document.getElementById('loginPassword');
    var errorEl = document.getElementById('loginError');
    var pwd = pwdInput ? pwdInput.value : '';
    if (pwd === getStoredPassword()) {
      try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (e) {}
      hideLogin();
    } else {
      if (errorEl) errorEl.textContent = '密码错误，请重新输入';
      if (pwdInput) { pwdInput.value = ''; pwdInput.focus(); }
    }
  }

  function handleChangePassword() {
    var adminPwd = prompt('请输入管理员密码：');
    if (adminPwd === null) return;
    if (adminPwd !== ADMIN_PWD) { alert('管理员密码错误，无法修改'); return; }
    var newPwd = prompt('验证通过，请输入新的访问密码：');
    if (newPwd === null) return;
    if (newPwd.trim().length < 4) { alert('新密码至少4位'); return; }
    var confirmPwd = prompt('请再次输入新密码确认：');
    if (confirmPwd === null) return;
    if (newPwd !== confirmPwd) { alert('两次输入的密码不一致'); return; }
    try { localStorage.setItem(PWD_KEY, newPwd.trim()); } catch (e) {}
    alert('密码修改成功');
  }

  var loginBtn = document.getElementById('loginBtn');
  var loginPasswordInput = document.getElementById('loginPassword');
  var changePwdBtn = document.getElementById('changePwdBtn');

  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (loginPasswordInput) {
    loginPasswordInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handleLogin(); }
    });
  }
  if (changePwdBtn) changePwdBtn.addEventListener('click', handleChangePassword);

  if (!isAuthed()) showLogin();

  // ============================================================
  // 13. Consumer Role-Play: Auto-generate recommended scripts
  // ============================================================
  var SOURCE_TAGS = {
    kb: '知识管理',
    faq: '常见问题',
    returns: '退换货政策',
    logistics: '物流配送',
    payment: '支付方式',
    'after-sales': '售后服务'
  };
  var SOURCE_COLORS = {
    kb: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
    faq: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
    returns: { bg: 'rgba(249,115,22,0.1)', text: '#f97316' },
    logistics: { bg: 'rgba(14,165,233,0.1)', text: '#0ea5e9' },
    payment: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
    'after-sales': { bg: 'rgba(236,72,153,0.1)', text: '#ec4899' }
  };

  function collectKnowledgePool() {
    var pool = [];

    // 1. Custom KB entries
    customEntries.forEach(function (e) {
      pool.push({
        source: 'kb',
        title: e.question || '',
        content: e.answer || '',
        keywords: (e.keywords || []).join(' ') + ' ' + (e.productName || '') + ' ' + (e.brand || ''),
        searchText: (e.question + ' ' + e.answer + ' ' + (e.keywords || []).join(' ') + ' ' + (e.productName || '') + ' ' + (e.brand || '')).toLowerCase()
      });
    });

    // 2-6. Section content
    var sectionIds = ['faq', 'returns', 'logistics', 'payment', 'after-sales'];
    sectionIds.forEach(function (sid) {
      var section = document.getElementById(sid);
      if (!section) return;

      // Info cards
      var cards = section.querySelectorAll('.info-card');
      cards.forEach(function (card) {
        var h4 = card.querySelector('h4');
        var ps = card.querySelectorAll('p');
        var title = h4 ? h4.textContent.trim() : '';
        var content = '';
        ps.forEach(function (p) { content += p.textContent.trim() + '\n'; });
        if (title || content) {
          pool.push({
            source: sid,
            title: title,
            content: content.trim(),
            keywords: '',
            searchText: (title + ' ' + content).toLowerCase()
          });
        }
      });

      // FAQ items
      var faqItems = section.querySelectorAll('.faq-item');
      faqItems.forEach(function (item) {
        var q = item.querySelector('.q-text');
        var a = item.querySelector('.faq-a');
        var title = q ? q.textContent.trim() : '';
        var content = a ? a.textContent.trim() : '';
        if (title || content) {
          pool.push({
            source: sid,
            title: title,
            content: content,
            keywords: '',
            searchText: (title + ' ' + content).toLowerCase()
          });
        }
      });

      // Policy cards
      var policyCards = section.querySelectorAll('.policy-card');
      policyCards.forEach(function (card) {
        var h4 = card.querySelector('h4');
        var ps = card.querySelectorAll('p');
        var title = h4 ? h4.textContent.trim() : '';
        var content = '';
        ps.forEach(function (p) { content += p.textContent.trim() + '\n'; });
        if (title || content) {
          pool.push({
            source: sid,
            title: title,
            content: content.trim(),
            keywords: '',
            searchText: (title + ' ' + content).toLowerCase()
          });
        }
      });

      // Pay cards
      var payCards = section.querySelectorAll('.pay-card');
      payCards.forEach(function (card) {
        var h4 = card.querySelector('h4');
        var fee = card.querySelector('.pay-fee');
        var ps = card.querySelectorAll('p');
        var title = h4 ? h4.textContent.trim() : '';
        var content = '';
        if (fee) content += fee.textContent.trim() + '\n';
        ps.forEach(function (p) { content += p.textContent.trim() + '\n'; });
        if (title || content) {
          pool.push({
            source: sid,
            title: title,
            content: content.trim(),
            keywords: '',
            searchText: (title + ' ' + content).toLowerCase()
          });
        }
      });

      // Callout content
      var callouts = section.querySelectorAll('.callout .co-body');
      callouts.forEach(function (co) {
        var content = co.textContent.trim();
        if (content.length > 10) {
          pool.push({
            source: sid,
            title: '',
            content: content,
            keywords: '',
            searchText: content.toLowerCase()
          });
        }
      });

      // KB table rows
      var tableRows = section.querySelectorAll('.kb-table tr');
      tableRows.forEach(function (row) {
        var cells = row.querySelectorAll('td, th');
        var text = '';
        cells.forEach(function (c) { text += c.textContent.trim() + ' '; });
        if (text.trim().length > 3) {
          pool.push({
            source: sid,
            title: '',
            content: text.trim(),
            keywords: '',
            searchText: text.toLowerCase()
          });
        }
      });
    });

    return pool;
  }

  function tokenize(text) {
    var tokens = [];
    var lower = text.toLowerCase();
    // Split by punctuation and spaces to get phrases
    var phrases = lower.split(/[，。！？、；：\s,.\!?;:\n\r]+/).filter(function (p) { return p.length > 0; });
    phrases.forEach(function (phrase) {
      if (phrase.length === 1) return;
      tokens.push(phrase);
      // For Chinese text (contains CJK chars), generate bigrams
      if (/[\u4e00-\u9fa5]/.test(phrase) && phrase.length > 2) {
        for (var i = 0; i < phrase.length - 1; i++) {
          var bigram = phrase.substring(i, i + 2);
          if (bigram.length === 2) tokens.push(bigram);
        }
      }
    });
    return tokens;
  }

  function generateRecommendedScripts() {
    var input = document.getElementById('consumerQuestionInput');
    var resultsEl = document.getElementById('crpResults');
    if (!input || !resultsEl) return;

    var question = input.value.trim();
    if (!question) {
      resultsEl.innerHTML = '<div class="crp-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>请先输入消费者的问题</div>';
      return;
    }

    var pool = collectKnowledgePool();
    var tokens = tokenize(question);

    if (tokens.length === 0) {
      resultsEl.innerHTML = '<div class="crp-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>无法识别问题关键词，请输入更详细的问题</div>';
      return;
    }

    var scored = pool.map(function (item) {
      var score = 0;
      tokens.forEach(function (token) {
        var isBigram = token.length === 2 && /[\u4e00-\u9fa5]/.test(token);
        var weight = isBigram ? 0.5 : 2;
        if (item.searchText.indexOf(token) !== -1) score += weight;
        if (item.title && item.title.toLowerCase().indexOf(token) !== -1) score += weight * 1.5;
        if (item.keywords && item.keywords.toLowerCase().indexOf(token) !== -1) score += weight * 1.2;
      });
      return { item: item, score: Math.round(score * 10) / 10 };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 5);

    if (scored.length === 0) {
      resultsEl.innerHTML = '<div class="crp-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>未找到匹配的知识内容，请尝试用不同的关键词描述问题</div>';
      return;
    }

    var html = '';
    scored.forEach(function (r, idx) {
      var item = r.item;
      var tagColor = SOURCE_COLORS[item.source] || { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' };
      var sourceLabel = SOURCE_TAGS[item.source] || item.source;
      var title = item.title ? item.title : '相关内容';
      var body = item.content || '';
      if (body.length > 500) body = body.substring(0, 500) + '...';

      html += '<div class="crp-result-card" data-crp-idx="' + idx + '">';
      html += '<div class="crp-result-head">';
      html += '<span class="crp-result-tag" style="background:' + tagColor.bg + ';color:' + tagColor.text + '">' + sourceLabel + '</span>';
      html += '<button class="crp-result-copy" data-copy-text="' + encodeURIComponent(body) + '">';
      html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      html += '<span>复制话术</span>';
      html += '</button>';
      html += '</div>';
      html += '<div class="crp-result-body">' + escapeHtml(title) + (body ? '\n\n' + escapeHtml(body) : '') + '</div>';
      html += '<div class="crp-result-source">来源：' + sourceLabel + ' · 匹配度：' + r.score + ' 分</div>';
      html += '</div>';
    });

    resultsEl.innerHTML = html;

    resultsEl.querySelectorAll('.crp-result-copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = decodeURIComponent(btn.getAttribute('data-copy-text'));
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function () {
            var span = btn.querySelector('span');
            var orig = span ? span.textContent : '';
            if (span) span.textContent = '已复制';
            setTimeout(function () { if (span) span.textContent = orig; }, 2000);
          });
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          var span2 = btn.querySelector('span');
          var orig2 = span2 ? span2.textContent : '';
          if (span2) span2.textContent = '已复制';
          setTimeout(function () { if (span2) span2.textContent = orig2; }, 2000);
        }
      });
    });
  }

  var crpGenerateBtn = document.getElementById('crpGenerateBtn');
  var crpClearBtn = document.getElementById('crpClearBtn');
  var consumerQuestionInput = document.getElementById('consumerQuestionInput');

  if (crpGenerateBtn) crpGenerateBtn.addEventListener('click', generateRecommendedScripts);
  if (crpClearBtn) {
    crpClearBtn.addEventListener('click', function () {
      if (consumerQuestionInput) consumerQuestionInput.value = '';
      var resultsEl = document.getElementById('crpResults');
      if (resultsEl) {
        resultsEl.innerHTML = '<div class="crp-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>粘贴消费者问题后点击"生成推荐话术"，系统将从知识库中匹配相关内容</div>';
      }
    });
  }
  if (consumerQuestionInput) {
    consumerQuestionInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); generateRecommendedScripts(); }
    });
  }

})();

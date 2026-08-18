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
  // 4. Sidebar Category Click → Open New Page
  // ============================================================
  var sidebarLinks = document.querySelectorAll('.sidebar a[data-section]');
  var sections = [];
  sidebarLinks.forEach(function (link) {
    var secId = link.getAttribute('data-section');
    var sec = document.getElementById(secId);
    if (sec) sections.push({ link: link, el: sec, id: secId });
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openCategoryPage(secId, link.getAttribute('data-cat-name') || secId);
    });
  });

  function openCategoryPage(secId, catName) {
    var sec = document.getElementById(secId);
    if (!sec) return;
    var sectionHTML = sec.outerHTML;

    var allSectionIds = ['faq', 'returns', 'logistics', 'payment', 'after-sales', 'knowledge', 'errors', 'simulation'];
    var hiddenSectionsHTML = '';
    allSectionIds.forEach(function (sid) {
      if (sid === secId) return;
      var s = document.getElementById(sid);
      if (s) hiddenSectionsHTML += '<div style="display:none">' + s.outerHTML + '</div>';
    });

    var allCSS = '';
    document.querySelectorAll('style').forEach(function (style) {
      allCSS += style.textContent + '\n';
    });

    var html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '<title>' + escapeHtml(catName) + ' - 客服知识库</title>\n';
    html += '<style>\n';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }\n';
    html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif; background: #f8f9fc; color: #1e293b; line-height: 1.6; }\n';
    html += '.cat-page-header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }\n';
    html += '.cat-page-header h1 { font-size: 1.4rem; font-weight: 700; }\n';
    html += '.cat-page-header .back-btn { background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.3rem; transition: background 0.2s; }\n';
    html += '.cat-page-header .back-btn:hover { background: rgba(255,255,255,0.35); }\n';
    html += '.cat-page-body { max-width: 960px; margin: 0 auto; padding: 2rem; }\n';
    html += '.cat-page-body .kb-section { background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 1.5rem; }\n';
    html += '.cat-page-body .section-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }\n';
    html += '.cat-page-body .sec-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }\n';
    html += '.cat-page-body .sec-icon svg { width: 24px; height: 24px; }\n';
    html += '.cat-page-body .section-head h2 { font-size: 1.5rem; font-weight: 700; }\n';
    html += '.cat-page-body .sec-sub { font-size: 0.85rem; color: #64748b; }\n';
    html += '.cat-page-body .section-edit-bar { display: flex; gap: 0.5rem; margin-left: auto; }\n';
    html += '.cat-page-body .section-edit-btn { display: none; }\n';
    html += '.cat-page-body .section-edit-btn.export { display: inline-flex; align-items: center; gap: 0.3rem; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.8rem; cursor: pointer; }\n';
    html += '.cat-page-body .section-edit-btn.export:hover { background: #e2e8f0; }\n';
    html += allCSS + '\n';
    html += '</style>\n';
    html += '</head>\n<body>\n';
    html += '<div class="cat-page-header">\n';
    html += '<button class="back-btn" onclick="window.close()">\n';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M19 12H5"/><polyline points="12 19 5 12 19 5"/></svg>\n返回\n</button>\n';
    html += '<h1>' + escapeHtml(catName) + '</h1>\n';
    html += '</div>\n';
    html += '<div class="cat-page-body">\n';
    html += sectionHTML;
    html += '\n</div>\n';
    html += '<div id="hidden-pool" style="display:none">\n';
    html += hiddenSectionsHTML;
    html += '</div>\n';
    html += '<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"><\/script>\n';
    html += '<script>\n';
    html += 'function escapeHtml(t){var d=document.createElement("div");d.textContent=t;return d.innerHTML;}\n';
    html += 'document.querySelectorAll(".section-edit-btn.export").forEach(function(btn){btn.addEventListener("click",function(){var sec=btn.closest(".kb-section");if(!sec)return;var type=btn.getAttribute("data-export")||"section";var title=sec.querySelector("h2")?sec.querySelector("h2").textContent:type;var data={type:type,title:title,exportDate:new Date().toISOString(),sectionHTML:sec.outerHTML,text:sec.innerText};var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="shophelp_"+type+"_"+new Date().toISOString().slice(0,10)+".json";a.click();});});\n';
    html += 'var SOURCE_TAGS={kb:"知识管理",faq:"常见问题",returns:"退换货政策",logistics:"物流配送",payment:"支付方式","after-sales":"售后服务"};\n';
    html += 'var SOURCE_COLORS={kb:{bg:"rgba(99,102,241,0.1)",text:"#6366f1"},faq:{bg:"rgba(34,197,94,0.1)",text:"#22c55e"},returns:{bg:"rgba(249,115,22,0.1)",text:"#f97316"},logistics:{bg:"rgba(14,165,233,0.1)",text:"#0ea5e9"},payment:{bg:"rgba(139,92,246,0.1)",text:"#8b5cf6"},"after-sales":{bg:"rgba(236,72,153,0.1)",text:"#ec4899"}};\n';
    html += 'function tokenize(text){var tokens=[];var lower=text.toLowerCase();var phrases=lower.split(/[，。！？、；：\\s,.\\!?;:\\n\\r]+/).filter(function(p){return p.length>0;});phrases.forEach(function(phrase){if(phrase.length===1)return;tokens.push(phrase);if(/[\\u4e00-\\u9fa5]/.test(phrase)&&phrase.length>2){for(var i=0;i<phrase.length-1;i++){var bigram=phrase.substring(i,i+2);if(bigram.length===2)tokens.push(bigram);}}});return tokens;}\n';
    html += 'function collectKnowledgePool(){var pool=[];try{var entries=JSON.parse(localStorage.getItem("shophelp_kb_custom_entries")||"[]");entries.forEach(function(e){pool.push({source:"kb",title:e.question||"",content:e.answer||"",productName:e.productName||"",merchantCode:e.merchantCode||"",searchText:(e.question+" "+e.answer+" "+(e.keywords||"")+" "+(e.productName||"")+" "+(e.brand||"")).toLowerCase()});});}catch(err){}var sectionIds=["faq","returns","logistics","payment","after-sales","simulation"];sectionIds.forEach(function(sid){var section=document.getElementById(sid);if(!section)section=document.querySelector("[data-section-id=\\""+sid+"\\"]");if(!section)return;var cards=section.querySelectorAll(".info-card");cards.forEach(function(card){var h4=card.querySelector("h4");var ps=card.querySelectorAll("p");var title=h4?h4.textContent.trim():"";var content="";ps.forEach(function(p){content+=p.textContent.trim()+"\\n";});if(title||content)pool.push({source:sid,title:title,content:content.trim(),searchText:(title+" "+content).toLowerCase()});});var faqItems=section.querySelectorAll(".faq-item");faqItems.forEach(function(item){var q=item.querySelector(".q-text");var a=item.querySelector(".faq-a");var title=q?q.textContent.trim():"";var content=a?a.textContent.trim():"";if(title||content)pool.push({source:sid,title:title,content:content,searchText:(title+" "+content).toLowerCase()});});var policyCards=section.querySelectorAll(".policy-card");policyCards.forEach(function(card){var h4=card.querySelector("h4");var ps=card.querySelectorAll("p");var title=h4?h4.textContent.trim():"";var content="";ps.forEach(function(p){content+=p.textContent.trim()+"\\n";});if(title||content)pool.push({source:sid,title:title,content:content.trim(),searchText:(title+" "+content).toLowerCase()});});var callouts=section.querySelectorAll(".callout .co-body");callouts.forEach(function(co){var content=co.textContent.trim();if(content.length>10)pool.push({source:sid,title:"",content:content,searchText:content.toLowerCase()});});var tableRows=section.querySelectorAll(".kb-table tr");tableRows.forEach(function(row){var cells=row.querySelectorAll("td, th");var text="";cells.forEach(function(c){text+=c.textContent.trim()+" ";});if(text.trim().length>3)pool.push({source:sid,title:"",content:text.trim(),searchText:text.toLowerCase()});});});return pool;}\n';
    html += 'function generateRecommendedScripts(){var input=document.getElementById("consumerQuestionInput");var resultsEl=document.getElementById("crpResults");if(!input||!resultsEl)return;var question=input.value.trim();if(!question){resultsEl.innerHTML="<div class=\\"crp-empty\\"><svg viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"1.5\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><circle cx=\\"11\\" cy=\\"11\\" r=\\"8\\"/><path d=\\"M21 21l-4.35-4.35\\"/></svg>请先输入消费者的问题</div>";return;}var pool=collectKnowledgePool();var tokens=tokenize(question);if(tokens.length===0){resultsEl.innerHTML="<div class=\\"crp-empty\\"><svg viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"1.5\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><circle cx=\\"11\\" cy=\\"11\\" r=\\"8\\"/><path d=\\"M21 21l-4.35-4.35\\"/></svg>无法识别问题关键词，请输入更详细的问题</div>";return;}var scored=pool.map(function(item){var score=0;tokens.forEach(function(token){var isBigram=token.length===2&&/[\\u4e00-\\u9fa5]/.test(token);var weight=isBigram?0.5:2;if(item.searchText.indexOf(token)!==-1)score+=weight;if(item.title&&item.title.toLowerCase().indexOf(token)!==-1)score+=weight*1.5;});return{item:item,score:Math.round(score*10)/10};}).filter(function(r){return r.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,5);if(scored.length===0){resultsEl.innerHTML="<div class=\\"crp-empty\\"><svg viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"1.5\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><circle cx=\\"11\\" cy=\\"11\\" r=\\"8\\"/><path d=\\"M21 21l-4.35-4.35\\"/></svg>未找到匹配的知识内容，请尝试用不同的关键词描述问题</div>";return;}var html="";scored.forEach(function(r,idx){var item=r.item;var tagColor=SOURCE_COLORS[item.source]||{bg:"rgba(107,114,128,0.1)",text:"#6b7280"};var sourceLabel=SOURCE_TAGS[item.source]||item.source;var title=item.title?item.title:"相关内容";var body=item.content||"";if(body.length>500)body=body.substring(0,500)+"...";html+="<div class=\\"crp-result-card\\" data-crp-idx=\\""+idx+"\\">";html+="<div class=\\"crp-result-head\\">";html+="<span class=\\"crp-result-tag\\" style=\\"background:"+tagColor.bg+";color:"+tagColor.text+"\\">"+sourceLabel+"</span>";html+="<button class=\\"crp-result-copy\\" data-copy-text=\\""+encodeURIComponent(body)+"\\">";html+="<svg viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><rect x=\\"9\\" y=\\"9\\" width=\\"13\\" height=\\"13\\" rx=\\"2\\" ry=\\"2\\"/><path d=\\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\\"/></svg>";html+="<span>复制话术</span>";html+="</button>";html+="</div>";html+="<div class=\\"crp-result-body\\">"+escapeHtml(title)+(body?"\\n\\n"+escapeHtml(body):"")+"</div>";if(item.source==="kb"){var pn=item.productName||"通用";var mc=item.merchantCode||"通用";html+="<div class=\\"crp-result-meta\\">";html+="<span class=\\"crp-meta-item\\"><svg viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" style=\\"width:13px;height:13px;vertical-align:-2px;margin-right:3px\\"><path d=\\"M20 7l-8-4-8 4 8 4 8-4z\\"/><path d=\\"M4 12l8 4 8-4\\"/><path d=\\"M4 17l8 4 8-4\\"/></svg>商品名称：<strong>"+escapeHtml(pn)+"</strong></span>";html+="<span class=\\"crp-meta-item\\"><svg viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" style=\\"width:13px;height:13px;vertical-align:-2px;margin-right:3px\\"><rect x=\\"3\\" y=\\"3\\" width=\\"18\\" height=\\"18\\" rx=\\"2\\"/><path d=\\"M9 9h6v6H9z\\"/></svg>商家编码：<strong>"+escapeHtml(mc)+"</strong></span>";html+="</div>";}html+="<div class=\\"crp-result-source\\">来源："+sourceLabel+" · 匹配度："+r.score+" 分</div>";html+="</div>";});resultsEl.innerHTML=html;resultsEl.querySelectorAll(".crp-result-copy").forEach(function(btn){btn.addEventListener("click",function(){var text=decodeURIComponent(btn.getAttribute("data-copy-text"));if(navigator.clipboard){navigator.clipboard.writeText(text).then(function(){var span=btn.querySelector("span");var orig=span?span.textContent:"";if(span)span.textContent="已复制";setTimeout(function(){if(span)span.textContent=orig;},2000);});}else{var ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);var span2=btn.querySelector("span");var orig2=span2?span2.textContent:"";if(span2)span2.textContent="已复制";setTimeout(function(){if(span2)span2.textContent=orig2;},2000);}});});}\n';
    html += 'var crpGenBtn=document.getElementById("crpGenerateBtn");var crpClrBtn=document.getElementById("crpClearBtn");var crpInput=document.getElementById("consumerQuestionInput");if(crpGenBtn)crpGenBtn.addEventListener("click",generateRecommendedScripts);if(crpClrBtn)crpClrBtn.addEventListener("click",function(){if(crpInput)crpInput.value="";var r=document.getElementById("crpResults");if(r)r.innerHTML="";});if(crpInput)crpInput.addEventListener("keydown",function(e){if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();generateRecommendedScripts();}});\n';
    html += '<\/script>\n';
    html += '</body>\n</html>';

    var w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    } else {
      alert('请允许弹出窗口以查看分类内容');
    }
  }

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
  // 8. Knowledge Management (CRUD + Product/Brand + Clicks)
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
        (e.keywords || ''),
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
  // 11. Update sections list for scroll spy
  // ============================================================
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
  // 13. CS Exam: Auto-generate quiz from knowledge base
  // ============================================================
  var SOURCE_TAGS = {
    kb: '知识管理',
    faq: '常见问题',
    returns: '退换货政策',
    logistics: '物流配送',
    payment: '支付方式',
    'after-sales': '售后服务'
  };

  function collectKnowledgePool() {
    var pool = [];

    customEntries.forEach(function (e) {
      pool.push({
        source: 'kb',
        title: e.question || '',
        content: e.answer || '',
        productName: e.productName || '',
        merchantCode: e.merchantCode || '',
        searchText: (e.question + ' ' + e.answer + ' ' + (e.keywords || '') + ' ' + (e.productName || '') + ' ' + (e.brand || '')).toLowerCase()
      });
    });

    var sectionIds = ['faq', 'returns', 'logistics', 'payment', 'after-sales'];
    sectionIds.forEach(function (sid) {
      var section = document.getElementById(sid);
      if (!section) return;

      var cards = section.querySelectorAll('.info-card');
      cards.forEach(function (card) {
        var h4 = card.querySelector('h4');
        var ps = card.querySelectorAll('p');
        var title = h4 ? h4.textContent.trim() : '';
        var content = '';
        ps.forEach(function (p) { content += p.textContent.trim() + '\n'; });
        if (title || content) {
          pool.push({ source: sid, title: title, content: content.trim(), searchText: (title + ' ' + content).toLowerCase() });
        }
      });

      var faqItems = section.querySelectorAll('.faq-item');
      faqItems.forEach(function (item) {
        var q = item.querySelector('.q-text');
        var a = item.querySelector('.faq-a');
        var title = q ? q.textContent.trim() : '';
        var content = a ? a.textContent.trim() : '';
        if (title || content) {
          pool.push({ source: sid, title: title, content: content, searchText: (title + ' ' + content).toLowerCase() });
        }
      });

      var policyCards = section.querySelectorAll('.policy-card');
      policyCards.forEach(function (card) {
        var h4 = card.querySelector('h4');
        var ps = card.querySelectorAll('p');
        var title = h4 ? h4.textContent.trim() : '';
        var content = '';
        ps.forEach(function (p) { content += p.textContent.trim() + '\n'; });
        if (title || content) {
          pool.push({ source: sid, title: title, content: content.trim(), searchText: (title + ' ' + content).toLowerCase() });
        }
      });

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
          pool.push({ source: sid, title: title, content: content.trim(), searchText: (title + ' ' + content).toLowerCase() });
        }
      });

      var callouts = section.querySelectorAll('.callout .co-body');
      callouts.forEach(function (co) {
        var content = co.textContent.trim();
        if (content.length > 10) {
          pool.push({ source: sid, title: '', content: content, searchText: content.toLowerCase() });
        }
      });

      var tableRows = section.querySelectorAll('.kb-table tr');
      tableRows.forEach(function (row) {
        var cells = row.querySelectorAll('td, th');
        var text = '';
        cells.forEach(function (c) { text += c.textContent.trim() + ' '; });
        if (text.trim().length > 3) {
          pool.push({ source: sid, title: '', content: text.trim(), searchText: text.toLowerCase() });
        }
      });
    });

    return pool;
  }

  function shuffleArr(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function truncateStr(str, maxLen) {
    if (!str) return '';
    str = str.replace(/\n+/g, ' ').trim();
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  }

  function splitSentences(text) {
    if (!text) return [];
    return text.split(/[。\n！？；]/).filter(function (s) { return s.trim().length > 8; }).map(function (s) { return s.trim(); });
  }

  var examQuestions = [];
  var examAnswers = {};

  function generateExamQuestions() {
    var pool = collectKnowledgePool();
    var usable = pool.filter(function (item) {
      return item.content && item.content.length > 20 && item.title && item.title.length > 2;
    });

    if (usable.length < 4) {
      return null;
    }

    usable = shuffleArr(usable);
    var questions = [];
    var count = Math.min(15, usable.length);

    for (var i = 0; i < count; i++) {
      var item = usable[i % usable.length];
      var isMulti = Math.random() < 0.4;
      if (isMulti) {
        questions.push(makeMultipleChoice(item, i));
      } else {
        questions.push(makeSingleChoice(item, i));
      }
    }

    return questions;
  }

  function mutateText(text) {
    var mutations = [];

    var numMatches = text.match(/\d+/g);
    if (numMatches && numMatches.length > 0) {
      for (var n = 0; n < numMatches.length; n++) {
        var orig = numMatches[n];
        var num = parseInt(orig);
        var variants = [num + 1, num + 2, num - 1, num * 2, num + 5];
        var picked = variants[Math.floor(Math.random() * variants.length)];
        if (picked < 0) picked = num + 3;
        var mutated = text.replace(orig, String(picked));
        if (mutated !== text) mutations.push(mutated);
        break;
      }
    }

    var negationPairs = [
      { from: '可以', to: '不可以' }, { from: '不支持', to: '支持' }, { from: '支持', to: '不支持' },
      { from: '退款', to: '换货' }, { from: '退货', to: '换货' }, { from: '换货', to: '退货' },
      { from: '工作日', to: '自然日' }, { from: '原路', to: '另行' },
      { from: '免费', to: '收费' }, { from: '收费', to: '免费' },
      { from: '7天', to: '3天' }, { from: '15天', to: '7天' }, { from: '3天', to: '15天' },
      { from: '24小时', to: '48小时' }, { from: '48小时', to: '24小时' },
      { from: '微信', to: '支付宝' }, { from: '支付宝', to: '微信' },
      { from: '银行卡', to: '信用卡' }, { from: '信用卡', to: '银行卡' },
      { from: '全部', to: '部分' }, { from: '部分', to: '全部' },
      { from: '必须', to: '无需' }, { from: '无需', to: '必须' },
      { from: '原包装', to: '任意包装' }, { from: '二次销售', to: '三次销售' }
    ];
    var shuffledPairs = shuffleArr(negationPairs);
    for (var p = 0; p < shuffledPairs.length; p++) {
      var pair = shuffledPairs[p];
      if (text.indexOf(pair.from) !== -1) {
        var mutated2 = text.replace(pair.from, pair.to);
        if (mutated2 !== text && mutations.indexOf(mutated2) === -1) {
          mutations.push(mutated2);
          break;
        }
      }
    }

    if (mutations.length === 0) {
      var prefixes = ['根据规定，', '通常情况下，', '一般情况下，', '在特殊情况下，', '请注意：'];
      prefixes.forEach(function (p) { mutations.push(p + text); });
    }

    return mutations;
  }

  function makeSingleChoice(item, currentIdx) {
    var correctText = truncateStr(item.content, 120);
    var mutations = mutateText(correctText);
    var wrongOptions = [];

    while (wrongOptions.length < 3 && mutations.length > 0) {
      var m = mutations.shift();
      var truncated = truncateStr(m, 120);
      if (truncated !== correctText && wrongOptions.indexOf(truncated) === -1) {
        wrongOptions.push(truncated);
      }
    }

    var attempts = 0;
    while (wrongOptions.length < 3 && attempts < 20) {
      attempts++;
      var extra = mutateText(correctText);
      for (var e = 0; e < extra.length && wrongOptions.length < 3; e++) {
        var t = truncateStr(extra[e], 120);
        if (t !== correctText && wrongOptions.indexOf(t) === -1) {
          wrongOptions.push(t);
        }
      }
      if (extra.length === 0) break;
    }

    while (wrongOptions.length < 3) {
      wrongOptions.push('此项描述与正确答案不符');
    }

    var options = wrongOptions.concat([correctText]);
    options = shuffleArr(options);
    var correctIdx = options.indexOf(correctText);

    return {
      type: 'single',
      source: item.source,
      question: '关于「' + item.title + '」，以下哪个描述是正确的？',
      options: options,
      correct: [correctIdx],
      explanation: item.content
    };
  }

  function makeMultipleChoice(item, currentIdx) {
    var sentences = splitSentences(item.content);
    var allOptions = [];
    var correctIndices = [];

    sentences.slice(0, 3).forEach(function (s) {
      allOptions.push(truncateStr(s, 100));
      correctIndices.push(allOptions.length - 1);
    });

    var mcAttempts = 0;
    while (allOptions.length < 4 && mcAttempts < 20) {
      mcAttempts++;
      var src = sentences.length > 0 ? sentences[Math.floor(Math.random() * sentences.length)] : item.content;
      var muts = mutateText(truncateStr(src, 100));
      if (muts.length > 0) {
        var m = truncateStr(muts[0], 100);
        if (allOptions.indexOf(m) === -1) allOptions.push(m);
      } else {
        break;
      }
    }

    while (allOptions.length < 4) {
      allOptions.push('此项描述不正确');
    }

    if (correctIndices.length > 3) correctIndices = correctIndices.slice(0, 3);
    if (correctIndices.length < 2) {
      var extraSrc = sentences.length > 1 ? truncateStr(sentences[1], 100) : truncateStr(item.content, 60);
      allOptions.push(extraSrc);
      correctIndices.push(allOptions.length - 1);
    }

    var shuffled = shuffleArr(allOptions.map(function (opt, idx) { return { text: opt, isCorrect: correctIndices.indexOf(idx) >= 0 }; }));
    var finalOptions = shuffled.map(function (s) { return s.text; });
    var finalCorrect = shuffled.map(function (s, idx) { return s.isCorrect ? idx : -1; }).filter(function (i) { return i >= 0; });

    return {
      type: 'multiple',
      source: item.source,
      question: '关于「' + item.title + '」，以下哪些说法是正确的？（多选）',
      options: finalOptions,
      correct: finalCorrect,
      explanation: item.content
    };
  }

  function renderExam(questions) {
    var container = document.getElementById('examContainer');
    if (!container) return;

    var html = '<div class="exam-progress-bar"><div class="exam-progress-bar-fill" style="width:0%"></div></div>';
    html += '<div id="examQuestions">';

    questions.forEach(function (q, idx) {
      var typeLabel = q.type === 'single' ? '单选题' : '多选题';
      var typeClass = q.type === 'single' ? 'single' : 'multi';
      var sourceLabel = SOURCE_TAGS[q.source] || q.source;
      var optLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

      html += '<div class="exam-question-card" data-q-idx="' + idx + '">';
      html += '<div class="exam-q-header">';
      html += '<div class="exam-q-num">' + (idx + 1) + '</div>';
      html += '<span class="exam-q-type ' + typeClass + '">' + typeLabel + '</span>';
      html += '<span class="exam-q-source">来源：' + escapeHtml(sourceLabel) + '</span>';
      html += '</div>';
      html += '<div class="exam-q-text">' + escapeHtml(q.question) + '</div>';
      html += '<div class="exam-options">';
      q.options.forEach(function (opt, oIdx) {
        html += '<div class="exam-option" data-q-idx="' + idx + '" data-opt-idx="' + oIdx + '">';
        html += '<div class="opt-label">' + optLabels[oIdx] + '</div>';
        html += '<div class="opt-text">' + escapeHtml(opt) + '</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';
    html += '<div class="exam-actions">';
    html += '<button class="btn-primary" id="examSubmitBtn" style="padding:0.6rem 1.4rem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:0.3rem;vertical-align:middle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>提交试卷</button>';
    html += '<button class="btn-outline" id="examCancelBtn" style="padding:0.6rem 1.4rem">放弃考试</button>';
    html += '</div>';

    container.innerHTML = html;

    container.querySelectorAll('.exam-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var qIdx = parseInt(opt.getAttribute('data-q-idx'));
        var oIdx = parseInt(opt.getAttribute('data-opt-idx'));
        var q = questions[qIdx];

        if (q.type === 'single') {
          container.querySelectorAll('.exam-option[data-q-idx="' + qIdx + '"]').forEach(function (o) {
            o.classList.remove('selected');
          });
          opt.classList.add('selected');
          examAnswers[qIdx] = [oIdx];
        } else {
          opt.classList.toggle('selected');
          if (!examAnswers[qIdx]) examAnswers[qIdx] = [];
          var arr = examAnswers[qIdx];
          var pos = arr.indexOf(oIdx);
          if (pos >= 0) arr.splice(pos, 1);
          else arr.push(oIdx);
        }
      });
    });

    var submitBtn = document.getElementById('examSubmitBtn');
    if (submitBtn) submitBtn.addEventListener('click', function () { submitExam(questions); });
    var cancelBtn = document.getElementById('examCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', resetExam);
  }

  function submitExam(questions) {
    var unanswered = 0;
    questions.forEach(function (q, idx) {
      if (!examAnswers[idx] || examAnswers[idx].length === 0) unanswered++;
    });

    if (unanswered > 0) {
      var proceed = confirm('还有 ' + unanswered + ' 道题未作答，确定要提交吗？');
      if (!proceed) return;
    }

    var correctCount = 0;

    questions.forEach(function (q, idx) {
      var userAns = (examAnswers[idx] || []).slice().sort(function (a, b) { return a - b; });
      var correctAns = q.correct.slice().sort(function (a, b) { return a - b; });
      var isCorrect = JSON.stringify(userAns) === JSON.stringify(correctAns);
      if (isCorrect) { correctCount++; }
    });

    var totalScore = Math.round((correctCount / questions.length) * 100);
    renderExamResult(questions, correctCount, totalScore);
  }

  function renderExamResult(questions, correctCount, totalScore) {
    var container = document.getElementById('examContainer');
    if (!container) return;
    var passed = totalScore >= 90;
    var wrongCount = questions.length - correctCount;
    var optLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

    var html = '<div class="exam-result-summary">';
    html += '<div style="display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap;margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">';
    html += '<div style="font-size:0.82rem;color:var(--muted)">考生：<strong style="color:var(--dark)">' + escapeHtml(examStudentName) + '</strong></div>';
    html += '<div style="font-size:0.82rem;color:var(--muted)">日期：<strong style="color:var(--dark)">' + escapeHtml(examStudentDate) + '</strong></div>';
    html += '</div>';
    html += '<div class="exam-score-circle ' + (passed ? 'pass' : 'fail') + '">';
    html += '<div class="score-num">' + totalScore + '</div>';
    html += '<div class="score-label">' + (passed ? '恭喜通过' : '未通过') + '</div>';
    html += '</div>';
    html += '<div class="exam-result-stats">';
    html += '<div class="exam-result-stat"><div class="val" style="color:#22c55e">' + correctCount + '</div><div class="lbl">答对</div></div>';
    html += '<div class="exam-result-stat"><div class="val" style="color:#ef4444">' + wrongCount + '</div><div class="lbl">答错</div></div>';
    html += '<div class="exam-result-stat"><div class="val" style="color:#6366f1">' + questions.length + '</div><div class="lbl">总题数</div></div>';
    html += '<div class="exam-result-stat"><div class="val" style="color:' + (passed ? '#22c55e' : '#ef4444') + '">' + totalScore + '%</div><div class="lbl">准确率</div></div>';
    html += '</div>';
    html += '<div style="text-align:center;font-size:0.78rem;color:var(--muted);margin-top:0.6rem">通过标准：准确率 ≥ 90%</div>';
    html += '</div>';

    html += '<h4 style="font-size:0.9rem;font-weight:700;color:var(--dark);margin:1rem 0 0.5rem">答题回顾</h4>';

    questions.forEach(function (q, idx) {
      var userAns = (examAnswers[idx] || []).slice().sort(function (a, b) { return a - b; });
      var correctAns = q.correct.slice().sort(function (a, b) { return a - b; });
      var isCorrect = JSON.stringify(userAns) === JSON.stringify(correctAns);

      html += '<div class="exam-review-card ' + (isCorrect ? 'correct' : 'wrong') + '">';
      html += '<div class="exam-review-q">' + (idx + 1) + '. ' + escapeHtml(q.question) + '</div>';

      if (!isCorrect) {
        var userLabels = userAns.map(function (i) { return optLabels[i]; }).join('、') || '未作答';
        var correctLabels = correctAns.map(function (i) { return optLabels[i]; }).join('、');
        html += '<div class="exam-review-ans"><span class="tag wrong">你的答案：</span>' + escapeHtml(userLabels) + '</div>';
        html += '<div class="exam-review-ans"><span class="tag right">正确答案：</span>' + escapeHtml(correctLabels) + '</div>';
        html += '<div class="exam-review-explanation">' + escapeHtml(truncateStr(q.explanation, 200)) + '</div>';
      } else {
        html += '<div class="exam-review-ans"><span class="tag right">回答正确</span></div>';
      }

      html += '</div>';
    });

    html += '<div class="exam-actions">';
    html += '<button class="btn-primary" id="examRefreshBtn" style="padding:0.6rem 1.4rem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:0.3rem;vertical-align:middle"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>刷新题目重新作答</button>';
    html += '<button class="btn-secondary" id="examRetryBtn" style="padding:0.6rem 1.4rem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:0.3rem;vertical-align:middle"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>返回重新填写</button>';
    html += '</div>';

    container.innerHTML = html;

    var refreshBtn = document.getElementById('examRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshExamQuestions);
    var retryBtn = document.getElementById('examRetryBtn');
    if (retryBtn) retryBtn.addEventListener('click', resetExam);
  }

  function refreshExamQuestions() {
    examAnswers = {};
    var questions = generateExamQuestions();
    if (!questions) {
      var container = document.getElementById('examContainer');
      if (container) {
        container.innerHTML = '<div class="exam-empty">知识库内容不足，无法生成新题目。请先在知识管理中添加更多内容后，点击下方"返回重新填写"重试。</div>';
      }
      return;
    }
    examQuestions = questions;
    renderExam(questions);
    var container = document.getElementById('examContainer');
    if (container) {
      var banner = document.createElement('div');
      banner.style.cssText = 'background:#ecfdf5;border:1px solid #10b981;color:#065f46;padding:0.5rem 0.8rem;border-radius:8px;font-size:0.8rem;margin-bottom:0.8rem;text-align:center';
      banner.textContent = '已刷新题目，考生：' + examStudentName + '　日期：' + examStudentDate;
      container.insertBefore(banner, container.firstChild);
    }
  }

  var examStudentName = '';
  var examStudentDate = '';

  function startExam() {
    var nameInput = document.getElementById('examNameInput');
    var dateInput = document.getElementById('examDateInput');

    if (nameInput && !nameInput.value.trim()) {
      nameInput.style.borderColor = '#ef4444';
      nameInput.focus();
      var hint = document.getElementById('examNameHint');
      if (hint) hint.style.display = 'block';
      return;
    }
    if (dateInput && !dateInput.value.trim()) {
      dateInput.style.borderColor = '#ef4444';
      dateInput.focus();
      return;
    }

    examStudentName = nameInput ? nameInput.value.trim() : '';
    examStudentDate = dateInput ? dateInput.value.trim() : '';

    examAnswers = {};
    var questions = generateExamQuestions();
    if (!questions) {
      var container = document.getElementById('examContainer');
      if (container) {
        container.innerHTML = '<div class="exam-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>知识库内容不足，至少需要4条带标题和内容的知识条目才能生成考题。请先在知识管理中添加更多内容。</div>';
      }
      return;
    }
    examQuestions = questions;
    renderExam(questions);
  }

  function resetExam() {
    examQuestions = [];
    examAnswers = {};
    examStudentName = '';
    examStudentDate = '';
    var container = document.getElementById('examContainer');
    if (!container) return;

    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    container.innerHTML =
      '<div class="exam-start-panel" id="examStartPanel">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;color:#6366f1;margin:0 auto 1rem;display:block"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13l2 2 4-4"/></svg>' +
        '<p style="font-size:0.9rem;color:var(--muted);max-width:400px;margin:0 auto 1rem">系统将从知识管理、常见问题、退换货政策、物流配送、支付方式、售后服务中随机生成15道选择题，准确率达到90%即为通过</p>' +
        '<div class="exam-info">' +
          '<div class="exam-stat"><div class="num" id="examPoolCount">-</div><div class="label">知识条目</div></div>' +
          '<div class="exam-stat"><div class="num">15</div><div class="label">考试题数</div></div>' +
          '<div class="exam-stat"><div class="num">90</div><div class="label">合格分数</div></div>' +
        '</div>' +
        '<div style="max-width:360px;margin:1.2rem auto 0;display:flex;flex-direction:column;gap:0.8rem">' +
          '<div style="text-align:left">' +
            '<label style="font-size:0.82rem;font-weight:600;color:var(--dark);display:block;margin-bottom:0.3rem">考生姓名 <span style="color:#ef4444">*</span></label>' +
            '<input type="text" id="examNameInput" placeholder="请输入姓名" style="width:100%;padding:0.6rem 0.8rem;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;font-family:var(--font);box-sizing:border-box;transition:border-color 0.2s" />' +
            '<p id="examNameHint" style="display:none;color:#ef4444;font-size:0.74rem;margin-top:0.3rem">请填写姓名后才能开始考试</p>' +
          '</div>' +
          '<div style="text-align:left">' +
            '<label style="font-size:0.82rem;font-weight:600;color:var(--dark);display:block;margin-bottom:0.3rem">考试日期 <span style="color:#ef4444">*</span></label>' +
            '<input type="date" id="examDateInput" value="' + todayStr + '" style="width:100%;padding:0.6rem 0.8rem;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;font-family:var(--font);box-sizing:border-box;transition:border-color 0.2s" />' +
          '</div>' +
        '</div>' +
        '<button class="btn-primary" id="examStartBtn" style="padding:0.7rem 2rem;font-size:0.9rem;margin-top:1.2rem">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:0.3rem;vertical-align:middle"><polygon points="5 3 19 12 5 21 5 3"/></svg>开始考试' +
        '</button>' +
      '</div>';

    var nameInput = document.getElementById('examNameInput');
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        nameInput.style.borderColor = '';
        var hint = document.getElementById('examNameHint');
        if (hint) hint.style.display = 'none';
      });
    }

    updatePoolCount();
    bindStartBtn();
  }

  function updatePoolCount() {
    var pool = collectKnowledgePool();
    var usable = pool.filter(function (item) {
      return item.content && item.content.length > 20 && item.title && item.title.length > 2;
    });
    var el = document.getElementById('examPoolCount');
    if (el) el.textContent = usable.length;
  }

  function bindStartBtn() {
    var btn = document.getElementById('examStartBtn');
    if (btn) btn.addEventListener('click', startExam);

    var dateInput = document.getElementById('examDateInput');
    if (dateInput && !dateInput.value) {
      var today = new Date();
      dateInput.value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    }

    var nameInput = document.getElementById('examNameInput');
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        nameInput.style.borderColor = '';
        var hint = document.getElementById('examNameHint');
        if (hint) hint.style.display = 'none';
      });
    }
  }

  bindStartBtn();
  updatePoolCount();

  // ============================================================
  // 14. Consumer Question → Recommended Scripts
  // ============================================================
  var SOURCE_COLORS = {
    kb: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
    faq: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
    returns: { bg: 'rgba(249,115,22,0.1)', text: '#f97316' },
    logistics: { bg: 'rgba(14,165,233,0.1)', text: '#0ea5e9' },
    payment: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
    'after-sales': { bg: 'rgba(236,72,153,0.1)', text: '#ec4899' }
  };

  function tokenize(text) {
    var tokens = [];
    var lower = text.toLowerCase();
    var phrases = lower.split(/[，。！？、；：\s,.\!?;:\n\r]+/).filter(function (p) { return p.length > 0; });
    phrases.forEach(function (phrase) {
      if (phrase.length === 1) return;
      tokens.push(phrase);
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
      if (item.source === 'kb') {
        var pn = item.productName || '通用';
        var mc = item.merchantCode || '通用';
        html += '<div class="crp-result-meta">';
        html += '<span class="crp-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"><path d="M20 7l-8-4-8 4 8 4 8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/></svg>商品名称：<strong>' + escapeHtml(pn) + '</strong></span>';
        html += '<span class="crp-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg>商家编码：<strong>' + escapeHtml(mc) + '</strong></span>';
        html += '</div>';
      }
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

  // ============================================================
  // 14. Shared Data Sync (GitHub-based)
  // ============================================================
  var SHARED_DATA_URL = 'https://nbcx-art.github.io/ecommerce-kb/shared-data.json';
  var GITHUB_API_URL = 'https://api.github.com/repos/nbcx-art/ecommerce-kb/contents/shared-data.json';
  var SHARED_KEYS = [
    'shophelp_kb_custom_entries',
    'shophelp_kb_custom_categories',
    'shophelp_errors_custom_entries',
    'shophelp_errors_custom_categories',
    'edit_常见问题',
    'edit_退换货',
    'edit_物流配送',
    'edit_支付方式',
    'edit_售后服务'
  ];

  function collectAllSharedData() {
    var data = {};
    SHARED_KEYS.forEach(function (key) {
      var val = localStorage.getItem(key);
      if (val !== null) data[key] = val;
    });
    Object.keys(localStorage).forEach(function (key) {
      if (key.indexOf('custom_') === 0) {
        data[key] = localStorage.getItem(key);
      }
    });
    var pwd = localStorage.getItem('shophelp_access_password');
    if (pwd) data['shophelp_access_password'] = pwd;
    return data;
  }

  function applySharedData(sharedData) {
    if (!sharedData || typeof sharedData !== 'object') return;
    var data = sharedData.data || sharedData;
    var merged = 0;
    var overwritten = 0;
    Object.keys(data).forEach(function (key) {
      var currentVal = localStorage.getItem(key);
      if (currentVal !== data[key]) {
        if (currentVal !== null) overwritten++;
        else merged++;
        localStorage.setItem(key, data[key]);
      }
    });
    if (merged > 0 || overwritten > 0) {
      var msg = '同步完成：新增 ' + merged + ' 项';
      if (overwritten > 0) msg += '，更新 ' + overwritten + ' 项';
      if (typeof showToast === 'function') showToast(msg);
      else console.log(msg);
      if (typeof renderKbList === 'function') renderKbList();
      if (typeof renderErrorList === 'function') renderErrorList();
      if (typeof loadCustomEdits === 'function') loadCustomEdits();
    }
  }

  function showDataToast(msg, type) {
    var existing = document.getElementById('dataToast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'dataToast';
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;padding:0.8rem 1.5rem;border-radius:10px;font-size:0.85rem;font-family:var(--font);box-shadow:0 4px 20px rgba(0,0,0,0.15);transition:opacity 0.3s;max-width:90vw;text-align:center;';
    if (type === 'error') {
      toast.style.background = '#fef2f2';
      toast.style.color = '#dc2626';
      toast.style.border = '1px solid #fecaca';
    } else if (type === 'success') {
      toast.style.background = '#f0fdf4';
      toast.style.color = '#16a34a';
      toast.style.border = '1px solid #bbf7d0';
    } else {
      toast.style.background = '#eff6ff';
      toast.style.color = '#2563eb';
      toast.style.border = '1px solid #bfdbfe';
    }
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.style.opacity = '0'; }, 3000);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 3500);
  }

  function showTokenModal(callback) {
    var existing = document.getElementById('tokenModalOverlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'tokenModalOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:2rem;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:var(--font)">' +
      '<h3 style="margin:0 0 0.5rem;font-size:1.1rem;color:var(--dark)">发布数据到云端</h3>' +
      '<p style="margin:0 0 1rem;font-size:0.82rem;color:var(--muted)">请输入 GitHub Token（仅首次输入，之后自动记住）</p>' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.8rem;margin-bottom:1rem;font-size:0.78rem;color:#64748b;line-height:1.5">' +
      '<strong style="color:#475569">Token 权限要求：</strong><br>Contents: Read and write<br><br>' +
      '<a href="https://github.com/settings/personal-access-tokens/new" target="_blank" style="color:#6366f1;text-decoration:none">点击创建 Token →</a>' +
      '</div>' +
      '<input type="text" id="tokenModalInput" placeholder="github_pat_..." style="width:100%;padding:0.6rem 0.8rem;border:1px solid #cbd5e1;border-radius:8px;font-size:0.85rem;font-family:monospace;box-sizing:border-box;margin-bottom:1rem">' +
      '<div style="display:flex;gap:0.8rem;justify-content:flex-end">' +
      '<button id="tokenModalCancel" style="padding:0.5rem 1.2rem;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer;font-size:0.82rem;font-family:var(--font);color:#64748b">取消</button>' +
      '<button id="tokenModalOk" style="padding:0.5rem 1.2rem;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.82rem;font-family:var(--font)">确认发布</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    var input = document.getElementById('tokenModalInput');
    input.focus();
    document.getElementById('tokenModalCancel').onclick = function () { overlay.remove(); };
    document.getElementById('tokenModalOk').onclick = function () {
      var val = input.value.trim();
      if (!val) { input.style.borderColor = '#ef4444'; return; }
      overlay.remove();
      callback(val);
    };
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('tokenModalOk').click();
    });
  }

  function syncSharedData(silent) {
    var btn = document.getElementById('syncDataBtn');
    var origText = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '同步中...'; btn.disabled = true; }
    fetch(SHARED_DATA_URL + '?t=' + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        applySharedData(data);
        if (btn) { btn.innerHTML = '已同步'; btn.disabled = false; }
        setTimeout(function () { if (btn) btn.innerHTML = origText; }, 2000);
        if (!silent) showDataToast('数据同步完成', 'success');
      })
      .catch(function (err) {
        console.log('Sync failed: ' + err.message);
        if (btn) { btn.innerHTML = '同步失败'; btn.disabled = false; }
        setTimeout(function () { if (btn) btn.innerHTML = origText; }, 2000);
        if (!silent) showDataToast('同步失败：' + err.message + '（请检查网络连接）', 'error');
      });
  }

  function publishSharedData() {
    var token = localStorage.getItem('github_deploy_token');
    if (!token) {
      showTokenModal(function (val) {
        localStorage.setItem('github_deploy_token', val);
        doPublish(val);
      });
      return;
    }
    doPublish(token);
  }

  function doPublish(token) {
    var btn = document.getElementById('publishDataBtn');
    var origText = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '发布中...'; btn.disabled = true; }

    var allData = collectAllSharedData();
    var dataCount = Object.keys(allData).length;
    var payload = {
      version: 2,
      lastUpdated: new Date().toISOString(),
      publishedBy: localStorage.getItem('shophelp_admin_name') || 'admin',
      data: allData
    };
    var content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));

    fetch(GITHUB_API_URL, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }
    })
      .then(function (res) { return res.json(); })
      .then(function (fileInfo) {
        var body = {
          message: 'Update shared data - ' + new Date().toLocaleString('zh-CN'),
          content: content,
          sha: fileInfo.sha,
          branch: 'main'
        };
        return fetch(GITHUB_API_URL, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function () {
        if (btn) { btn.innerHTML = '已发布'; btn.disabled = false; }
        setTimeout(function () { if (btn) btn.innerHTML = origText; }, 3000);
        showDataToast('数据发布成功！共 ' + dataCount + ' 项数据已共享，其他客服同步后即可看到更新', 'success');
      })
      .catch(function (err) {
        if (btn) { btn.innerHTML = origText; btn.disabled = false; }
        if (err.message.indexOf('401') !== -1 || err.message.indexOf('403') !== -1) {
          localStorage.removeItem('github_deploy_token');
          showDataToast('Token 无效或权限不足，请重新输入', 'error');
        } else {
          showDataToast('发布失败：' + err.message + '（请检查网络连接）', 'error');
        }
      });
  }

  setTimeout(function () { syncSharedData(true); }, 2000);

  var syncBtn = document.getElementById('syncDataBtn');
  var publishBtn = document.getElementById('publishDataBtn');
  if (syncBtn) syncBtn.addEventListener('click', function () { syncSharedData(false); });
  if (publishBtn) publishBtn.addEventListener('click', publishSharedData);

})();

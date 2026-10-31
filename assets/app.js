(function () {
  "use strict";

  const cfg = window.ERROR_BOOK_CONFIG || {};
  const els = {
    className: document.getElementById("className"),
    studentId: document.getElementById("studentId"),
    studentName: document.getElementById("studentName"),
    lang: document.getElementById("lang"),
    homeworkId: document.getElementById("homeworkId"),
    formSel: document.getElementById("formSel"),
    topicSel: document.getElementById("topicSel"),
    typeSel: document.getElementById("typeSel"),
    search: document.getElementById("search"),
    qlist: document.getElementById("qlist"),
    selectedCount: document.getElementById("selectedCount"),
    submitBtn: document.getElementById("submitBtn"),
    clearBtn: document.getElementById("clearBtn"),
    banner: document.getElementById("banner"),
    catalogMeta: document.getElementById("catalogMeta"),
  };

  /** @type {Array<{id:string,form:string,topic:string,type:string,lang:string,marks:number}>} */
  let all = [];
  /** @type {Set<string>} */
  const selected = new Set();

  function showBanner(kind, text) {
    els.banner.className = "banner " + kind;
    els.banner.textContent = text;
  }

  function updateCount() {
    els.selectedCount.textContent = "已選 " + selected.size + " 題";
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Boolean))).sort(function (a, b) {
      return String(a).localeCompare(String(b), "zh-Hant");
    });
  }

  function filtered() {
    const lang = els.lang.value;
    const form = els.formSel.value;
    const topic = els.topicSel.value;
    const type = els.typeSel.value;
    const q = (els.search.value || "").trim().toLowerCase();
    return all.filter(function (item) {
      if (item.lang !== lang) return false;
      if (form && item.form !== form) return false;
      if (topic && item.topic !== topic) return false;
      if (type && item.type !== type) return false;
      if (q) {
        const hay = (item.id + " " + item.topic + " " + item.type).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function fillSelect(sel, values, keep) {
    const cur = keep ? sel.value : "";
    sel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "全部";
    sel.appendChild(opt0);
    values.forEach(function (v) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    if (cur && values.indexOf(cur) !== -1) sel.value = cur;
  }

  function refreshFilters() {
    const lang = els.lang.value;
    const base = all.filter(function (x) { return x.lang === lang; });
    fillSelect(els.formSel, uniqueSorted(base.map(function (x) { return x.form; })), true);
    const form = els.formSel.value;
    const afterForm = form ? base.filter(function (x) { return x.form === form; }) : base;
    fillSelect(els.topicSel, uniqueSorted(afterForm.map(function (x) { return x.topic; })), true);
    const topic = els.topicSel.value;
    const afterTopic = topic ? afterForm.filter(function (x) { return x.topic === topic; }) : afterForm;
    fillSelect(els.typeSel, uniqueSorted(afterTopic.map(function (x) { return x.type; })), true);
  }

  function renderList() {
    const rows = filtered();
    els.qlist.innerHTML = "";
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "qrow";
      empty.textContent = "冇符合條件嘅題目。";
      els.qlist.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    rows.slice(0, 500).forEach(function (item) {
      const row = document.createElement("label");
      row.className = "qrow";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = selected.has(item.id);
      cb.addEventListener("change", function () {
        if (cb.checked) selected.add(item.id);
        else selected.delete(item.id);
        updateCount();
      });
      const mid = document.createElement("div");
      const title = document.createElement("div");
      title.textContent = item.id;
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML =
        '<span class="badge">' + escapeHtml(item.form) + "</span>" +
        '<span class="badge">' + escapeHtml(item.topic) + "</span>" +
        '<span class="badge">' + escapeHtml(item.type) + "</span>";
      mid.appendChild(title);
      mid.appendChild(meta);
      const marks = document.createElement("div");
      marks.className = "marks";
      marks.textContent = item.marks + " 分";
      row.appendChild(cb);
      row.appendChild(mid);
      row.appendChild(marks);
      frag.appendChild(row);
    });
    if (rows.length > 500) {
      const more = document.createElement("div");
      more.className = "qrow";
      more.textContent = "只顯示前 500 題，請收窄 Form／Topic／搜尋。共 " + rows.length + " 題。";
      frag.appendChild(more);
    }
    els.qlist.appendChild(frag);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function byIdMap() {
    const m = Object.create(null);
    all.forEach(function (q) { m[q.id] = q; });
    return m;
  }

  async function submit() {
    const url = (cfg.webAppUrl || "").trim();
    if (!url || url === "YOUR_WEB_APP_URL") {
      showBanner("err", "未設定 Apps Script Web App URL。請喺 web/config.js 填入 Deploy 後嘅 /exec 網址。");
      return;
    }
    const className = els.className.value.trim();
    const studentId = els.studentId.value.trim();
    const studentName = els.studentName.value.trim();
    const homeworkId = els.homeworkId.value.trim();
    const lang = els.lang.value;
    if (!studentId) {
      showBanner("err", "請填學號（student_id）。");
      return;
    }
    if (!selected.size) {
      showBanner("err", "請至少勾選一條錯題。");
      return;
    }
    const map = byIdMap();
    const wrongIds = Array.from(selected);
    const types = [];
    const seenType = Object.create(null);
    wrongIds.forEach(function (id) {
      const q = map[id];
      if (q && q.type && !seenType[q.type]) {
        seenType[q.type] = true;
        types.push(q.type);
      }
    });

    const payload = {
      class: className,
      student_id: studentId,
      student_name: studentName,
      homework_id: homeworkId,
      wrong_ids: wrongIds.join(";"),
      wrong_types: types.join(";"),
      lang: lang,
      source: "github-pages",
    };

    els.submitBtn.disabled = true;
    showBanner("info", "提交中…");
    try {
      const res = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (_) { data = { ok: res.ok, raw: text }; }
      if (!res.ok || data.ok === false) {
        throw new Error((data && (data.error || data.message)) || text || ("HTTP " + res.status));
      }
      showBanner(
        "ok",
        "已記錄錯題。\n學號：" + studentId +
          "\n題數：" + wrongIds.length +
          "\n錯題 id：" + wrongIds.join("; ") +
          (data.row ? "\nSheet 列：" + data.row : "")
      );
      selected.clear();
      updateCount();
      renderList();
    } catch (err) {
      showBanner("err", "提交失敗：\n" + (err && err.message ? err.message : String(err)) +
        "\n\n提示：確認 Apps Script 已 Deploy → Web app（Anyone），並喺 config.js 用最新 /exec URL。");
    } finally {
      els.submitBtn.disabled = false;
    }
  }

  function wire() {
    ["lang", "formSel", "topicSel", "typeSel"].forEach(function (id) {
      els[id].addEventListener("change", function () {
        if (id === "lang" || id === "formSel") refreshFilters();
        else if (id === "topicSel") refreshFilters();
        renderList();
      });
    });
    els.search.addEventListener("input", renderList);
    els.submitBtn.addEventListener("click", submit);
    els.clearBtn.addEventListener("click", function () {
      selected.clear();
      updateCount();
      renderList();
      showBanner("info", "已清空選擇。");
    });
  }

  async function boot() {
    if (cfg.defaultHomeworkId) els.homeworkId.value = cfg.defaultHomeworkId;
    wire();
    updateCount();
    showBanner("info", "載入題庫目錄…");
    try {
      const res = await fetch("questions-catalog.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      all = data.questions || [];
      els.catalogMeta.textContent =
        "目錄：" + (data.count || all.length) + " 題（只含 metadata；中英分開）";
      refreshFilters();
      renderList();
      showBanner("ok", "題庫已載入。請填學生資料，篩選後勾選錯題，再提交。");
    } catch (err) {
      showBanner("err", "載入 questions-catalog.json 失敗：\n" + (err && err.message ? err.message : String(err)));
    }
  }

  boot();
})();

"use strict";
var PROFILES = "sybil_profiles", HISTORY = "sybil_history";

function load(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
function fmtDate(ts) { try { return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }

function mdToHtml(text) {
  var blocks = esc(text).split(/\n{2,}/);
  return blocks.map(function (b) {
    var line = b.trim();
    if (/^###\s+/.test(line)) return "<h4>" + line.replace(/^###\s+/, "") + "</h4>";
    if (/^##\s+/.test(line))  return "<h3>" + line.replace(/^##\s+/, "")  + "</h3>";
    if (/^#\s+/.test(line))   return "<h2>" + line.replace(/^#\s+/, "")   + "</h2>";
    b = b.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    return "<p>" + b.replace(/\n/g, "<br>") + "</p>";
  }).join("");
}

window.__sybilSave = function (key, text) {
  if (!text || String(text).trim().length < 60) return;
  var title = String(key).replace(/-[^-]*$/, "").replace(/[_-]+/g, " ").trim() || "Reading";
  var hist = load(HISTORY);
  var existing = hist.filter(function (h) { return h.key === key; })[0];
  if (existing) { existing.text = text; existing.ts = Date.now(); existing.title = title; }
  else { hist.unshift({ id: uid(), key: key, title: title, ts: Date.now(), text: text }); }
  hist.sort(function (a, b) { return b.ts - a.ts; });
  if (hist.length > 60) hist = hist.slice(0, 60);
  save(HISTORY, hist);
};

function exportReading(title, text) {
  var w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups to export."); return; }
  var body = mdToHtml(text);
  var doc = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) +
    '</title><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">' +
    '<style>@page{margin:22mm 20mm}*{box-sizing:border-box}body{font-family:"Jost",system-ui,sans-serif;color:#1b1813;line-height:1.6;font-size:12pt;max-width:720px;margin:0 auto;padding:24px}' +
    'h1,h2,h3,h4{font-family:"Cormorant Garamond",Georgia,serif;font-weight:400;line-height:1.15;margin:1.1em 0 .35em;color:#0E0C0A}h1{font-size:30pt;font-weight:300;letter-spacing:-.01em}h2{font-size:19pt}h3{font-size:15pt}h4{font-size:13pt}' +
    'p{margin:0 0 .7em}strong{font-weight:600}em{font-style:italic}.eyebrow{font-size:8pt;letter-spacing:.22em;text-transform:uppercase;color:#9C3F2A;font-weight:600}.rule{height:1px;background:#0E0C0A;margin:10px 0 26px}.foot{margin-top:34px;padding-top:12px;border-top:1px solid rgba(0,0,0,.15);font-size:8.5pt;letter-spacing:.18em;text-transform:uppercase;color:#8A857B}</style></head><body>' +
    '<div class="eyebrow">Sybil &middot; ' + esc(fmtDate(Date.now())) + '</div><h1>' + esc(title) + '</h1><div class="rule"></div>' +
    body + '<div class="foot">Generated with Sybil</div></body></html>';
  w.document.open(); w.document.write(doc); w.document.close();
  w.focus();
  setTimeout(function () { try { w.print(); } catch (e) {} }, 450);
}

function closeModal() { var m = document.getElementById("sybil-modal"); if (m) m.remove(); }
function openModal(titleText, buildBody) {
  closeModal();
  var ov = document.createElement("div"); ov.id = "sybil-modal"; ov.className = "sybil-ov";
  ov.addEventListener("click", function (e) { if (e.target === ov) closeModal(); });
  var card = document.createElement("div"); card.className = "sybil-card";
  var head = document.createElement("div"); head.className = "sybil-card-head";
  var h = document.createElement("div"); h.className = "sybil-card-title"; h.textContent = titleText;
  var x = document.createElement("button"); x.className = "sybil-x"; x.setAttribute("aria-label", "Close"); x.innerHTML = "&times;";
  x.onclick = closeModal;
  head.appendChild(h); head.appendChild(x);
  var bodyWrap = document.createElement("div"); bodyWrap.className = "sybil-card-body";
  card.appendChild(head); card.appendChild(bodyWrap); ov.appendChild(card);
  document.body.appendChild(ov);
  buildBody(bodyWrap);
  document.addEventListener("keydown", function onkey(e) { if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", onkey); } });
  return { ov: ov, body: bodyWrap };
}
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function summary(d) {
  if (!d) return "";
  var parts = [];
  if (d.date) parts.push(d.date);
  if (d.time) parts.push(d.time);
  if (d.place) parts.push(d.place);
  return parts.join("  ·  ");
}

function openProfiles() {
  openModal("Saved profiles", function (body) {
    body.appendChild(el("p", "sybil-note", "Save birth details once, then load them into any reading."));
    var bridge = window.__sybil || {};
    var saveRow = el("div", "sybil-saverow");
    var saveBtn = el("button", "sybil-btn-primary", "＋ Save current details");
    var cur = bridge.getF ? bridge.getF() : null;
    if (!cur || !cur.name) { saveBtn.disabled = true; saveBtn.title = "Enter a name in the birth form first"; }
    saveBtn.onclick = function () {
      var c = bridge.getF ? bridge.getF() : null;
      if (!c || !c.name) return;
      var label = window.prompt("Name this profile:", c.name || "Profile");
      if (label == null) return;
      var list = load(PROFILES);
      list.unshift({ id: uid(), label: label || c.name, data: c, ts: Date.now() });
      save(PROFILES, list);
      openProfiles();
    };
    saveRow.appendChild(saveBtn);
    body.appendChild(saveRow);
    var list = load(PROFILES);
    if (!list.length) { body.appendChild(el("div", "sybil-empty", "No saved profiles yet.")); return; }
    var ul = el("div", "sybil-list");
    list.forEach(function (p) {
      var row = el("div", "sybil-item");
      var info = el("div", "sybil-item-main");
      info.appendChild(el("div", "sybil-item-title", p.label));
      info.appendChild(el("div", "sybil-item-sub", summary(p.data)));
      var acts = el("div", "sybil-item-acts");
      var loadB = el("button", "sybil-mini", "Load");
      loadB.onclick = function () {
        var b = window.__sybil || {};
        if (b.setF) b.setF(Object.assign({}, b.DEF || {}, p.data));
        if (b.setPage) b.setPage("input");
        closeModal();
      };
      var delB = el("button", "sybil-mini sybil-mini-danger", "Delete");
      delB.onclick = function () {
        if (!confirm('Delete profile "' + p.label + '"?')) return;
        save(PROFILES, load(PROFILES).filter(function (q) { return q.id !== p.id; }));
        openProfiles();
      };
      acts.appendChild(loadB); acts.appendChild(delB);
      row.appendChild(info); row.appendChild(acts);
      ul.appendChild(row);
    });
    body.appendChild(ul);
  });
}

function openHistory() {
  openModal("Reading history", function (body) {
    var hist = load(HISTORY);
    if (!hist.length) { body.appendChild(el("div", "sybil-empty", "Your readings will be saved here automatically.")); return; }
    var ul = el("div", "sybil-list");
    hist.forEach(function (h) {
      var row = el("div", "sybil-item sybil-item-click");
      var info = el("div", "sybil-item-main");
      info.appendChild(el("div", "sybil-item-title", h.title || "Reading"));
      info.appendChild(el("div", "sybil-item-sub", fmtDate(h.ts)));
      var snip = String(h.text || "").replace(/[#*]/g, "").replace(/\s+/g, " ").slice(0, 110);
      info.appendChild(el("div", "sybil-item-snip", snip + "…"));
      info.onclick = function () { viewReading(h); };
      var acts = el("div", "sybil-item-acts");
      var delB = el("button", "sybil-mini sybil-mini-danger", "Delete");
      delB.onclick = function (e) {
        e.stopPropagation();
        if (!confirm("Delete this reading?")) return;
        save(HISTORY, load(HISTORY).filter(function (q) { return q.id !== h.id; }));
        openHistory();
      };
      acts.appendChild(delB);
      row.appendChild(info); row.appendChild(acts);
      ul.appendChild(row);
    });
    body.appendChild(ul);
  });
}

function viewReading(h) {
  openModal(h.title || "Reading", function (body) {
    var bar = el("div", "sybil-viewbar");
    var exp = el("button", "sybil-btn-primary", "⤓ Export PDF");
    exp.onclick = function () { exportReading(h.title || "Sybil Reading", h.text || ""); };
    var cp = el("button", "sybil-btn-ghost", "Copy text");
    cp.onclick = function () {
      try { navigator.clipboard.writeText(h.text || ""); cp.textContent = "Copied ✓"; setTimeout(function () { cp.textContent = "Copy text"; }, 1500); }
      catch (e) { cp.textContent = "Copy failed"; }
    };
    bar.appendChild(exp); bar.appendChild(cp);
    body.appendChild(bar);
    body.appendChild(el("div", "sybil-meta", fmtDate(h.ts)));
    var content = el("div", "sybil-reading");
    content.innerHTML = mdToHtml(h.text || "");
    body.appendChild(content);
  });
}

function injectStyles() {
  if (document.getElementById("sybil-features-style")) return;
  var st = document.createElement("style"); st.id = "sybil-features-style";
  st.textContent = [
    ".sybil-ov{position:fixed;inset:0;z-index:100000;background:rgba(10,8,14,.5);backdrop-filter:blur(3px);display:flex;justify-content:flex-end;animation:sybilFade .2s ease}",
    "@keyframes sybilFade{from{opacity:0}to{opacity:1}}",
    "@keyframes sybilSlide{from{transform:translateX(24px);opacity:.4}to{transform:none;opacity:1}}",
    ".sybil-card{width:min(460px,100%);max-height:100vh;background:var(--t-vellum);color:var(--t-ink);border-left:1px solid var(--t-hairlineStrong);display:flex;flex-direction:column;animation:sybilSlide .28s ease;font-family:'Jost',system-ui,sans-serif}",
    ".sybil-card-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--t-hairline);flex:0 0 auto}",
    ".sybil-card-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.5rem;font-weight:400;letter-spacing:-.01em}",
    ".sybil-x{font-size:26px;line-height:1;background:none;border:none;color:var(--t-inkFaint);cursor:pointer;padding:0 4px}",
    ".sybil-x:hover{color:var(--t-accent)}",
    ".sybil-card-body{padding:20px 22px;overflow-y:auto}",
    ".sybil-note{color:var(--t-inkFaint);font-size:.82rem;margin:0 0 16px;line-height:1.5}",
    ".sybil-saverow{margin-bottom:18px}",
    ".sybil-btn-primary{font-family:'Jost',system-ui,sans-serif;font-size:.72rem;font-weight:500;text-transform:uppercase;letter-spacing:.14em;padding:12px 18px;background:var(--t-ink);color:var(--t-paper);border:1px solid var(--t-ink);cursor:pointer;transition:opacity .2s}",
    ".sybil-btn-primary:hover{opacity:.82}.sybil-btn-primary:disabled{opacity:.35;cursor:not-allowed}",
    ".sybil-btn-ghost{font-family:'Jost',system-ui,sans-serif;font-size:.72rem;font-weight:500;text-transform:uppercase;letter-spacing:.14em;padding:12px 18px;background:transparent;color:var(--t-ink);border:1px solid var(--t-hairlineStrong);cursor:pointer}",
    ".sybil-btn-ghost:hover{border-color:var(--t-ink)}",
    ".sybil-empty{color:var(--t-inkFaint);font-size:.86rem;padding:28px 6px;text-align:center;border:1px dashed var(--t-hairlineStrong)}",
    ".sybil-list{display:flex;flex-direction:column;gap:2px}",
    ".sybil-item{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;padding:14px 6px;border-bottom:1px solid var(--t-hairline)}",
    ".sybil-item-click .sybil-item-main{cursor:pointer}",
    ".sybil-item-main{min-width:0;flex:1}",
    ".sybil-item-title{font-size:.95rem;font-weight:500;text-transform:capitalize}",
    ".sybil-item-sub{font-size:.72rem;color:var(--t-inkFaint);margin-top:3px;letter-spacing:.02em}",
    ".sybil-item-snip{font-size:.78rem;color:var(--t-inkLight);margin-top:6px;line-height:1.45}",
    ".sybil-item-acts{display:flex;flex-direction:column;gap:6px;flex:0 0 auto}",
    ".sybil-mini{font-size:.62rem;text-transform:uppercase;letter-spacing:.12em;padding:6px 10px;background:transparent;color:var(--t-ink);border:1px solid var(--t-hairlineStrong);cursor:pointer}",
    ".sybil-mini:hover{background:var(--t-ink);color:var(--t-paper)}",
    ".sybil-mini-danger:hover{background:var(--t-accent);border-color:var(--t-accent);color:#fff}",
    ".sybil-viewbar{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}",
    ".sybil-meta{font-size:.68rem;text-transform:uppercase;letter-spacing:.16em;color:var(--t-inkFaint);margin-bottom:14px}",
    ".sybil-reading{font-size:.92rem;line-height:1.7;color:var(--t-inkLight)}",
    ".sybil-reading h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.4rem;font-weight:400;margin:1em 0 .3em;color:var(--t-ink)}",
    ".sybil-reading h3{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.18rem;font-weight:500;margin:.9em 0 .3em;color:var(--t-ink)}",
    ".sybil-reading h4{font-size:.82rem;text-transform:uppercase;letter-spacing:.1em;margin:.9em 0 .3em;color:var(--t-inkFaint)}",
    ".sybil-reading p{margin:0 0 .8em;color:var(--t-inkLight)}",
    ".sybil-reading strong{color:var(--t-ink);font-weight:600}",
    "@media(max-width:520px){.sybil-card{width:100%;border-left:none}.sybil-ov{justify-content:stretch}}",
    "@media print{.sybil-ov{display:none!important}}"
  ].join("");
  document.head.appendChild(st);
}

function svgUser() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>'; }
function svgHist() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v3.5h3.5"/><path d="M12 8v4l3 2"/></svg>'; }

function addBtn(panel, beforeEl, id, title, svg, handler) {
  if (document.getElementById(id)) return;
  var b = document.createElement("button"); b.id = id; b.className = "sc-btn";
  b.title = title; b.setAttribute("aria-label", title); b.innerHTML = svg; b.onclick = handler;
  panel.insertBefore(b, beforeEl || null);
}

function wire() {
  var panel = document.getElementById("sybil-controls");
  if (!panel) return false;
  var themeBtn = document.getElementById("sc-theme");
  addBtn(panel, themeBtn, "sc-profiles", "Saved profiles", svgUser(), openProfiles);
  addBtn(panel, themeBtn, "sc-history",  "Reading history", svgHist(), openHistory);
  return true;
}

export function initCompanion() {
  injectStyles();
  if (wire()) return;
  var tries = 0;
  var iv = setInterval(function () { tries++; if (wire() || tries > 60) clearInterval(iv); }, 100);
}

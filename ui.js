/* FleetOS — UI toolkit: icons, table engine, forms, modals */
(function () {
  const ui = {};

  /* ---------- icons ---------- */
  const ICONS = {
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    truck: '<path d="M2 6.5h11.5v9.5H2z"/><path d="M13.5 10h3.8l3.7 3.6v2.4h-7.5z"/><circle cx="6" cy="18" r="1.7"/><circle cx="16.8" cy="18" r="1.7"/>',
    users: '<circle cx="9" cy="8" r="3.1"/><path d="M3.4 20c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2"/><circle cx="17.2" cy="9" r="2.3"/><path d="M16.3 15.3c2.7-.2 4.6 1.6 4.6 4.2"/>',
    tyre: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.3"/><path d="M12 3v5.7M12 15.3V21M3 12h5.7M15.3 12H21"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18h5.6a3.6 3.6 0 0 0 0-7.2H10a3.6 3.6 0 0 1 0-7.2h5.8"/>',
    fuel: '<path d="M5 21V6a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v15"/><path d="M4 21h12"/><path d="M15 9.5h2.5L21 13v5.5a2 2 0 0 1-2 2h-.5"/><path d="M7 9h6"/>',
    wrench: '<path d="M14.8 6.2a4.2 4.2 0 0 0 5.4 5.4L13 18.8a3.6 3.6 0 0 1-5.1 0l-.9-.9a3.6 3.6 0 0 1 0-5.1z"/><path d="M4 21l2.5-2.5"/>',
    box: '<path d="M3 8l9-4.2L21 8l-9 4.2z"/><path d="M3 8v8l9 4.2 9-4.2V8"/><path d="M12 12.2V20"/>',
    store: '<path d="M4 10v9.5h16V10"/><path d="M3 10l2-5.5h14l2 5.5"/><path d="M9.5 19.5V14h5v5.5"/>',
    receipt: '<path d="M6 3h12v18l-3-1.8-3 1.8-3-1.8L6 21z"/><path d="M9 8h6M9 12h6"/>',
    shield: '<path d="M12 3l7.5 3v6c0 4.2-3.1 7.5-7.5 9-4.4-1.5-7.5-4.8-7.5-9V6z"/><path d="M9 12l2 2 4-4"/>',
    chart: '<path d="M4 20V4.5"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5.5" rx=".6"/><rect x="12" y="8" width="3" height="9.5" rx=".6"/><rect x="17" y="10" width="3" height="7.5" rx=".6"/>',
    bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l2 2.2H4z"/><path d="M10 21h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.8a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2 2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9 2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.2 2.9z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    download: '<path d="M12 3v12"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4 19h16"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13.5h9l1-13.5"/><path d="M10 11v6M14 11v6"/>',
    edit: '<path d="M4 20h4l11-11a2.4 2.4 0 0 0-3.4-3.4L4.6 16.6z"/><path d="M13.5 6.5l4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    alert: '<path d="M12 3.5l9 16H3z"/><path d="M12 9v4.5"/><circle cx="12" cy="16.8" r=".8"/>',
    arrowleft: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  };
  ui.icon = (name, cls) =>
    `<svg class="${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.grid}</svg>`;

  ui.esc = (s) =>
    String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  /* ---------- chips ---------- */
  const TONES = {
    Active: "green", "In workshop": "amber", Idle: "grey", Disposed: "grey",
    Completed: "green", Scheduled: "blue", "In progress": "amber",
    Paid: "green", Pending: "amber", "Under review": "blue", Approved: "blue", Rejected: "red",
    Requested: "grey", "In progress ": "amber",
    Open: "amber", Closed: "green", Fitted: "green", "In store": "blue", Retired: "grey",
    High: "red", Medium: "amber", Low: "blue",
    Active: "green", "On leave": "amber", Inactive: "grey",
    Settled: "green", Submitted: "blue", Declined: "red", None: "grey",
    Received: "green", "Not required": "grey",
  };
  ui.chip = (text, tone) => {
    const t = tone || TONES[text] || "grey";
    return `<span class="chip ${t}"><span class="d"></span>${ui.esc(text)}</span>`;
  };
  ui.daysChip = (days, label) => {
    if (days === null || days === undefined) return '<span class="chip grey">—</span>';
    let tone = "green";
    if (days < 0) tone = "red";
    else if (days <= App.state.settings.alertDays) tone = "red";
    else if (days <= App.state.settings.watchDays) tone = "amber";
    const txt = days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`;
    return `<span class="chip ${tone}" title="${ui.esc(label || "")}">${txt}</span>`;
  };

  /* ---------- layout helpers ---------- */
  ui.setTitle = (title, sub) => {
    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSub").textContent = sub || "";
  };
  ui.setActions = (actions) => {
    const box = document.getElementById("topActions");
    box.innerHTML = "";
    (actions || []).forEach((a) => {
      const b = document.createElement("button");
      b.className = "btn " + (a.primary ? "primary" : a.className || "");
      b.innerHTML = (a.icon ? ui.icon(a.icon) : "") + `<span>${ui.esc(a.label)}</span>`;
      b.onclick = a.onClick;
      box.appendChild(b);
    });
  };

  /* ---------- toast ---------- */
  ui.toast = (msg, kind) => {
    const root = document.getElementById("toastRoot");
    const t = document.createElement("div");
    t.className = "toast " + (kind === "error" ? "err" : "");
    t.innerHTML = (kind === "error" ? ui.icon("alert") : ui.icon("check")) + `<span>${ui.esc(msg)}</span>`;
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(6px)"; t.style.transition = ".25s"; }, 2300);
    setTimeout(() => t.remove(), 2650);
  };

  /* ---------- modal ---------- */
  let activeModal = null;
  ui.modal = ({ title, sub, body, footer, wide, onClose }) => {
    ui.closeModal();
    const root = document.getElementById("modalRoot");
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    const box = document.createElement("div");
    box.className = "modal" + (wide ? " wide" : "");
    box.innerHTML = `
      <div class="modal-head">
        <div><h3>${ui.esc(title)}</h3>${sub ? `<p>${ui.esc(sub)}</p>` : ""}</div>
        <button class="iconbtn x" aria-label="Close">${ui.icon("x")}</button>
      </div>
      <div class="modal-body"></div>
      <div class="modal-foot"></div>`;
    const bodyEl = box.querySelector(".modal-body");
    if (typeof body === "string") bodyEl.innerHTML = body; else bodyEl.appendChild(body);
    const foot = box.querySelector(".modal-foot");
    (footer || []).forEach((f) => {
      const b = document.createElement("button");
      b.className = "btn " + (f.className || "");
      b.innerHTML = (f.icon ? ui.icon(f.icon) : "") + `<span>${ui.esc(f.label)}</span>`;
      b.onclick = f.onClick;
      foot.appendChild(b);
    });
    wrap.appendChild(box);
    root.appendChild(wrap);
    const close = () => { wrap.remove(); activeModal = null; onClose && onClose(); };
    box.querySelector(".x").onclick = close;
    wrap.addEventListener("mousedown", (e) => { if (e.target === wrap) close(); });
    const esc = (e) => { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } };
    document.addEventListener("keydown", esc);
    activeModal = { close };
    return { close, el: box, body: bodyEl, foot };
  };
  ui.closeModal = () => { if (activeModal) { activeModal.close(); activeModal = null; } };

  ui.confirm = ({ title, text, confirmLabel, onConfirm }) => {
    const body = document.createElement("div");
    body.innerHTML = `<p style="margin:0;color:var(--ink-2);font-size:13px;line-height:1.5">${ui.esc(text)}</p>`;
    const m = ui.modal({
      title,
      body,
      footer: [
        { label: "Cancel", onClick: () => m.close() },
        { label: confirmLabel || "Delete", className: "danger", icon: "trash", onClick: () => { m.close(); onConfirm(); } },
      ],
    });
  };

  /* ---------- form ---------- */
  const REF_LABEL = {
    vehicles: (v) => `${v.plate} — ${v.make} ${v.model}`,
    drivers: (d) => d.name,
    vendors: (v) => v.name,
  };

  const DEFAULTS = {
    vehicles: { status: "Active", location: "Lagos", fuelType: "Diesel" },
    drivers: { status: "Active", location: "Lagos" },
    maintenance: { status: "Scheduled", item: "Routine service" },
    fuel: {},
    trips: { status: "Requested", escort: "No", police: 0, pax: 1 },
    tyres: { status: "Fitted", position: "Front left" },
    parts: { qty: 0, minQty: 1, category: "Filters" },
    vendors: { category: "Workshop", rating: 4 },
    invoices: { status: "Pending", advice: "Pending" },
    incidents: { severity: "Low", claimStatus: "None", status: "Open", type: "Damage" },
  };

  ui.buildForm = (key, row, preset) => {
    const def = App.schema[key];
    const data = Object.assign({}, DEFAULTS[key], preset || {}, row || {});
    if (!row) {
      if ("date" in data || def.fields.some((f) => f.k === "date")) {
        if (!data.date) data.date = App.today();
      }
      if (key === "invoices" && !data.dueDate) data.dueDate = App.addDays(App.state.settings.terms || 30);
    }
    const wrap = document.createElement("form");
    wrap.className = "formgrid";
    wrap.noValidate = true;
    let lastGroup = null;
    def.fields.forEach((f) => {
      if (f.group && f.group !== lastGroup) {
        const g = document.createElement("div");
        g.className = "formgroup";
        g.textContent = f.group;
        wrap.appendChild(g);
        lastGroup = f.group;
      }
      const div = document.createElement("div");
      div.className = "field" + (f.t === "textarea" ? " full" : "");
      div.dataset.key = f.k;
      let input;
      if (f.t === "select") {
        input = document.createElement("select");
        input.innerHTML = `<option value="">—</option>` +
          (f.opts || []).map((o) => `<option value="${ui.esc(o)}">${ui.esc(o)}</option>`).join("");
      } else if (f.t === "ref") {
        input = document.createElement("select");
        const opts = (App.state[f.ref] || []).map((r) => {
          const label = REF_LABEL[f.ref] ? REF_LABEL[f.ref](r) : r.name;
          return `<option value="${r.id}">${ui.esc(label)}</option>`;
        });
        input.innerHTML = `<option value="">—</option>` + opts.join("");
      } else if (f.t === "textarea") {
        input = document.createElement("textarea");
      } else {
        input = document.createElement("input");
        input.type = f.t === "date" ? "date" : f.t === "number" ? "number" : "text";
        if (f.t === "number") input.step = "any";
      }
      input.name = f.k;
      if (data[f.k] !== undefined && data[f.k] !== null) input.value = data[f.k];
      div.innerHTML = `<label for="f-${f.k}">${ui.esc(f.l)}${f.req ? '<span class="req">*</span>' : ""}</label>`;
      input.id = "f-" + f.k;
      div.appendChild(input);
      const err = document.createElement("div");
      err.className = "err";
      div.appendChild(err);
      wrap.appendChild(div);
    });
    return wrap;
  };

  ui.collectForm = (form) => {
    const out = {};
    let firstBad = null;
    form.querySelectorAll(".field").forEach((f) => {
      const key = f.dataset.key;
      const input = f.querySelector("input,select,textarea");
      const def = (App.schema[form.dataset.key] || { fields: [] }).fields.find((x) => x.k === key);
      f.classList.remove("invalid");
      input.style.borderColor = "";
      let v = input.value;
      if (def && def.t === "number") v = v === "" ? null : Number(v);
      if (v === "" ) v = def && def.t === "ref" ? null : v;
      if (def && def.req && (v === "" || v === null)) {
        f.classList.add("invalid");
        f.querySelector(".err").textContent = "Required";
        if (!firstBad) firstBad = input;
      }
      out[key] = v === "" ? null : v;
    });
    if (firstBad) {
      firstBad.focus();
      return null;
    }
    return out;
  };

  ui.formModal = ({ key, row, preset, onSaved }) => {
    const def = App.schema[key];
    const form = ui.buildForm(key, row, preset);
    form.dataset.key = key;
    const isEdit = !!row;
    const m = ui.modal({
      title: isEdit ? `Edit ${def.singular}` : `New ${def.singular}`,
      sub: isEdit ? "Update the details and save" : `Add a ${def.singular} to ${def.title.toLowerCase()}`,
      wide: true,
      body: form,
      footer: [
        ...(isEdit ? [{
          label: "Delete", className: "danger", icon: "trash", onClick: () => {
            ui.confirm({
              title: `Delete ${def.singular}?`,
              text: "This removes the record permanently. Related history in other modules is kept but will no longer reference it.",
              onConfirm: () => {
                App.state[key] = App.state[key].filter((x) => x.id !== row.id);
                App.save(); m.close(); ui.toast("Record deleted");
                onSaved && onSaved();
              },
            });
          },
        }] : []),
        { label: "Cancel", onClick: () => m.close() },
        {
          label: isEdit ? "Save changes" : "Create", className: "primary", icon: "check",
          onClick: () => {
            const values = ui.collectForm(form);
            if (!values) return;
            if (isEdit) Object.assign(row, values);
            else App.state[key].push(Object.assign({ id: App.uid(key.slice(0, 3).toUpperCase()) }, values));
            App.save();
            m.close();
            ui.toast(isEdit ? "Changes saved" : `${def.singular[0].toUpperCase() + def.singular.slice(1)} created`);
            onSaved && onSaved();
          },
        },
      ],
    });
    setTimeout(() => { const i = form.querySelector("input,select,textarea"); i && i.focus(); }, 60);
  };

  /* ---------- generic list ---------- */
  ui.list = (cfg) => {
    ui.setTitle(cfg.title, cfg.sub);
    ui.setActions(cfg.actions || []);
    const view = document.getElementById("view");
    const rows = () => App.state[cfg.key] || [];
    let query = "";
    let filters = {};
    let sort = cfg.sort || null;

    const filtersHtml = (cfg.filters || []).map((f, i) => {
      const opts = typeof f.opts === "function" ? f.opts() : f.opts;
      return `
      <select class="filter" data-fi="${i}">
        <option value="">${ui.esc(f.label)}</option>
        ${opts.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lab = typeof o === "string" ? o : o.label;
          return `<option value="${ui.esc(val)}">${ui.esc(lab)}</option>`;
        }).join("")}
      </select>`;
    }).join("");

    view.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <div class="search">${ui.icon("search")}<input placeholder="Search ${ui.esc(cfg.title.toLowerCase())}…" /></div>
          ${filtersHtml}
          <span class="count"></span>
          <button class="btn sm" data-act="csv">${ui.icon("download")}<span>CSV</span></button>
        </div>
        <div class="tablewrap">
          <table>
            <thead><tr>${cfg.columns.map((c) => `<th class="${c.num ? "num" : ""} ${c.sortKey ? "sortable" : ""}" ${c.sortKey ? `data-sort="${c.sortKey}"` : ""}>${ui.esc(c.h)}${c.sortKey ? '<span class="arrow">↕</span>' : ""}</th>`).join("")}</tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>`;

    const tbody = view.querySelector("tbody");
    const count = view.querySelector(".count");

    const paint = () => {
      let data = rows();
      if (query.trim()) {
        const q = query.toLowerCase();
        data = data.filter((r) => (cfg.searchText ? cfg.searchText(r) : JSON.stringify(r)).toLowerCase().includes(q));
      }
      (cfg.filters || []).forEach((f, i) => {
        const v = filters[i];
        if (v) data = data.filter((r) => String(f.get(r)) === v);
      });
      if (sort && sort.key) {
        const get = typeof sort.key === "function" ? sort.key : (r) => r[sort.key];
        data = data.slice().sort((a, b) => {
          const x = get(a), y = get(b);
          const n = (x === null || x === undefined) ? -Infinity : x;
          const m = (y === null || y === undefined) ? -Infinity : y;
          const cmp = typeof n === "number" && typeof m === "number" ? n - m : String(n).localeCompare(String(m));
          return sort.dir === -1 ? -cmp : cmp;
        });
      }
      count.textContent = `${data.length} of ${rows().length} ${rows().length === 1 ? "record" : "records"}`;
      if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="${cfg.columns.length}">
          <div class="empty">
            <div class="art">${ui.icon(cfg.icon || "box")}</div>
            <h4>${rows().length ? "Nothing matches those filters" : `No ${ui.esc(cfg.title.toLowerCase())} yet`}</h4>
            <p>${rows().length ? "Try clearing the search or filters." : ui.esc(cfg.emptyText || "Add your first record to get started.")}</p>
          </div></td></tr>`;
        return;
      }
      tbody.innerHTML = data.map((r) => `
        <tr class="clickable" data-id="${r.id}">
          ${cfg.columns.map((c) => `<td class="${c.num ? "num" : ""}">${c.render(r)}</td>`).join("")}
        </tr>`).join("");
    };

    view.querySelector(".search input").addEventListener("input", (e) => { query = e.target.value; paint(); });
    view.querySelectorAll("select.filter").forEach((s, i) => {
      s.addEventListener("change", () => { filters[i] = s.value; paint(); });
    });
    view.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const k = th.dataset.sort;
        if (sort && sort.key === k) sort.dir = sort.dir === 1 ? -1 : 1;
        else sort = { key: k, dir: 1 };
        paint();
      });
    });
    tbody.addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      const row = rows().find((r) => r.id === tr.dataset.id);
      if (!row) return;
      if (cfg.onRow) cfg.onRow(row); else ui.formModal({ key: cfg.key, row, onSaved: () => paint() });
    });
    view.querySelector('[data-act="csv"]').onclick = () => {
      const mapped = rows().map(cfg.csv || ((r) => r));
      App.download(`${cfg.key}-${App.today()}.csv`, App.toCSV(mapped));
      ui.toast("CSV downloaded");
    };
    paint();
  };

  window.App = window.App || {};
  App.ui = ui;
})();

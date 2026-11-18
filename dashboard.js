/* FleetOS — dashboard, alerts and reports */
(function () {
  const ui = App.ui;
  const $ = (id) => document.getElementById(id);

  /* ---------- small chart helpers ---------- */
  function donut(segments, total, centerVal, centerLabel) {
    const size = 132, stroke = 15, r = (size - stroke) / 2 - 2;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const rings = segments.map((s) => {
      const frac = total ? s.value / total : 0;
      const len = frac * c;
      const el = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}"
        stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${size / 2} ${size / 2})"
        stroke-linecap="butt"><title>${ui.esc(s.label)}: ${s.value}</title></circle>`;
      offset += len;
      return el;
    }).join("");
    return `<div class="donut">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#eef2f7" stroke-width="${stroke}"/>
        ${rings}
      </svg>
      <div class="center"><b>${centerVal}</b><span>${ui.esc(centerLabel)}</span></div>
    </div>`;
  }

  const COLOR = { Active: "#12a594", "In workshop": "#f5a524", Idle: "#94a3b8", Disposed: "#dbe3ee" };

  /* ---------- derived aggregates ---------- */
  function monthSpend(keys) {
    return keys.map((k) => {
      const inMonth = (d) => (d || "").slice(0, 7) === k;
      const maint = App.state.maintenance.filter((m) => inMonth(m.date) && m.status === "Completed")
        .reduce((s, m) => s + Number(m.cost || 0), 0);
      const fuel = App.state.fuel.filter((f) => inMonth(f.date)).reduce((s, f) => s + Number(f.cost || 0), 0);
      const tyres = App.state.tyres.filter((t) => inMonth(t.installed)).reduce((s, t) => s + Number(t.cost || 0), 0);
      const incidents = App.state.incidents.filter((i) => inMonth(i.date)).reduce((s, i) => s + Number(i.cost || 0), 0);
      return { key: k, label: App.monthLabel(k), maint, fuel, other: tyres + incidents, total: maint + fuel + tyres + incidents };
    });
  }

  function totalCost(vId) {
    return App.vehicleCosts(vId).total;
  }

  /* ---------- dashboard ---------- */
  App.renderDashboard = function () {
    ui.setTitle("Dashboard", `${App.state.settings.company} · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`);
    ui.setActions([
      { label: "Log fuel", icon: "fuel", onClick: () => ui.formModal({ key: "fuel", onSaved: () => App.renderDashboard() }) },
      { label: "New trip", icon: "route", onClick: () => ui.formModal({ key: "trips", onSaved: () => App.renderDashboard() }) },
      { label: "Add vehicle", icon: "plus", className: "primary", onClick: () => { location.hash = "#/vehicles"; setTimeout(() => ui.formModal({ key: "vehicles", onSaved: () => App.renderDashboard() }), 120); } },
    ]);

    const s = App.state;
    const vehicles = s.vehicles;
    const active = vehicles.filter((v) => v.status === "Active").length;
    const workshop = vehicles.filter((v) => v.status === "In workshop").length;
    const idle = vehicles.filter((v) => v.status === "Idle").length;
    const alerts = App.alerts();
    const critical = alerts.filter((a) => a.severity === "red").length;
    const watch = alerts.filter((a) => a.severity !== "blue").length;

    const serviceDue = vehicles.filter((v) => {
      const ns = App.nextService(v.id);
      return ns && App.daysUntil(ns) <= 14;
    }).length;
    const serviceOverdue = vehicles.filter((v) => {
      const ns = App.nextService(v.id);
      return ns && App.daysUntil(ns) < 0;
    }).length;

    const openInvoices = s.invoices.filter((i) => !["Paid", "Rejected"].includes(i.status));
    const outstanding = openInvoices.reduce((sum, i) => sum + (Number(i.amount || 0) - Number(i.paid || 0)), 0);
    const overdueCount = openInvoices.filter((i) => i.dueDate && App.daysUntil(i.dueDate) < 0).length;

    const keys = App.monthKeys(6);
    const spend = monthSpend(keys);
    const thisMonth = spend[spend.length - 1].total;
    const lastMonth = spend[spend.length - 2] ? spend[spend.length - 2].total : 0;
    const delta = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
    const utilisation = vehicles.length ? Math.round((active / vehicles.length) * 100) : 0;

    const statusSegs = App.VEHICLE_STATUS.map((st) => ({
      label: st, value: vehicles.filter((v) => v.status === st).length, color: COLOR[st],
    }));

    const eff = vehicles.map((v) => App.fuelEfficiency(v.id)).filter((x) => x);
    const avgEff = eff.length ? eff.reduce((a, b) => a + b, 0) / eff.length : 0;
    const openIncidents = s.incidents.filter((i) => i.status === "Open").length;

    const maxSpend = Math.max(1, ...spend.map((m) => m.total));
    const chart = `
      <div class="bars">
        ${spend.map((m) => {
          const h = Math.round((m.total / maxSpend) * 128);
          const seg = (v) => (m.total ? Math.round((v / m.total) * h) : 0);
          return `<div class="barcol" title="${m.label}: ${App.money0(m.total)}">
            <div class="barvalue">${m.total ? Math.round(m.total / 1000) + "k" : ""}</div>
            <div class="barstack" style="height:128px">
              <div class="barseg" style="height:${seg(m.other)}px;background:#94a3b8"></div>
              <div class="barseg" style="height:${seg(m.fuel)}px;background:#2f6fed"></div>
              <div class="barseg" style="height:${seg(m.maint)}px;background:#12a594"></div>
            </div>
            <div class="barlabel">${m.label}</div>
          </div>`;
        }).join("")}
      </div>
      <div class="legendrow">
        <span><i style="background:#12a594"></i>Maintenance</span>
        <span><i style="background:#2f6fed"></i>Fuel</span>
        <span><i style="background:#94a3b8"></i>Tyres & incidents</span>
      </div>`;

    const topVehicles = vehicles
      .map((v) => ({ v, cost: totalCost(v.id) }))
      .filter((x) => x.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
    const maxCost = Math.max(1, ...topVehicles.map((x) => x.cost));

    const recentTrips = s.trips.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

    $("view").innerHTML = `
      ${vehicles.length ? "" : `<div class="card" style="margin-bottom:16px">
        <div class="card-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div class="iconbox">${ui.icon("truck")}</div>
          <div style="flex:1;min-width:220px">
            <b>Your fleet register is empty</b>
            <div class="note">Add a vehicle to start tracking compliance, fuel, maintenance and cost per kilometre.</div>
          </div>
          <button class="btn primary" id="getStarted">${ui.icon("plus")}<span>Add first vehicle</span></button>
        </div>
      </div>`}
      <div class="kpis">
        <div class="kpi">
          <div class="top"><span class="ico">${ui.icon("truck")}</span>FLEET SIZE</div>
          <div class="val">${vehicles.length}</div>
          <div class="sub"><b>${active}</b> active · ${workshop} in workshop · ${idle} idle</div>
        </div>
        <div class="kpi ${critical ? "bad" : "ok"}">
          <div class="top"><span class="ico">${ui.icon("shield")}</span>COMPLIANCE ALERTS</div>
          <div class="val">${watch}</div>
          <div class="sub"><b>${critical}</b> critical · documents &amp; driver records</div>
        </div>
        <div class="kpi ${serviceDue ? "warn" : "ok"}">
          <div class="top"><span class="ico">${ui.icon("wrench")}</span>SERVICE DUE</div>
          <div class="val">${serviceDue}</div>
          <div class="sub">${serviceOverdue ? `<b>${serviceOverdue}</b> overdue · ` : ""}next 14 days</div>
        </div>
        <div class="kpi ${overdueCount ? "bad" : ""}">
          <div class="top"><span class="ico">${ui.icon("receipt")}</span>OUTSTANDING</div>
          <div class="val" style="font-size:23px">${App.money0(outstanding)}</div>
          <div class="sub">${openInvoices.length} open invoices · ${overdueCount} overdue</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Spend by month</h3><span class="hint">last 6 months</span></div>
          <div class="card-body">${chart}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Fleet status</h3><span class="hint">${utilisation}% active</span></div>
          <div class="card-body">
            <div class="donut-wrap">
              ${donut(statusSegs, vehicles.length, vehicles.length, "vehicles")}
              <div class="legend">
                ${statusSegs.map((sg) => `<div class="li"><span class="sw" style="background:${sg.color}"></span>${sg.label}<span class="v">${sg.value}</span></div>`).join("")}
              </div>
            </div>
            <div class="mini-legend" style="margin-top:14px;border-top:1px solid var(--line-2);padding-top:12px">
              <span>Avg fuel economy <b>${avgEff ? avgEff.toFixed(1) + " km/L" : "—"}</b></span>
              <span>Open incidents <b>${openIncidents}</b></span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Action centre</h3><a class="hint" href="#/alerts">View all ${alerts.length} →</a></div>
          <div class="alert-list">
            ${alerts.length ? alerts.slice(0, 6).map((a) => `
              <div class="alert-row" data-go="${a.module}" data-id="${a.id}">
                <span class="sev ${a.severity}"></span>
                <div class="alert-body">
                  <div class="alert-title">${ui.esc(a.title)}</div>
                  <div class="alert-meta">${ui.esc(a.detail)}</div>
                </div>
                <span class="alert-tag">${ui.esc(a.tag)}</span>
              </div>`).join("") : `<div class="empty" style="padding:34px"><div class="art">${ui.icon("check")}</div><h4>All clear</h4><p>No compliance, service or payment alerts.</p></div>`}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Costliest vehicles</h3><span class="hint">all time</span></div>
          <div class="card-body" style="padding-top:6px">
            ${topVehicles.map(({ v, cost }) => `
              <div style="padding:9px 0;border-bottom:1px solid var(--line-2)">
                <div style="display:flex;justify-content:space-between;gap:10px;font-size:12.5px;margin-bottom:5px">
                  <span><b>${ui.esc(v.plate)}</b> <span style="color:var(--muted)">${ui.esc(v.make)} ${ui.esc(v.model)}</span></span>
                  <span class="mono" style="font-weight:600">${App.money0(cost)}</span>
                </div>
                <div style="height:5px;background:#eef2f7;border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${Math.round((cost / maxCost) * 100)}%;background:linear-gradient(90deg,#12a594,#2f6fed);border-radius:4px"></div>
                </div>
              </div>`).join("") || `<div class="note">No costs recorded yet.</div>`}
            <div class="note" style="margin-top:12px">This month: <b>${App.money0(thisMonth)}</b> ${lastMonth ? `· ${delta >= 0 ? "+" : ""}${delta}% vs last month` : ""}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Recent trips</h3><a class="hint" href="#/trips">All trips →</a></div>
        <div class="tablewrap" style="margin-top:10px">
          <table>
            <thead><tr><th>Date</th><th>Vehicle</th><th>Driver</th><th>Client / route</th><th class="num">Distance</th><th>Status</th></tr></thead>
            <tbody>
              ${recentTrips.map((t) => {
                const v = App.vehicle(t.vehicleId), d = App.driver(t.driverId);
                return `<tr class="clickable" data-go="trips" data-id="${t.id}">
                  <td class="nowrap">${App.fmtDate(t.date)}</td>
                  <td><div class="cell-main">${v ? ui.esc(v.plate) : "—"}</div><div class="cell-sub">${v ? ui.esc(v.make + " " + v.model) : ""}</div></td>
                  <td>${d ? ui.esc(d.name) : "—"}</td>
                  <td><div class="cell-main">${ui.esc(t.client || "—")}</div><div class="cell-sub">${ui.esc((t.origin || "?") + " → " + (t.destination || "?"))}</div></td>
                  <td class="num mono">${t.km ? App.num(t.km) + " km" : "—"}</td>
                  <td>${ui.chip(t.status)}</td>
                </tr>`;
              }).join("") || `<tr><td colspan="6"><div class="empty" style="padding:30px"><p>No trips logged yet.</p></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    const gs = $("view").querySelector("#getStarted");
    if (gs) gs.onclick = () => ui.formModal({ key: "vehicles", onSaved: () => App.renderDashboard() });

    $("view").querySelectorAll("[data-go]").forEach((el) => {
      el.addEventListener("click", () => {
        const mod = el.dataset.go, id = el.dataset.id;
        if (mod === "vehicles") location.hash = `#/vehicles/${id}`;
        else if (mod === "maintenance") {
          const m = App.state.maintenance.find((x) => x.vehicleId === id && x.status !== "Completed");
          location.hash = "#/maintenance";
          if (m) setTimeout(() => ui.formModal({ key: "maintenance", row: m, onSaved: () => App.renderMaintenance() }), 100);
        } else {
          location.hash = `#/${mod}`;
          const rec = (App.state[mod] || []).find((x) => x.id === id);
          if (rec) setTimeout(() => ui.formModal({ key: mod, row: rec, onSaved: () => App.route() }), 100);
        }
      });
    });
  };

  /* ---------- alerts page ---------- */
  App.renderAlerts = function () {
    ui.setTitle("Alerts", "Compliance, servicing, stock, payments and incidents");
    ui.setActions([{ label: "Refresh", icon: "clock", onClick: () => App.renderAlerts() }]);
    const all = App.alerts();
    const state = { filter: "all" };

    const draw = () => {
      const list = all.filter((a) => state.filter === "all" ? true : state.filter === "red" ? a.severity === "red" : a.severity !== "blue");
      const counts = {
        all: all.length,
        red: all.filter((a) => a.severity === "red").length,
        open: all.filter((a) => a.severity !== "blue").length,
      };
      $("view").innerHTML = `
        <div class="page-head">
          <div class="pill-tabs">
            <button data-f="all" class="${state.filter === "all" ? "on" : ""}">All ${counts.all}</button>
            <button data-f="red" class="${state.filter === "red" ? "on" : ""}">Critical ${counts.red}</button>
            <button data-f="open" class="${state.filter === "open" ? "on" : ""}">Needs action ${counts.open}</button>
          </div>
        </div>
        <div class="card">
          <div class="alert-list">
            ${list.length ? list.map((a) => `
              <div class="alert-row" data-go="${a.module}" data-id="${a.id}">
                <span class="sev ${a.severity}"></span>
                <div class="alert-body">
                  <div class="alert-title">${ui.esc(a.title)}</div>
                  <div class="alert-meta">${ui.esc(a.detail)}</div>
                </div>
                <span class="alert-tag">${ui.esc(a.tag)}</span>
              </div>`).join("") : `<div class="empty"><div class="art">${ui.icon("check")}</div><h4>Nothing to action</h4><p>All documents, services and payments are within limits.</p></div>`}
          </div>
        </div>`;
      $("view").querySelectorAll(".pill-tabs button").forEach((b) => b.onclick = () => { state.filter = b.dataset.f; draw(); });
      $("view").querySelectorAll("[data-go]").forEach((el) => el.onclick = () => {
        const mod = el.dataset.go;
        location.hash = `#/${mod}`;
        const rec = (App.state[mod] || []).find((x) => x.id === el.dataset.id);
        if (rec) setTimeout(() => ui.formModal({ key: mod, row: rec, onSaved: () => App.renderAlerts() }), 100);
      });
    };
    draw();
  };

  /* ---------- reports ---------- */
  App.renderReports = function () {
    ui.setTitle("Reports", "Cost of ownership, consumption and spend");
    ui.setActions([]);

    const period = { months: 6 };
    const keys = App.monthKeys(period.months);
    const spend = monthSpend(keys);

    const tco = App.state.vehicles.map((v) => {
      const c = App.vehicleCosts(v.id);
      const km = App.tripsFor(v.id).filter((t) => t.status === "Completed").reduce((s, t) => s + Number(t.km || 0), 0);
      const litres = App.fuelFor(v.id).reduce((s, f) => s + Number(f.litres || 0), 0);
      return { v, ...c, km, litres, perKm: km ? c.total / km : null, eff: App.fuelEfficiency(v.id) };
    }).sort((a, b) => b.total - a.total);

    const totalFleet = tco.reduce((s, r) => s + r.total, 0);
    const totalKm = tco.reduce((s, r) => s + r.km, 0);
    const totalLitres = tco.reduce((s, r) => s + r.litres, 0);

    $("view").innerHTML = `
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi"><div class="top">TOTAL FLEET COST</div><div class="val" style="font-size:23px">${App.money0(totalFleet)}</div><div class="sub">maintenance, fuel, tyres, incidents</div></div>
        <div class="kpi"><div class="top">DISTANCE RECORDED</div><div class="val">${App.num(totalKm)}<span style="font-size:13px;font-weight:500;color:var(--muted)"> km</span></div><div class="sub">completed trips</div></div>
        <div class="kpi"><div class="top">FUEL CONSUMED</div><div class="val">${App.num(totalLitres)}<span style="font-size:13px;font-weight:500;color:var(--muted)"> L</span></div><div class="sub">all fills on record</div></div>
        <div class="kpi"><div class="top">FLEET COST / KM</div><div class="val" style="font-size:23px">${totalKm ? App.money0(totalFleet / totalKm) : "—"}</div><div class="sub">per completed kilometre</div></div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-head"><h3>Total cost of ownership by vehicle</h3><span class="hint">all records</span></div>
        <div class="tablewrap" style="margin-top:10px">
          <table class="report-table">
            <thead><tr>
              <th>Vehicle</th><th class="num">Distance</th><th class="num">Fuel (L)</th><th class="num">Fuel cost</th>
              <th class="num">Maintenance</th><th class="num">Tyres</th><th class="num">Incidents</th><th class="num">Total</th>
              <th class="num">Cost / km</th><th class="num">km / L</th>
            </tr></thead>
            <tbody>
              ${tco.map((r) => `<tr>
                <td><div class="cell-main">${ui.esc(r.v.plate)}</div><div class="cell-sub">${ui.esc(r.v.make + " " + r.v.model)}</div></td>
                <td class="num mono">${App.num(r.km)}</td>
                <td class="num mono">${App.num(r.litres)}</td>
                <td class="num mono">${App.money0(r.fuel)}</td>
                <td class="num mono">${App.money0(r.maint)}</td>
                <td class="num mono">${App.money0(r.tyres)}</td>
                <td class="num mono">${App.money0(r.incidents)}</td>
                <td class="num mono" style="font-weight:700">${App.money0(r.total)}</td>
                <td class="num mono">${r.perKm ? App.money0(r.perKm) : "—"}</td>
                <td class="num mono">${r.eff ? r.eff.toFixed(1) : "—"}</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="split">
        <div class="card">
          <div class="card-head"><h3>Spend by month</h3><button class="btn sm" data-csv="spend" style="margin-left:auto">${ui.icon("download")}<span>CSV</span></button></div>
          <div class="tablewrap" style="margin-top:10px">
            <table>
              <thead><tr><th>Month</th><th class="num">Maintenance</th><th class="num">Fuel</th><th class="num">Other</th><th class="num">Total</th></tr></thead>
              <tbody>${spend.map((m) => `<tr>
                <td>${m.label}</td><td class="num mono">${App.money0(m.maint)}</td><td class="num mono">${App.money0(m.fuel)}</td>
                <td class="num mono">${App.money0(m.other)}</td><td class="num mono" style="font-weight:700">${App.money0(m.total)}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Fuel economy</h3><span class="hint">from consecutive fills</span></div>
          <div class="tablewrap" style="margin-top:10px">
            <table>
              <thead><tr><th>Vehicle</th><th class="num">Litres</th><th class="num">km / L</th><th class="num">Cost / L</th></tr></thead>
              <tbody>${tco.filter((r) => r.litres > 0).map((r) => `<tr>
                <td>${ui.esc(r.v.plate)}</td>
                <td class="num mono">${App.num(r.litres)}</td>
                <td class="num mono">${r.eff ? r.eff.toFixed(1) : "—"}</td>
                <td class="num mono">${App.money0(r.fuel / r.litres)}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </div>
      </div>`;

    $("view").querySelector('[data-csv="spend"]').onclick = () => {
      App.download(`spend-by-month-${App.today()}.csv`, App.toCSV(spend));
      ui.toast("CSV downloaded");
    };
  };
})();

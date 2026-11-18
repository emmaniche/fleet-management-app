/* FleetOS — router, navigation, module screens, vehicle detail, settings */
(function () {
  const ui = App.ui;
  const el = (id) => document.getElementById(id);
  const view = () => el("view");
  const go = (hash) => { location.hash = hash; };

  /* state must exist before module configs are built */
  App.load();

  /* ================= navigation ================= */
  const NAV = [
    { group: "Overview", items: [
      { key: "dashboard", label: "Dashboard", icon: "grid" },
      { key: "alerts", label: "Alerts", icon: "bell", count: () => App.alerts().length },
    ]},
    { group: "Fleet", items: [
      { key: "vehicles", label: "Vehicles", icon: "truck" },
      { key: "drivers", label: "Drivers", icon: "users" },
      { key: "tyres", label: "Tyres", icon: "tyre" },
      { key: "trips", label: "Trips", icon: "route" },
      { key: "fuel", label: "Fuel", icon: "fuel" },
      { key: "maintenance", label: "Maintenance", icon: "wrench" },
    ]},
    { group: "Business", items: [
      { key: "invoices", label: "Invoices", icon: "receipt" },
      { key: "vendors", label: "Vendors", icon: "store" },
      { key: "parts", label: "Inventory", icon: "box" },
      { key: "incidents", label: "Incidents", icon: "shield" },
    ]},
    { group: "Analysis", items: [
      { key: "reports", label: "Reports", icon: "chart" },
    ]},
  ];

  function renderNav() {
    const nav = el("nav");
    nav.innerHTML = NAV.map((g) => `
      <div class="navgroup">${ui.esc(g.group)}</div>
      ${g.items.map((it) => {
        const n = it.count ? it.count() : 0;
        return `<button class="navitem" data-nav="${it.key}">${ui.icon(it.icon)}<span>${ui.esc(it.label)}</span>${n ? `<span class="count">${n}</span>` : ""}</button>`;
      }).join("")}
    `).join("");
    nav.querySelectorAll("[data-nav]").forEach((b) => {
      b.onclick = () => { go("#/" + b.dataset.nav); closeSidebar(); };
    });
    const sn = el("settingsNav");
    sn.innerHTML = ui.icon("settings") + "<span>Settings</span>";
    sn.onclick = () => { go("#/settings"); closeSidebar(); };
  }

  function setActive(key) {
    document.querySelectorAll("[data-nav]").forEach((b) => {
      b.classList.toggle("active", b.dataset.nav === key);
    });
  }

  function closeSidebar() { el("sidebar").classList.remove("open"); }

  /* ================= csv mappers ================= */
  const vehicleCsv = (r) => ({
    "Fleet no": r.code, Plate: r.plate, Make: r.make, Model: r.model, Year: r.year,
    Type: r.type, Status: r.status, Base: r.location,
    Driver: (App.driver(r.driverId) || {}).name || "",
    Odometer: r.odometer, "Fuel type": r.fuelType, "Tank (L)": r.tank,
    "Date acquired": r.acquired, Licence: r.licence, Roadworthy: r.roadworthy,
    Insurance: r.insurance, CMR: r.cmr, Hackney: r.hackney,
    "Proof of ownership": r.ownership, Notes: r.notes,
  });

  /* ================= module configs ================= */
  const MODULES = {
    vehicles: {
      key: "vehicles", title: "Vehicles", sub: App.schema.vehicles.sub, icon: "truck",
      actions: [{ label: "Add vehicle", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "vehicles", onSaved: route }) }],
      sort: { key: "code", dir: 1 },
      columns: [
        { h: "Fleet no.", sortKey: "code", render: (r) => `<div class="cell-main">${ui.esc(r.code || "—")}</div><div class="cell-sub">${ui.esc(r.plate || "")}</div>` },
        { h: "Vehicle", sortKey: "make", render: (r) => `<div class="cell-main">${ui.esc(r.make || "")} ${ui.esc(r.model || "")}</div><div class="cell-sub">${ui.esc([r.year, r.type].filter(Boolean).join(" · "))}</div>` },
        { h: "Status", sortKey: "status", render: (r) => ui.chip(r.status) },
        { h: "Driver", render: (r) => { const d = App.driver(r.driverId); return d ? ui.esc(d.name) : '<span style="color:var(--muted)">Unassigned</span>'; } },
        { h: "Base", sortKey: "location", render: (r) => ui.esc(r.location || "—") },
        { h: "Odometer", num: true, sortKey: "odometer", render: (r) => `<span class="mono">${App.num(r.odometer)}</span> <span style="color:var(--muted)">km</span>` },
        { h: "Next service", render: (r) => { const n = App.nextService(r.id); return n ? ui.daysChip(App.daysUntil(n), n) : '<span class="chip grey">—</span>'; } },
        { h: "Compliance", render: (r) => { const w = App.worstDoc(r); return w ? ui.daysChip(w.days, w.l + " · " + App.fmtDate(w.date)) : '<span class="chip grey">—</span>'; } },
      ],
      filters: [
        { label: "All statuses", opts: App.VEHICLE_STATUS, get: (r) => r.status },
        { label: "All bases", opts: App.LOCATIONS, get: (r) => r.location },
        { label: "All types", opts: App.VEHICLE_TYPES, get: (r) => r.type },
      ],
      searchText: (r) => [r.code, r.plate, r.make, r.model, r.year, r.type, r.location, r.status, (App.driver(r.driverId) || {}).name].join(" "),
      csv: vehicleCsv,
      onRow: (r) => go("#/vehicles/" + r.id),
    },

    drivers: {
      key: "drivers", title: "Drivers", sub: App.schema.drivers.sub, icon: "users",
      actions: [{ label: "Add driver", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "drivers", onSaved: route }) }],
      sort: { key: "name", dir: 1 },
      columns: [
        { h: "Driver", sortKey: "name", render: (r) => `<div class="cell-main">${ui.esc(r.name)}</div><div class="cell-sub">${ui.esc(r.phone || "")}</div>` },
        { h: "Licence no.", render: (r) => `<span class="mono">${ui.esc(r.licenceNo || "—")}</span>` },
        { h: "Licence expiry", render: (r) => `<div class="nowrap">${App.fmtDate(r.licenceExpiry)}</div><div style="margin-top:4px">${ui.daysChip(App.daysUntil(r.licenceExpiry))}</div>` },
        { h: "Medical", render: (r) => `<div class="nowrap">${App.fmtDate(r.medicalExpiry)}</div><div style="margin-top:4px">${ui.daysChip(App.daysUntil(r.medicalExpiry))}</div>` },
        { h: "Base", sortKey: "location", render: (r) => ui.esc(r.location || "—") },
        { h: "Vehicles", num: true, render: (r) => App.num(App.state.vehicles.filter((v) => v.driverId === r.id).length) },
        { h: "Status", sortKey: "status", render: (r) => ui.chip(r.status) },
      ],
      filters: [
        { label: "All statuses", opts: ["Active", "On leave", "Inactive"], get: (r) => r.status },
        { label: "All bases", opts: App.LOCATIONS, get: (r) => r.location },
      ],
      searchText: (r) => [r.name, r.phone, r.licenceNo, r.location, r.status, r.notes].join(" "),
      csv: (r) => ({
        Name: r.name, Phone: r.phone, "Licence no": r.licenceNo, "Licence expiry": r.licenceExpiry,
        "Medical expiry": r.medicalExpiry, Base: r.location, Status: r.status, Notes: r.notes,
      }),
    },

    maintenance: {
      key: "maintenance", title: "Maintenance", sub: App.schema.maintenance.sub, icon: "wrench",
      actions: [{ label: "New work order", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "maintenance", onSaved: route }) }],
      sort: { key: "date", dir: -1 },
      columns: [
        { h: "Date", sortKey: "date", render: (r) => App.fmtDate(r.date) },
        { h: "Vehicle", render: (r) => { const v = App.vehicle(r.vehicleId); return v ? `<div class="cell-main">${ui.esc(v.plate)}</div><div class="cell-sub">${ui.esc(v.make + " " + v.model)}</div>` : "—"; } },
        { h: "Item", sortKey: "item", render: (r) => ui.esc(r.item || "—") },
        { h: "Workshop", render: (r) => { const w = App.vendor(r.vendorId); return w ? ui.esc(w.name) : "—"; } },
        { h: "Status", sortKey: "status", render: (r) => ui.chip(r.status) },
        { h: "Next due", render: (r) => r.nextDue ? `<div class="nowrap">${App.fmtDate(r.nextDue)}</div><div style="margin-top:4px">${ui.daysChip(App.daysUntil(r.nextDue))}</div>` : "—" },
        { h: "Cost", num: true, sortKey: "cost", render: (r) => App.money0(r.cost) },
      ],
      filters: [
        { label: "All statuses", opts: App.MAINT_STATUS, get: (r) => r.status },
        { label: "All vehicles", opts: () => App.state.vehicles.map((v) => ({ value: v.id, label: v.plate })), get: (r) => r.vehicleId },
      ],
      searchText: (r) => [r.item, r.parts, r.notes, r.status, App.vehicleShort(r.vehicleId), (App.vendor(r.vendorId) || {}).name].join(" "),
      csv: (r) => ({
        Date: r.date, Vehicle: App.vehicleShort(r.vehicleId), Item: r.item, Status: r.status,
        Workshop: (App.vendor(r.vendorId) || {}).name || "", Odometer: r.odometer,
        Cost: r.cost, Parts: r.parts, "Next due": r.nextDue, Notes: r.notes,
      }),
    },

    fuel: {
      key: "fuel", title: "Fuel", sub: App.schema.fuel.sub, icon: "fuel",
      actions: [{ label: "Log fuel", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "fuel", onSaved: route }) }],
      sort: { key: "date", dir: -1 },
      columns: [
        { h: "Date", sortKey: "date", render: (r) => App.fmtDate(r.date) },
        { h: "Vehicle", render: (r) => { const v = App.vehicle(r.vehicleId); return v ? `<div class="cell-main">${ui.esc(v.plate)}</div><div class="cell-sub">${ui.esc(v.make + " " + v.model)}</div>` : "—"; } },
        { h: "Driver", render: (r) => { const d = App.driver(r.driverId); return d ? ui.esc(d.name) : "—"; } },
        { h: "Litres", num: true, sortKey: "litres", render: (r) => App.num(r.litres) },
        { h: "Cost", num: true, sortKey: "cost", render: (r) => App.money0(r.cost) },
        { h: "Cost / L", num: true, render: (r) => (r.litres ? App.money0(Number(r.cost || 0) / Number(r.litres || 1)) : "—") },
        { h: "Odometer", num: true, sortKey: "odometer", render: (r) => App.num(r.odometer) },
        { h: "Station", render: (r) => ui.esc(r.station || "—") },
      ],
      filters: [
        { label: "All vehicles", opts: () => App.state.vehicles.map((v) => ({ value: v.id, label: v.plate })), get: (r) => r.vehicleId },
      ],
      searchText: (r) => [r.station, r.notes, App.vehicleShort(r.vehicleId), (App.driver(r.driverId) || {}).name].join(" "),
      csv: (r) => ({
        Date: r.date, Vehicle: App.vehicleShort(r.vehicleId), Driver: (App.driver(r.driverId) || {}).name || "",
        Litres: r.litres, Cost: r.cost, Odometer: r.odometer, Station: r.station, Notes: r.notes,
      }),
    },

    trips: {
      key: "trips", title: "Trips", sub: App.schema.trips.sub, icon: "route",
      actions: [{ label: "New trip", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "trips", onSaved: route }) }],
      sort: { key: "date", dir: -1 },
      columns: [
        { h: "Date", sortKey: "date", render: (r) => App.fmtDate(r.date) },
        { h: "Vehicle", render: (r) => { const v = App.vehicle(r.vehicleId); return v ? `<div class="cell-main">${ui.esc(v.plate)}</div><div class="cell-sub">${ui.esc(v.make + " " + v.model)}</div>` : "—"; } },
        { h: "Driver", render: (r) => { const d = App.driver(r.driverId); return d ? ui.esc(d.name) : "—"; } },
        { h: "Client / route", render: (r) => `<div class="cell-main">${ui.esc(r.client || "—")}</div><div class="cell-sub">${ui.esc((r.origin || "?") + " → " + (r.destination || "?"))}</div>` },
        { h: "Distance", num: true, sortKey: "km", render: (r) => (r.km ? App.num(r.km) + " km" : "—") },
        { h: "Escort", render: (r) => (r.escort === "Yes" ? `<span class="chip amber">Yes · ${App.num(r.police)}</span>` : '<span class="chip grey">No</span>') },
        { h: "Status", sortKey: "status", render: (r) => ui.chip(r.status) },
      ],
      filters: [
        { label: "All statuses", opts: App.TRIP_STATUS, get: (r) => r.status },
        { label: "All vehicles", opts: () => App.state.vehicles.map((v) => ({ value: v.id, label: v.plate })), get: (r) => r.vehicleId },
      ],
      searchText: (r) => [r.client, r.purpose, r.origin, r.destination, r.status, r.notes, App.vehicleShort(r.vehicleId), (App.driver(r.driverId) || {}).name].join(" "),
      csv: (r) => ({
        Date: r.date, Vehicle: App.vehicleShort(r.vehicleId), Driver: (App.driver(r.driverId) || {}).name || "",
        Client: r.client, Purpose: r.purpose, From: r.origin, To: r.destination, Km: r.km,
        Passengers: r.pax, Escort: r.escort, Police: r.police, Status: r.status, Notes: r.notes,
      }),
    },

    tyres: {
      key: "tyres", title: "Tyres", sub: App.schema.tyres.sub, icon: "tyre",
      actions: [{ label: "Add tyre", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "tyres", onSaved: route }) }],
      sort: { key: "installed", dir: -1 },
      columns: [
        { h: "Vehicle", render: (r) => { const v = App.vehicle(r.vehicleId); return v ? `<div class="cell-main">${ui.esc(v.plate)}</div><div class="cell-sub">${ui.esc(v.make + " " + v.model)}</div>` : "—"; } },
        { h: "Position", sortKey: "position", render: (r) => ui.esc(r.position || "—") },
        { h: "Brand", render: (r) => `<div class="cell-main">${ui.esc(r.brand || "—")}</div><div class="cell-sub">${ui.esc(r.size || "")}</div>` },
        { h: "Status", sortKey: "status", render: (r) => ui.chip(r.status) },
        { h: "Installed", sortKey: "installed", render: (r) => (r.installed ? App.fmtDate(r.installed) : "—") },
        { h: "Tread", num: true, render: (r) => {
          if (r.tread === null || r.tread === undefined || r.tread === "") return '<span class="chip grey">—</span>';
          const t = Number(r.tread);
          const tone = t <= 1.6 ? "red" : t <= 3 ? "amber" : "green";
          return `<span class="chip ${tone}">${t.toFixed(1)} mm</span>`;
        } },
        { h: "Cost", num: true, sortKey: "cost", render: (r) => App.money0(r.cost) },
      ],
      filters: [
        { label: "All statuses", opts: ["Fitted", "In store", "Retired"], get: (r) => r.status },
        { label: "All vehicles", opts: () => App.state.vehicles.map((v) => ({ value: v.id, label: v.plate })), get: (r) => r.vehicleId },
      ],
      searchText: (r) => [r.position, r.brand, r.size, r.status, r.notes, App.vehicleShort(r.vehicleId)].join(" "),
      csv: (r) => ({
        Vehicle: App.vehicleShort(r.vehicleId), Position: r.position, Brand: r.brand, Size: r.size,
        Status: r.status, Installed: r.installed, "Odometer at fitment": r.installKm,
        Removed: r.removed, "Tread (mm)": r.tread, Cost: r.cost, Notes: r.notes,
      }),
    },

    parts: {
      key: "parts", title: "Inventory", sub: App.schema.parts.sub, icon: "box",
      actions: [{ label: "Add part", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "parts", onSaved: route }) }],
      sort: { key: "name", dir: 1 },
      columns: [
        { h: "SKU", sortKey: "sku", render: (r) => `<span class="mono">${ui.esc(r.sku || "—")}</span>` },
        { h: "Part", sortKey: "name", render: (r) => `<div class="cell-main">${ui.esc(r.name)}</div><div class="cell-sub">${ui.esc(r.category || "")}</div>` },
        { h: "On hand", num: true, sortKey: "qty", render: (r) => {
          const q = Number(r.qty || 0), min = Number(r.minQty || 0);
          const tone = q === 0 ? "red" : q <= min ? "amber" : "green";
          return `<span class="chip ${tone}">${App.num(q)}</span>`;
        } },
        { h: "Reorder at", num: true, sortKey: "minQty", render: (r) => App.num(r.minQty) },
        { h: "Unit cost", num: true, sortKey: "unitCost", render: (r) => App.money0(r.unitCost) },
        { h: "Stock value", num: true, render: (r) => App.money0(Number(r.qty || 0) * Number(r.unitCost || 0)) },
        { h: "Supplier", render: (r) => { const v = App.vendor(r.vendorId); return v ? ui.esc(v.name) : "—"; } },
      ],
      filters: [
        { label: "All categories", opts: ["Filters", "Brakes", "Lubricants", "Tyres", "Electrical", "Body", "Engine", "Consumables"], get: (r) => r.category },
        { label: "Stock level", opts: [{ value: "low", label: "At / below reorder" }, { value: "ok", label: "Healthy stock" }], get: (r) => (Number(r.qty || 0) <= Number(r.minQty || 0) ? "low" : "ok") },
      ],
      searchText: (r) => [r.sku, r.name, r.category, r.location].join(" "),
      csv: (r) => ({
        SKU: r.sku, Part: r.name, Category: r.category, "On hand": r.qty, "Reorder level": r.minQty,
        "Unit cost": r.unitCost, Location: r.location, Supplier: (App.vendor(r.vendorId) || {}).name || "", Notes: r.notes,
      }),
    },

    vendors: {
      key: "vendors", title: "Vendors", sub: App.schema.vendors.sub, icon: "store",
      actions: [{ label: "Add vendor", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "vendors", onSaved: route }) }],
      sort: { key: "name", dir: 1 },
      columns: [
        { h: "Vendor", sortKey: "name", render: (r) => `<div class="cell-main">${ui.esc(r.name)}</div><div class="cell-sub">${ui.esc(r.notes || "")}</div>` },
        { h: "Category", sortKey: "category", render: (r) => ui.esc(r.category || "—") },
        { h: "Contact", render: (r) => `<div>${ui.esc(r.contact || "—")}</div><div class="cell-sub">${ui.esc(r.phone || "")}</div>` },
        { h: "Rating", num: true, sortKey: "rating", render: (r) => (r.rating ? `${Number(r.rating).toFixed(1)} ★` : "—") },
        { h: "Invoiced", num: true, render: (r) => App.money0(App.state.invoices.filter((i) => i.vendorId === r.id).reduce((s, i) => s + Number(i.amount || 0), 0)) },
        { h: "Jobs", num: true, render: (r) => App.num(App.state.maintenance.filter((m) => m.vendorId === r.id).length) },
      ],
      filters: [{ label: "All categories", opts: ["Workshop", "Tyres", "Parts", "Fuel", "Insurance", "Other"], get: (r) => r.category }],
      searchText: (r) => [r.name, r.category, r.contact, r.phone, r.notes].join(" "),
      csv: (r) => ({ Vendor: r.name, Category: r.category, Contact: r.contact, Phone: r.phone, Rating: r.rating, Notes: r.notes }),
    },

    invoices: {
      key: "invoices", title: "Invoices", sub: App.schema.invoices.sub, icon: "receipt",
      actions: [{ label: "New invoice", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "invoices", onSaved: route }) }],
      sort: { key: "date", dir: -1 },
      columns: [
        { h: "Submitted", sortKey: "date", render: (r) => App.fmtDate(r.date) },
        { h: "Invoice", sortKey: "number", render: (r) => `<div class="cell-main mono">${ui.esc(r.number || "—")}</div><div class="cell-sub">${ui.esc(r.description || "")}</div>` },
        { h: "Vendor", render: (r) => { const v = App.vendor(r.vendorId); return v ? ui.esc(v.name) : "—"; } },
        { h: "Amount", num: true, sortKey: "amount", render: (r) => App.money0(r.amount) },
        { h: "Paid", num: true, sortKey: "paid", render: (r) => App.money0(r.paid) },
        { h: "Outstanding", num: true, render: (r) => { const o = Number(r.amount || 0) - Number(r.paid || 0); return o > 0 ? `<b>${App.money0(o)}</b>` : '<span style="color:var(--green)">Settled</span>'; } },
        { h: "Due", render: (r) => r.dueDate ? `<div class="nowrap">${App.fmtDate(r.dueDate)}</div><div style="margin-top:4px">${ui.daysChip(App.daysUntil(r.dueDate))}</div>` : "—" },
        { h: "Status", sortKey: "status", render: (r) => ui.chip(r.status) },
      ],
      filters: [
        { label: "All statuses", opts: App.PAY_STATUS, get: (r) => r.status },
        { label: "Payment advice", opts: ["Pending", "Received", "Not required"], get: (r) => r.advice },
        { label: "All vendors", opts: () => App.state.vendors.map((v) => ({ value: v.id, label: v.name })), get: (r) => r.vendorId },
      ],
      searchText: (r) => [r.number, r.description, r.client, r.status, r.advice, r.notes, (App.vendor(r.vendorId) || {}).name].join(" "),
      csv: (r) => ({
        "Submission date": r.date, Invoice: r.number, Vendor: (App.vendor(r.vendorId) || {}).name || "",
        Description: r.description, Amount: r.amount, Paid: r.paid, Client: r.client,
        Status: r.status, Advice: r.advice, "Payment due": r.dueDate, Notes: r.notes,
      }),
    },

    incidents: {
      key: "incidents", title: "Incidents", sub: App.schema.incidents.sub, icon: "shield",
      actions: [{ label: "Log incident", icon: "plus", primary: true, onClick: () => ui.formModal({ key: "incidents", onSaved: route }) }],
      sort: { key: "date", dir: -1 },
      columns: [
        { h: "Date", sortKey: "date", render: (r) => App.fmtDate(r.date) },
        { h: "Vehicle", render: (r) => { const v = App.vehicle(r.vehicleId); return v ? `<div class="cell-main">${ui.esc(v.plate)}</div><div class="cell-sub">${ui.esc(v.make + " " + v.model)}</div>` : "—"; } },
        { h: "Type", sortKey: "type", render: (r) => ui.esc(r.type || "—") },
        { h: "Severity", sortKey: "severity", render: (r) => ui.chip(r.severity) },
        { h: "Repair cost", num: true, sortKey: "cost", render: (r) => App.money0(r.cost) },
        { h: "Claim", render: (r) => `<div>${ui.chip(r.claimStatus)}</div>${Number(r.claimAmount) ? `<div class="cell-sub">${App.money0(r.claimAmount)}</div>` : ""}` },
        { h: "Status", sortKey: "status", render: (r) => ui.chip(r.status) },
      ],
      filters: [
        { label: "All types", opts: App.INCIDENT_TYPES, get: (r) => r.type },
        { label: "All statuses", opts: ["Open", "Closed"], get: (r) => r.status },
        { label: "Severity", opts: App.SEVERITY, get: (r) => r.severity },
      ],
      searchText: (r) => [r.type, r.location, r.description, r.claimStatus, r.status, App.vehicleShort(r.vehicleId)].join(" "),
      csv: (r) => ({
        Date: r.date, Vehicle: App.vehicleShort(r.vehicleId), Driver: (App.driver(r.driverId) || {}).name || "",
        Type: r.type, Severity: r.severity, Location: r.location, "Repair cost": r.cost,
        Claim: r.claimStatus, "Claim amount": r.claimAmount, Status: r.status, Description: r.description,
      }),
    },
  };

  function moduleScreen(key) {
    const cfg = MODULES[key];
    if (!cfg) { go("#/dashboard"); return; }
    ui.list(cfg);
    setActive(key);
  }

  /* ================= vehicle detail ================= */
  const kv = (k, v) => `<div style="display:flex;justify-content:space-between;gap:14px;padding:8px 0;border-bottom:1px solid var(--line-2);font-size:12.8px">
    <span style="color:var(--muted)">${ui.esc(k)}</span><span style="font-weight:600;text-align:right">${v}</span></div>`;

  const emptyRow = (cols, txt) => `<tr><td colspan="${cols}"><div class="empty" style="padding:28px"><p>${ui.esc(txt)}</p></div></td></tr>`;

  function paneTable(heads, body, cols) {
    return `<div class="tablewrap"><table>
      <thead><tr>${heads.map((h) => `<th class="${h.n ? "num" : ""}">${ui.esc(h.t)}</th>`).join("")}</tr></thead>
      <tbody>${body || emptyRow(cols || heads.length, "Nothing recorded yet.")}</tbody>
    </table></div>`;
  }

  function paneHead(title, addKey, addLabel) {
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <div class="section-title">${ui.esc(title)}</div>
      <div style="flex:1"></div>
      ${addKey ? `<button class="btn sm primary" data-add="${addKey}">${ui.icon("plus")}<span>${ui.esc(addLabel || "Add")}</span></button>` : ""}
    </div>`;
  }

  App.renderVehicleDetail = function (id, tab) {
    tab = tab || "overview";
    const v = App.vehicle(id);
    const elView = view();
    if (!v) {
      ui.setTitle("Vehicle not found", "That record may have been deleted");
      ui.setActions([{ label: "Back to vehicles", icon: "arrowleft", primary: true, onClick: () => go("#/vehicles") }]);
      elView.innerHTML = `<div class="card"><div class="empty"><div class="art">${ui.icon("truck")}</div><h4>No such vehicle</h4><p>The vehicle you opened is no longer in the register.</p></div></div>`;
      return;
    }

    const costs = App.vehicleCosts(id);
    const km = App.tripsFor(id).filter((t) => t.status === "Completed").reduce((s, t) => s + Number(t.km || 0), 0);
    const litres = App.fuelFor(id).reduce((s, f) => s + Number(f.litres || 0), 0);
    const eff = App.fuelEfficiency(id);
    const d = App.driver(v.driverId);
    const ns = App.nextService(id);

    ui.setTitle(v.plate || v.code, `${v.code || ""} · ${v.make || ""} ${v.model || ""}`);
    ui.setActions([
      { label: "All vehicles", icon: "arrowleft", onClick: () => go("#/vehicles") },
      { label: "Log fuel", icon: "fuel", onClick: () => ui.formModal({ key: "fuel", preset: { vehicleId: id }, onSaved: () => App.renderVehicleDetail(id, tab) }) },
      { label: "Edit vehicle", icon: "edit", primary: true, onClick: () => ui.formModal({ key: "vehicles", row: v, onSaved: () => App.renderVehicleDetail(id, tab) }) },
    ]);

    const stats = [
      { l: "Total spend", v: App.money0(costs.total), s: "maintenance, fuel, tyres, incidents" },
      { l: "Cost / km", v: km ? App.money0(costs.total / km) : "—", s: `${App.num(km)} km completed` },
      { l: "Fuel economy", v: eff ? eff.toFixed(1) + " km/L" : "—", s: `${App.num(litres)} L recorded` },
      { l: "Odometer", v: App.num(v.odometer), s: ns ? `next service ${App.fmtDate(ns)}` : "no service due" },
    ];

    const tabs = [
      ["overview", "Overview"], ["documents", "Documents"], ["maintenance", "Maintenance"],
      ["fuel", "Fuel"], ["trips", "Trips"], ["tyres", "Tyres"], ["incidents", "Incidents"],
    ];

    elView.innerHTML = `
      <div class="detail-top">
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="plate">${ui.esc(v.plate || "—")}</span>
            ${ui.chip(v.status)}
            <span class="chip dark">${ui.esc(v.code || "—")}</span>
            ${v.location ? `<span class="chip grey">${ui.esc(v.location)}</span>` : ""}
          </div>
          <h2 style="margin-top:12px;font-size:21px">${ui.esc(v.make || "")} ${ui.esc(v.model || "")}
            <span style="color:var(--muted);font-weight:500;font-size:15px">${ui.esc(v.year || "")}</span></h2>
          <div class="note" style="margin-top:4px">${ui.esc(v.type || "Vehicle")} · Driver: <b>${d ? ui.esc(d.name) : "unassigned"}</b></div>
        </div>
      </div>

      <div class="detail-stats">
        ${stats.map((st) => `<div class="stat"><div class="l">${ui.esc(st.l)}</div><div class="v">${st.v}</div><div class="s">${ui.esc(st.s)}</div></div>`).join("")}
      </div>

      <div class="tabs">
        ${tabs.map(([k, l]) => `<button class="tab ${tab === k ? "active" : ""}" data-tab="${k}">${l}</button>`).join("")}
      </div>
      <div id="detailPane"></div>`;

    const pane = elView.querySelector("#detailPane");

    const docRow = (f) => {
      const n = App.daysUntil(v[f.k]);
      return `<div class="doc"><div class="k">${ui.esc(f.l)}</div><div class="d">${App.fmtDate(v[f.k])}</div><div class="n">${ui.daysChip(n, f.l)}</div></div>`;
    };

    if (tab === "overview") {
      pane.innerHTML = `<div class="split">
        <div class="card">
          <div class="card-head"><h3>Specification</h3><button class="btn sm" data-edit-vehicle style="margin-left:auto">${ui.icon("edit")}<span>Edit</span></button></div>
          <div class="card-body" style="padding-top:4px">
            ${kv("Fleet number", ui.esc(v.code || "—"))}
            ${kv("Plate", ui.esc(v.plate || "—"))}
            ${kv("Make / model", ui.esc((v.make || "") + " " + (v.model || "")))}
            ${kv("Year", ui.esc(v.year || "—"))}
            ${kv("Body type", ui.esc(v.type || "—"))}
            ${kv("Base", ui.esc(v.location || "—"))}
            ${kv("Fuel type", ui.esc(v.fuelType || "—"))}
            ${kv("Tank capacity", v.tank ? App.num(v.tank) + " L" : "—")}
            ${kv("Acquired", App.fmtDate(v.acquired))}
            <div class="note" style="margin-top:14px">${ui.esc(v.notes || "No notes recorded.")}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Assignment &amp; compliance</h3></div>
          <div class="card-body" style="padding-top:4px">
            ${kv("Assigned driver", d ? ui.esc(d.name) + `<div class="cell-sub">${ui.esc(d.phone || "")}</div>` : "Unassigned")}
            ${kv("Driver licence", d ? App.fmtDate(d.licenceExpiry) : "—")}
            ${kv("Driver medical", d ? App.fmtDate(d.medicalExpiry) : "—")}
            ${kv("Next service", ns ? App.fmtDate(ns) : "—")}
            ${kv("Last service", App.fmtDate(App.lastService(id)))}
            ${kv("Open incidents", App.num(App.incidentsFor(id).filter((i) => i.status === "Open").length))}
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-head"><h3>Document expiry</h3><a class="hint" data-tab-jump="documents">Manage documents →</a></div>
        <div class="card-body"><div class="docgrid">${App.DOC_FIELDS.map(docRow).join("")}</div></div>
      </div>`;
    }

    if (tab === "documents") {
      pane.innerHTML = `<div class="card">
        <div class="card-head"><h3>Statutory documents</h3><button class="btn sm primary" data-edit-vehicle style="margin-left:auto">${ui.icon("edit")}<span>Edit dates</span></button></div>
        <div class="card-body">
          <div class="docgrid">${App.DOC_FIELDS.map(docRow).join("")}</div>
          <p class="note" style="margin:16px 0 0">
            Alerts fire ${App.state.settings.alertDays} days before expiry and enter the watch list at
            ${App.state.settings.watchDays} days. Adjust both in Settings.
          </p>
        </div>
      </div>`;
    }

    if (tab === "maintenance") {
      const rows = App.maintFor(id).slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map((m) => {
        const w = App.vendor(m.vendorId);
        return `<tr class="clickable" data-edit="maintenance" data-id="${m.id}">
          <td>${App.fmtDate(m.date)}</td>
          <td>${ui.esc(m.item || "—")}</td>
          <td>${w ? ui.esc(w.name) : "—"}</td>
          <td>${ui.chip(m.status)}</td>
          <td class="num mono">${App.num(m.odometer)}</td>
          <td class="num mono">${App.money0(m.cost)}</td>
          <td>${m.nextDue ? App.fmtDate(m.nextDue) : "—"}</td>
        </tr>`;
      }).join("");
      pane.innerHTML = paneHead("Work orders", "maintenance", "New work order") +
        paneTable([{ t: "Date" }, { t: "Item" }, { t: "Workshop" }, { t: "Status" }, { t: "Odometer", n: 1 }, { t: "Cost", n: 1 }, { t: "Next due" }], rows, 7);
    }

    if (tab === "fuel") {
      const rows = App.fuelFor(id).slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map((f) => `<tr class="clickable" data-edit="fuel" data-id="${f.id}">
        <td>${App.fmtDate(f.date)}</td>
        <td>${ui.esc((App.driver(f.driverId) || {}).name || "—")}</td>
        <td class="num mono">${App.num(f.litres)}</td>
        <td class="num mono">${App.money0(f.cost)}</td>
        <td class="num mono">${f.litres ? App.money0(Number(f.cost || 0) / Number(f.litres)) : "—"}</td>
        <td class="num mono">${App.num(f.odometer)}</td>
        <td>${ui.esc(f.station || "—")}</td>
      </tr>`).join("");
      pane.innerHTML = paneHead("Fuel history", "fuel", "Log fuel") +
        paneTable([{ t: "Date" }, { t: "Driver" }, { t: "Litres", n: 1 }, { t: "Cost", n: 1 }, { t: "Cost / L", n: 1 }, { t: "Odometer", n: 1 }, { t: "Station" }], rows, 7);
    }

    if (tab === "trips") {
      const rows = App.tripsFor(id).slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => `<tr class="clickable" data-edit="trips" data-id="${t.id}">
        <td>${App.fmtDate(t.date)}</td>
        <td>${ui.esc(t.client || "—")}</td>
        <td>${ui.esc((t.origin || "?") + " → " + (t.destination || "?"))}</td>
        <td class="num mono">${App.num(t.km)}</td>
        <td>${ui.chip(t.status)}</td>
      </tr>`).join("");
      pane.innerHTML = paneHead("Trip history", "trips", "New trip") +
        paneTable([{ t: "Date" }, { t: "Client" }, { t: "Route" }, { t: "Distance", n: 1 }, { t: "Status" }], rows, 5);
    }

    if (tab === "tyres") {
      const rows = App.tyresFor(id).map((t) => {
        const tread = t.tread === null || t.tread === undefined || t.tread === "" ? '<span class="chip grey">—</span>'
          : `<span class="chip ${Number(t.tread) <= 1.6 ? "red" : Number(t.tread) <= 3 ? "amber" : "green"}">${Number(t.tread).toFixed(1)} mm</span>`;
        return `<tr class="clickable" data-edit="tyres" data-id="${t.id}">
          <td>${ui.esc(t.position || "—")}</td>
          <td>${ui.esc(t.brand || "—")}</td>
          <td>${ui.esc(t.size || "—")}</td>
          <td>${ui.chip(t.status)}</td>
          <td>${t.installed ? App.fmtDate(t.installed) : "—"}</td>
          <td class="num mono">${App.num(t.installKm)}</td>
          <td>${tread}</td>
          <td class="num mono">${App.money0(t.cost)}</td>
        </tr>`;
      }).join("");
      pane.innerHTML = paneHead("Tyre fitment", "tyres", "Add tyre") +
        paneTable([{ t: "Position" }, { t: "Brand" }, { t: "Size" }, { t: "Status" }, { t: "Installed" }, { t: "Fitment km", n: 1 }, { t: "Tread" }, { t: "Cost", n: 1 }], rows, 8);
    }

    if (tab === "incidents") {
      const rows = App.incidentsFor(id).slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map((i) => `<tr class="clickable" data-edit="incidents" data-id="${i.id}">
        <td>${App.fmtDate(i.date)}</td>
        <td>${ui.esc(i.type || "—")}</td>
        <td>${ui.chip(i.severity)}</td>
        <td>${ui.esc(i.location || "—")}</td>
        <td class="num mono">${App.money0(i.cost)}</td>
        <td>${ui.chip(i.claimStatus)}</td>
        <td>${ui.chip(i.status)}</td>
      </tr>`).join("");
      pane.innerHTML = paneHead("Incidents & claims", "incidents", "Log incident") +
        paneTable([{ t: "Date" }, { t: "Type" }, { t: "Severity" }, { t: "Location" }, { t: "Repair cost", n: 1 }, { t: "Claim" }, { t: "Status" }], rows, 7);
    }

    /* wiring */
    elView.querySelectorAll("[data-tab]").forEach((b) => {
      b.onclick = () => App.renderVehicleDetail(id, b.dataset.tab);
    });
    elView.querySelectorAll("[data-tab-jump]").forEach((b) => {
      b.onclick = () => App.renderVehicleDetail(id, b.dataset.tabJump);
    });
    elView.querySelectorAll("[data-edit]").forEach((tr) => {
      tr.onclick = () => {
        const key = tr.dataset.edit;
        const row = (App.state[key] || []).find((x) => x.id === tr.dataset.id);
        if (!row) return;
        ui.formModal({ key, row, onSaved: () => App.renderVehicleDetail(id, tab) });
      };
    });
    elView.querySelectorAll("[data-add]").forEach((b) => {
      b.onclick = () => ui.formModal({ key: b.dataset.add, preset: { vehicleId: id }, onSaved: () => App.renderVehicleDetail(id, tab) });
    });
    elView.querySelectorAll("[data-edit-vehicle]").forEach((b) => {
      b.onclick = () => ui.formModal({ key: "vehicles", row: v, onSaved: () => App.renderVehicleDetail(id, tab) });
    });
  };

  /* ================= settings ================= */
  App.renderSettings = function () {
    const st = App.state.settings;
    ui.setTitle("Settings", "Company details, alert windows and your data");
    ui.setActions([]);

    const counts = Object.keys(App.schema).map((k) =>
      `<tr><td>${ui.esc(App.schema[k].title)}</td><td class="num mono">${App.num((App.state[k] || []).length)}</td></tr>`).join("");

    view().innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-head"><h3>Company &amp; thresholds</h3></div>
        <div class="card-body">
          <div class="formgrid">
            <div class="field"><label for="set-company">Company name</label><input id="set-company" value="${ui.esc(st.company)}" /></div>
            <div class="field"><label for="set-currency">Currency symbol</label><input id="set-currency" maxlength="4" value="${ui.esc(st.currency)}" /></div>
            <div class="field"><label for="set-alertDays">Document alert window (days)</label><input id="set-alertDays" type="number" min="1" value="${ui.esc(st.alertDays)}" /></div>
            <div class="field"><label for="set-watchDays">Watch list window (days)</label><input id="set-watchDays" type="number" min="1" value="${ui.esc(st.watchDays)}" /></div>
            <div class="field"><label for="set-terms">Default invoice terms (days)</label><input id="set-terms" type="number" min="0" value="${ui.esc(st.terms)}" /></div>
          </div>
          <div class="note" style="margin-top:12px">Alerts turn critical inside the alert window and amber-to-blue inside the watch window.</div>
          <div style="margin-top:16px"><button class="btn primary" id="saveSettings">${ui.icon("check")}<span>Save settings</span></button></div>
        </div>
      </div>

      <div class="split">
        <div class="card">
          <div class="card-head"><h3>Records on this device</h3></div>
          <div class="tablewrap" style="margin-top:8px">
            <table>${counts}</table>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Backup &amp; data</h3></div>
          <div class="card-body" style="padding-top:4px">
            <div class="settings-row">
              <div class="txt"><b>Download backup</b><span>Full JSON export of every record and setting.</span></div>
              <button class="btn sm" id="backupBtn">${ui.icon("download")}<span>Backup</span></button>
            </div>
            <div class="settings-row">
              <div class="txt"><b>Restore backup</b><span>Replace everything with a saved JSON backup.</span></div>
              <button class="btn sm" id="restoreBtn">${ui.icon("box")}<span>Restore</span></button>
            </div>
            <div class="settings-row">
              <div class="txt"><b>Load demo fleet</b><span>Replace everything with the sample Nigerian fleet.</span></div>
              <button class="btn sm" id="demoBtn">${ui.icon("truck")}<span>Load demo</span></button>
            </div>
          </div>
        </div>
      </div>

      <div class="danger-zone" style="margin-top:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <b style="font-size:13px">Erase all data</b>
          <div class="note">Removes every record from this browser. Download a backup first.</div>
        </div>
        <button class="btn danger" id="wipeBtn">${ui.icon("trash")}<span>Erase everything</span></button>
      </div>`;

    const numInput = (idv) => {
      const n = Number(el(idv).value);
      return isNaN(n) ? 30 : Math.max(0, Math.round(n));
    };

    el("saveSettings").onclick = () => {
      const company = el("set-company").value.trim() || "My Fleet";
      const currency = el("set-currency").value.trim() || "₦";
      const alertDays = Math.max(1, numInput("set-alertDays"));
      const watchDays = Math.max(alertDays, numInput("set-watchDays"));
      const terms = numInput("set-terms");
      Object.assign(App.state.settings, { company, currency, alertDays, watchDays, terms });
      App.save();
      ui.toast("Settings saved");
      renderNav();
      route();
    };

    el("backupBtn").onclick = () => {
      App.download(`fleetos-backup-${App.today()}.json`, JSON.stringify(App.state, null, 2), "application/json");
      ui.toast("Backup downloaded");
    };

    el("restoreBtn").onclick = () => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".json,application/json";
      inp.style.display = "none";
      document.body.appendChild(inp);
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) { inp.remove(); return; }
        const fr = new FileReader();
        fr.onload = () => {
          try {
            const data = JSON.parse(String(fr.result));
            if (!data || typeof data !== "object" || !Array.isArray(data.vehicles)) throw new Error("Not a FleetOS backup");
            App.replaceState(data);
            renderNav();
            route();
            ui.toast("Backup restored");
          } catch (e) {
            ui.toast("That file is not a FleetOS backup", "error");
          }
          inp.remove();
        };
        fr.readAsText(f);
      };
      inp.click();
    };

    el("demoBtn").onclick = () => {
      ui.confirm({
        title: "Load demo fleet?",
        text: "This replaces all current records with the sample fleet. Download a backup first if you want to keep your data.",
        confirmLabel: "Load demo",
        onConfirm: () => {
          App.reset(true);
          renderNav();
          route();
          ui.toast("Demo fleet loaded");
        },
      });
    };

    el("wipeBtn").onclick = () => {
      ui.confirm({
        title: "Erase everything?",
        text: "Every vehicle, driver, trip, invoice and setting will be removed from this browser. This cannot be undone.",
        confirmLabel: "Erase all data",
        onConfirm: () => {
          App.reset(false);
          renderNav();
          route();
          ui.toast("All data erased");
        },
      });
    };
  };

  /* ================= first run ================= */
  function welcome() {
    const body = document.createElement("div");
    body.innerHTML = `
      <p style="margin:0 0 14px;color:var(--ink-2);line-height:1.55;font-size:13px">
        FleetOS runs entirely in this browser — vehicles, drivers, trips, fuel, maintenance, tyres, parts,
        vendors, invoices, incidents and the reports that tie them together. Nothing leaves this device.
      </p>
      <div class="doc" style="margin-bottom:10px">
        <div class="k">Recommended</div>
        <div class="d">Start with the demo fleet</div>
        <div class="n">8 vehicles with drivers, trips, fuel, work orders and invoices to explore. Clear it anytime in Settings.</div>
      </div>
      <div class="doc">
        <div class="k">Or</div>
        <div class="d">Start with an empty register</div>
        <div class="n">Add your own vehicles and build the fleet from scratch.</div>
      </div>`;
    ui.modal({
      title: "Welcome to FleetOS",
      sub: "Let's get your fleet set up",
      body,
      footer: [
        { label: "Start empty", onClick: () => { App.save(); ui.closeModal(); ui.toast("Ready — add your first vehicle"); } },
        { label: "Load demo fleet", className: "primary", icon: "check", onClick: () => {
          App.reset(true);
          ui.closeModal();
          renderNav();
          route();
          ui.toast("Demo fleet loaded");
        } },
      ],
    });
  }

  /* ================= router ================= */
  function route() {
    const raw = location.hash.replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    const base = parts[0] || "dashboard";
    renderNav();
    ui.setActions([]);
    window.scrollTo(0, 0);

    if (base === "dashboard") { setActive("dashboard"); App.renderDashboard(); return; }
    if (base === "alerts") { setActive("alerts"); App.renderAlerts(); return; }
    if (base === "reports") { setActive("reports"); App.renderReports(); return; }
    if (base === "settings") { setActive("settings"); App.renderSettings(); return; }
    if (base === "vehicles" && parts[1]) { setActive("vehicles"); App.renderVehicleDetail(parts[1]); return; }
    if (MODULES[base]) { moduleScreen(base); return; }
    go("#/dashboard");
  }

  App.route = route;
  App.renderMaintenance = () => {
    if (location.hash.replace(/^#\/?/, "") !== "maintenance") go("#/maintenance");
    else route();
  };

  /* ================= boot ================= */
  function init() {
    el("brandMark").innerHTML = ui.icon("truck");
    el("menuBtn").innerHTML = ui.icon("menu");
    el("menuBtn").onclick = () => el("sidebar").classList.toggle("open");

    let firstRun = false;
    try { firstRun = !localStorage.getItem(App.DB_KEY); } catch (e) { firstRun = true; }

    renderNav();
    window.addEventListener("hashchange", route);
    route();
    if (firstRun) welcome();
  }

  init();
})();

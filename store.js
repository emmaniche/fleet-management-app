/* FleetOS — data layer: schema, demo data, persistence, helpers */
(function () {
  const DB_KEY = "fleetos.v1";
  const $ = {};

  /* ---------- date helpers ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());
  const addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const a = new Date(dateStr + "T00:00:00");
    const b = new Date(today() + "T00:00:00");
    return Math.round((a - b) / 86400000);
  };
  const monthKey = (dateStr) => (dateStr || "").slice(0, 7);
  const monthLabel = (key) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  };
  const fmtDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  /* ---------- numbers ---------- */
  const num = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
  const money = (n) => (App.state.settings.currency || "₦") + num(n);
  const money0 = (n) => (App.state.settings.currency || "₦") + num(Math.round(n || 0));

  /* ---------- options ---------- */
  const LOCATIONS = ["Lagos", "Abuja", "Port Harcourt", "Warri", "Escravos", "Kaduna"];
  const VEHICLE_TYPES = ["Pickup", "SUV", "Bus", "Van", "Truck", "Sedan"];
  const FUEL_TYPES = ["Diesel", "Petrol", "CNG", "Electric"];
  const VEHICLE_STATUS = ["Active", "In workshop", "Idle", "Disposed"];
  const PAY_STATUS = ["Pending", "Under review", "Approved", "Paid", "Rejected"];
  const TRIP_STATUS = ["Requested", "Approved", "In progress", "Completed", "Rejected"];
  const MAINT_STATUS = ["Scheduled", "In progress", "Completed"];
  const INCIDENT_TYPES = ["Accident", "Damage", "Theft", "Breakdown", "Fine"];
  const SEVERITY = ["Low", "Medium", "High"];

  /* ---------- schema ---------- */
  const schema = {
    vehicles: {
      singular: "vehicle", title: "Vehicles", icon: "truck",
      sub: "Fleet register, assignments and compliance dates",
      fields: [
        { k: "code", l: "Fleet no.", t: "text", req: true, group: "Identification" },
        { k: "plate", l: "Plate number", t: "text", req: true, group: "Identification" },
        { k: "make", l: "Make", t: "text", req: true, group: "Identification" },
        { k: "model", l: "Model", t: "text", req: true, group: "Identification" },
        { k: "year", l: "Year", t: "number", group: "Identification" },
        { k: "type", l: "Body type", t: "select", opts: VEHICLE_TYPES, group: "Identification" },
        { k: "location", l: "Base location", t: "select", opts: LOCATIONS, group: "Operation" },
        { k: "status", l: "Status", t: "select", opts: VEHICLE_STATUS, group: "Operation" },
        { k: "driverId", l: "Assigned driver", t: "ref", ref: "drivers", group: "Operation" },
        { k: "odometer", l: "Odometer (km)", t: "number", group: "Operation" },
        { k: "fuelType", l: "Fuel type", t: "select", opts: FUEL_TYPES, group: "Operation" },
        { k: "tank", l: "Tank capacity (L)", t: "number", group: "Operation" },
        { k: "acquired", l: "Date acquired", t: "date", group: "Operation" },
        { k: "licence", l: "Vehicle licence", t: "date", group: "Documents" },
        { k: "roadworthy", l: "Road worthiness", t: "date", group: "Documents" },
        { k: "insurance", l: "Insurance", t: "date", group: "Documents" },
        { k: "cmr", l: "CMR", t: "date", group: "Documents" },
        { k: "hackney", l: "Hackney permit", t: "date", group: "Documents" },
        { k: "ownership", l: "Proof of ownership", t: "date", group: "Documents" },
        { k: "notes", l: "Notes", t: "textarea", group: "Notes" },
      ],
    },
    drivers: {
      singular: "driver", title: "Drivers", icon: "users",
      sub: "Licences, medicals and vehicle assignments",
      fields: [
        { k: "name", l: "Full name", t: "text", req: true },
        { k: "phone", l: "Phone", t: "text" },
        { k: "licenceNo", l: "Licence number", t: "text" },
        { k: "licenceExpiry", l: "Licence expiry", t: "date" },
        { k: "medicalExpiry", l: "Medical certificate expiry", t: "date" },
        { k: "location", l: "Base location", t: "select", opts: LOCATIONS },
        { k: "status", l: "Status", t: "select", opts: ["Active", "On leave", "Inactive"] },
        { k: "notes", l: "Notes", t: "textarea" },
      ],
    },
    maintenance: {
      singular: "work order", title: "Maintenance", icon: "wrench",
      sub: "Work orders, vendors and next service dates",
      fields: [
        { k: "date", l: "Date", t: "date", req: true },
        { k: "vehicleId", l: "Vehicle", t: "ref", ref: "vehicles", req: true },
        { k: "item", l: "Maintenance item", t: "select", opts: ["Routine service", "Engine repair", "Brake system", "Tyres", "Suspension", "Electrical", "Air conditioning", "Body work", "Transmission", "Inspection", "Other"] },
        { k: "status", l: "Status", t: "select", opts: MAINT_STATUS },
        { k: "vendorId", l: "Vendor / workshop", t: "ref", ref: "vendors" },
        { k: "odometer", l: "Odometer (km)", t: "number" },
        { k: "cost", l: "Cost", t: "number" },
        { k: "parts", l: "Parts replaced", t: "text" },
        { k: "nextDue", l: "Next service due", t: "date" },
        { k: "notes", l: "Notes", t: "textarea" },
      ],
    },
    fuel: {
      singular: "fuel entry", title: "Fuel", icon: "fuel",
      sub: "Fills, consumption and efficiency",
      fields: [
        { k: "date", l: "Date", t: "date", req: true },
        { k: "vehicleId", l: "Vehicle", t: "ref", ref: "vehicles", req: true },
        { k: "driverId", l: "Driver", t: "ref", ref: "drivers" },
        { k: "litres", l: "Litres", t: "number", req: true },
        { k: "cost", l: "Cost", t: "number", req: true },
        { k: "odometer", l: "Odometer (km)", t: "number" },
        { k: "station", l: "Station", t: "text" },
        { k: "notes", l: "Notes", t: "textarea" },
      ],
    },
    trips: {
      singular: "trip", title: "Trips", icon: "route",
      sub: "Movement requests, approvals and kilometre capture",
      fields: [
        { k: "date", l: "Date", t: "date", req: true },
        { k: "vehicleId", l: "Vehicle", t: "ref", ref: "vehicles" },
        { k: "driverId", l: "Driver", t: "ref", ref: "drivers" },
        { k: "client", l: "Client / entity", t: "text" },
        { k: "purpose", l: "Purpose", t: "text" },
        { k: "origin", l: "From", t: "text" },
        { k: "destination", l: "To", t: "text" },
        { k: "km", l: "Distance (km)", t: "number" },
        { k: "pax", l: "Passengers", t: "number" },
        { k: "escort", l: "Armed escort", t: "select", opts: ["No", "Yes"] },
        { k: "police", l: "Police officers", t: "number" },
        { k: "status", l: "Status", t: "select", opts: TRIP_STATUS },
        { k: "notes", l: "Notes", t: "textarea" },
      ],
    },
    tyres: {
      singular: "tyre", title: "Tyres", icon: "tyre",
      sub: "Fitment, tread depth and cost per tyre",
      fields: [
        { k: "vehicleId", l: "Vehicle", t: "ref", ref: "vehicles", req: true },
        { k: "position", l: "Position", t: "select", opts: ["Front left", "Front right", "Rear left", "Rear right", "Rear left inner", "Rear right inner", "Spare"] },
        { k: "brand", l: "Brand", t: "text" },
        { k: "size", l: "Size", t: "text" },
        { k: "status", l: "Status", t: "select", opts: ["Fitted", "In store", "Retired"] },
        { k: "installed", l: "Installed", t: "date" },
        { k: "installKm", l: "Odometer at fitment", t: "number" },
        { k: "removed", l: "Removed", t: "date" },
        { k: "tread", l: "Tread depth (mm)", t: "number" },
        { k: "cost", l: "Cost", t: "number" },
        { k: "notes", l: "Notes", t: "textarea" },
      ],
    },
    parts: {
      singular: "part", title: "Inventory", icon: "box",
      sub: "Spare parts stock levels and reorder points",
      fields: [
        { k: "sku", l: "SKU", t: "text", req: true },
        { k: "name", l: "Part name", t: "text", req: true },
        { k: "category", l: "Category", t: "select", opts: ["Filters", "Brakes", "Lubricants", "Tyres", "Electrical", "Body", "Engine", "Consumables"] },
        { k: "qty", l: "Quantity on hand", t: "number" },
        { k: "minQty", l: "Reorder level", t: "number" },
        { k: "unitCost", l: "Unit cost", t: "number" },
        { k: "location", l: "Store location", t: "text" },
        { k: "vendorId", l: "Supplier", t: "ref", ref: "vendors" },
        { k: "notes", l: "Notes", t: "textarea" },
      ],
    },
    vendors: {
      singular: "vendor", title: "Vendors", icon: "store",
      sub: "Workshops and suppliers with spend and ratings",
      fields: [
        { k: "name", l: "Vendor name", t: "text", req: true },
        { k: "category", l: "Category", t: "select", opts: ["Workshop", "Tyres", "Parts", "Fuel", "Insurance", "Other"] },
        { k: "contact", l: "Contact person", t: "text" },
        { k: "phone", l: "Phone", t: "text" },
        { k: "rating", l: "Rating (1–5)", t: "number" },
        { k: "notes", l: "Notes", t: "textarea" },
      ],
    },
    invoices: {
      singular: "invoice", title: "Invoices", icon: "receipt",
      sub: "Vendor invoices, WCC pipeline and payment status",
      fields: [
        { k: "date", l: "Submission date", t: "date", req: true },
        { k: "number", l: "Invoice number", t: "text", req: true },
        { k: "vendorId", l: "Vendor", t: "ref", ref: "vendors" },
        { k: "description", l: "Description", t: "text" },
        { k: "amount", l: "Amount invoiced", t: "number", req: true },
        { k: "paid", l: "Amount paid", t: "number" },
        { k: "client", l: "Client", t: "text" },
        { k: "status", l: "WCC status", t: "select", opts: PAY_STATUS },
        { k: "advice", l: "Payment advice / receipt", t: "select", opts: ["Pending", "Received", "Not required"] },
        { k: "dueDate", l: "Payment due", t: "date" },
        { k: "notes", l: "Notes", t: "textarea" },
      ],
    },
    incidents: {
      singular: "incident", title: "Incidents", icon: "shield",
      sub: "Accidents, damage, claims and downtime",
      fields: [
        { k: "date", l: "Date", t: "date", req: true },
        { k: "vehicleId", l: "Vehicle", t: "ref", ref: "vehicles" },
        { k: "driverId", l: "Driver", t: "ref", ref: "drivers" },
        { k: "type", l: "Type", t: "select", opts: INCIDENT_TYPES },
        { k: "severity", l: "Severity", t: "select", opts: SEVERITY },
        { k: "location", l: "Location", t: "text" },
        { k: "cost", l: "Repair cost", t: "number" },
        { k: "claimStatus", l: "Insurance claim", t: "select", opts: ["None", "Open", "Submitted", "Settled", "Declined"] },
        { k: "claimAmount", l: "Claim amount", t: "number" },
        { k: "status", l: "Status", t: "select", opts: ["Open", "Closed"] },
        { k: "description", l: "What happened", t: "textarea" },
      ],
    },
  };

  /* ---------- demo data ---------- */
  function demo() {
    const V = (n) => "VEH-" + n;
    const D = (n) => "DRV-" + n;
    const W = (n) => "VEN-" + n;
    return {
      settings: { company: "KI Fleet Services", currency: "₦", alertDays: 30, watchDays: 90, terms: 30 },
      vehicles: [
        { id: V(1), code: "KIF-001", plate: "LAG-123-XY", make: "Toyota", model: "Hilux", year: 2021, type: "Pickup", location: "Lagos", status: "Active", driverId: D(1), odometer: 86420, fuelType: "Diesel", tank: 80, acquired: addDays(-1680), licence: addDays(13), roadworthy: addDays(7), insurance: addDays(103), cmr: addDays(12), hackney: addDays(27), ownership: addDays(640), notes: "Pool vehicle for OML 11 crew changes." },
        { id: V(2), code: "KIF-002", plate: "ABJ-456-ZZ", make: "Toyota", model: "Hiace", year: 2019, type: "Bus", location: "Abuja", status: "In workshop", driverId: D(2), odometer: 132400, fuelType: "Petrol", tank: 70, acquired: addDays(-2400), licence: addDays(-48), roadworthy: addDays(32), insurance: addDays(-78), cmr: addDays(53), hackney: addDays(75), ownership: addDays(530), notes: "Turbo hose replacement in progress." },
        { id: V(3), code: "KIF-003", plate: "PHC-789-AA", make: "Ford", model: "Ranger", year: 2022, type: "Pickup", location: "Port Harcourt", status: "Active", driverId: D(3), odometer: 41200, fuelType: "Diesel", tank: 80, acquired: addDays(-1320), licence: addDays(2), roadworthy: addDays(1), insurance: addDays(195), cmr: addDays(134), hackney: addDays(10), ownership: addDays(409), notes: "" },
        { id: V(4), code: "KIF-004", plate: "LAG-234-BC", make: "Toyota", model: "Coaster", year: 2020, type: "Bus", location: "Lagos", status: "Active", driverId: D(4), odometer: 98300, fuelType: "Diesel", tank: 95, acquired: addDays(-2100), licence: addDays(58), roadworthy: addDays(41), insurance: addDays(160), cmr: addDays(22), hackney: addDays(88), ownership: addDays(720), notes: "24-seater crew bus." },
        { id: V(5), code: "KIF-005", plate: "ABJ-567-DE", make: "Toyota", model: "Land Cruiser", year: 2023, type: "SUV", location: "Abuja", status: "Idle", driverId: null, odometer: 22100, fuelType: "Petrol", tank: 110, acquired: addDays(-900), licence: addDays(210), roadworthy: addDays(180), insurance: addDays(240), cmr: addDays(150), hackney: addDays(300), ownership: addDays(900), notes: "Executive pool — awaiting assignment." },
        { id: V(6), code: "KIF-006", plate: "PHC-890-FG", make: "Isuzu", model: "NPR", year: 2018, type: "Truck", location: "Port Harcourt", status: "Active", driverId: D(5), odometer: 176500, fuelType: "Diesel", tank: 120, acquired: addDays(-2900), licence: addDays(19), roadworthy: addDays(-12), insurance: addDays(64), cmr: addDays(120), hackney: addDays(45), ownership: addDays(380), notes: "Materials haulage." },
        { id: V(7), code: "KIF-007", plate: "LAG-345-HI", make: "Hyundai", model: "H1", year: 2021, type: "Van", location: "Lagos", status: "Active", driverId: D(6), odometer: 64800, fuelType: "Diesel", tank: 75, acquired: addDays(-1500), licence: addDays(74), roadworthy: addDays(66), insurance: addDays(28), cmr: addDays(59), hackney: addDays(140), ownership: addDays(560), notes: "" },
        { id: V(8), code: "KIF-008", plate: "WAR-678-JK", make: "Toyota", model: "Hilux", year: 2020, type: "Pickup", location: "Warri", status: "In workshop", driverId: null, odometer: 121900, fuelType: "Diesel", tank: 80, acquired: addDays(-1900), licence: addDays(36), roadworthy: addDays(24), insurance: addDays(-5), cmr: addDays(80), hackney: addDays(150), ownership: addDays(610), notes: "Suspension overhaul." },
      ],
      drivers: [
        { id: D(1), name: "John Bello", phone: "0803 411 2200", licenceNo: "LSD-882134", licenceExpiry: addDays(420), medicalExpiry: addDays(180), location: "Lagos", status: "Active", notes: "" },
        { id: D(2), name: "Musa Sani", phone: "0806 552 7711", licenceNo: "ABJ-119083", licenceExpiry: addDays(35), medicalExpiry: addDays(-10), location: "Abuja", status: "Active", notes: "Medical renewal overdue." },
        { id: D(3), name: "Anthony Eze", phone: "0803 990 1122", licenceNo: "PHC-771204", licenceExpiry: addDays(15), medicalExpiry: addDays(90), location: "Port Harcourt", status: "Active", notes: "" },
        { id: D(4), name: "Segun Ojo", phone: "0811 220 3344", licenceNo: "LSD-664521", licenceExpiry: addDays(210), medicalExpiry: addDays(240), location: "Lagos", status: "Active", notes: "" },
        { id: D(5), name: "Ibrahim Lawal", phone: "0705 883 9922", licenceNo: "PHC-330918", licenceExpiry: addDays(88), medicalExpiry: addDays(64), location: "Port Harcourt", status: "Active", notes: "" },
        { id: D(6), name: "Chidi Nwosu", phone: "0802 774 6655", licenceNo: "LSD-901227", licenceExpiry: addDays(-30), medicalExpiry: addDays(120), location: "Lagos", status: "On leave", notes: "Licence renewal pending." },
      ],
      vendors: [
        { id: W(1), name: "AutoWorks Ltd", category: "Workshop", contact: "Peter Adams", phone: "0803 111 2233", rating: 4.6, notes: "Preferred mechanical workshop, Lagos." },
        { id: W(2), name: "North Motors", category: "Workshop", contact: "Hauwa Bello", phone: "0806 444 5566", rating: 4.1, notes: "Abuja, Toyota specialist." },
        { id: W(3), name: "TyreHub Nigeria", category: "Tyres", contact: "Emeka Obi", phone: "0705 777 8899", rating: 4.8, notes: "Bulk tyre pricing." },
        { id: W(4), name: "NaijaParts Depot", category: "Parts", contact: "Sade Okun", phone: "0811 333 4455", rating: 3.9, notes: "Filters, brakes, consumables." },
      ],
      maintenance: [
        { id: "MNT-1", date: addDays(-3), vehicleId: V(2), item: "Engine repair", status: "In progress", vendorId: W(2), odometer: 132300, cost: 250000, parts: "Turbo hose, clamps", nextDue: addDays(9), notes: "Awaiting hose delivery." },
        { id: "MNT-2", date: addDays(-6), vehicleId: V(8), item: "Suspension", status: "In progress", vendorId: W(1), odometer: 121800, cost: 185000, parts: "Front shocks, bushings", nextDue: addDays(20), notes: "" },
        { id: "MNT-3", date: addDays(-12), vehicleId: V(1), item: "Routine service", status: "Completed", vendorId: W(1), odometer: 85200, cost: 68000, parts: "Oil, filters", nextDue: addDays(5), notes: "" },
        { id: "MNT-4", date: addDays(-21), vehicleId: V(6), item: "Brake system", status: "Completed", vendorId: W(1), odometer: 174900, cost: 142000, parts: "Pads, discs", nextDue: addDays(70), notes: "" },
        { id: "MNT-5", date: addDays(-34), vehicleId: V(3), item: "Routine service", status: "Completed", vendorId: W(2), odometer: 39800, cost: 55000, parts: "Oil, filters", nextDue: addDays(56), notes: "" },
        { id: "MNT-6", date: addDays(-44), vehicleId: V(4), item: "Inspection", status: "Completed", vendorId: W(1), odometer: 96100, cost: 25000, parts: "", nextDue: addDays(120), notes: "Pre-trip inspection." },
        { id: "MNT-7", date: addDays(-52), vehicleId: V(7), item: "Air conditioning", status: "Completed", vendorId: W(1), odometer: 62400, cost: 48000, parts: "Gas, belt", nextDue: addDays(140), notes: "" },
        { id: "MNT-8", date: addDays(-63), vehicleId: V(1), item: "Tyres", status: "Completed", vendorId: W(3), odometer: 82000, cost: 320000, parts: "4 × 265/65R17", nextDue: addDays(200), notes: "" },
        { id: "MNT-9", date: addDays(-78), vehicleId: V(5), item: "Routine service", status: "Completed", vendorId: W(2), odometer: 20400, cost: 72000, parts: "Oil, filters", nextDue: addDays(12), notes: "" },
        { id: "MNT-10", date: addDays(-95), vehicleId: V(6), item: "Electrical", status: "Completed", vendorId: W(1), odometer: 169800, cost: 38000, parts: "Alternator relay", nextDue: addDays(160), notes: "" },
        { id: "MNT-11", date: addDays(-110), vehicleId: V(4), item: "Routine service", status: "Completed", vendorId: W(1), odometer: 94100, cost: 64000, parts: "Oil, filters", nextDue: addDays(15), notes: "" },
        { id: "MNT-12", date: addDays(-130), vehicleId: V(3), item: "Body work", status: "Completed", vendorId: W(2), odometer: 37100, cost: 190000, parts: "Rear panel", nextDue: null, notes: "Reversing damage repaired." },
      ],
      fuel: [
        { id: "F-1", date: addDays(-1), vehicleId: V(1), driverId: D(1), litres: 62, cost: 74400, odometer: 86420, station: "NNPC Lekki", notes: "" },
        { id: "F-2", date: addDays(-2), vehicleId: V(6), driverId: D(5), litres: 110, cost: 132000, odometer: 176500, station: "Total Rumuokoro", notes: "" },
        { id: "F-3", date: addDays(-4), vehicleId: V(3), driverId: D(3), litres: 58, cost: 69600, odometer: 41200, station: "Mobil Aba Road", notes: "" },
        { id: "F-4", date: addDays(-5), vehicleId: V(4), driverId: D(4), litres: 88, cost: 105600, odometer: 98300, station: "NNPC Ikeja", notes: "" },
        { id: "F-5", date: addDays(-7), vehicleId: V(7), driverId: D(6), litres: 54, cost: 64800, odometer: 64800, station: "Total Victoria Island", notes: "" },
        { id: "F-6", date: addDays(-9), vehicleId: V(1), driverId: D(1), litres: 60, cost: 72000, odometer: 85980, station: "NNPC Lekki", notes: "" },
        { id: "F-7", date: addDays(-12), vehicleId: V(5), driverId: null, litres: 72, cost: 93600, odometer: 22100, station: "NNPC Wuse", notes: "" },
        { id: "F-8", date: addDays(-15), vehicleId: V(3), driverId: D(3), litres: 55, cost: 66000, odometer: 40650, station: "Mobil Aba Road", notes: "" },
        { id: "F-9", date: addDays(-18), vehicleId: V(2), driverId: D(2), litres: 65, cost: 78000, odometer: 131900, station: "Total Airport Road", notes: "" },
        { id: "F-10", date: addDays(-22), vehicleId: V(4), driverId: D(4), litres: 82, cost: 98400, odometer: 97100, station: "NNPC Ikeja", notes: "" },
        { id: "F-11", date: addDays(-27), vehicleId: V(6), driverId: D(5), litres: 105, cost: 126000, odometer: 174200, station: "Total Rumuokoro", notes: "" },
        { id: "F-12", date: addDays(-33), vehicleId: V(1), driverId: D(1), litres: 58, cost: 69600, odometer: 85200, station: "NNPC Lekki", notes: "" },
        { id: "F-13", date: addDays(-38), vehicleId: V(7), driverId: D(6), litres: 50, cost: 60000, odometer: 62800, station: "Total Victoria Island", notes: "" },
        { id: "F-14", date: addDays(-44), vehicleId: V(3), driverId: D(3), litres: 52, cost: 62400, odometer: 39400, station: "Mobil Aba Road", notes: "" },
        { id: "F-15", date: addDays(-51), vehicleId: V(5), driverId: null, litres: 68, cost: 88400, odometer: 21100, station: "NNPC Wuse", notes: "" },
        { id: "F-16", date: addDays(-58), vehicleId: V(4), driverId: D(4), litres: 79, cost: 94800, odometer: 95200, station: "NNPC Ikeja", notes: "" },
        { id: "F-17", date: addDays(-66), vehicleId: V(6), driverId: D(5), litres: 98, cost: 117600, odometer: 171000, station: "Total Rumuokoro", notes: "" },
        { id: "F-18", date: addDays(-74), vehicleId: V(1), driverId: D(1), litres: 55, cost: 66000, odometer: 83700, station: "NNPC Lekki", notes: "" },
      ],
      trips: [
        { id: "TRP-1", date: addDays(-1), vehicleId: V(1), driverId: D(1), client: "WAGL", purpose: "Crew change", origin: "Lagos", destination: "OML 11", km: 320, pax: 4, escort: "Yes", police: 4, status: "Completed", notes: "" },
        { id: "TRP-2", date: addDays(-2), vehicleId: V(6), driverId: D(5), client: "Total", purpose: "Materials delivery", origin: "Port Harcourt", destination: "OML 58", km: 410, pax: 2, escort: "Yes", police: 2, status: "Completed", notes: "" },
        { id: "TRP-3", date: addDays(-3), vehicleId: V(4), driverId: D(4), client: "Chevron", purpose: "Staff shuttle", origin: "Lagos", destination: "Lekki", km: 68, pax: 18, escort: "No", police: 0, status: "Completed", notes: "" },
        { id: "TRP-4", date: addDays(-4), vehicleId: V(3), driverId: D(3), client: "NNPC", purpose: "Site inspection", origin: "Port Harcourt", destination: "Eleme", km: 52, pax: 3, escort: "No", police: 0, status: "Completed", notes: "" },
        { id: "TRP-5", date: addDays(1), vehicleId: V(1), driverId: D(1), client: "WAGL", purpose: "Crew change", origin: "Lagos", destination: "OML 11", km: 320, pax: 5, escort: "Yes", police: 4, status: "Approved", notes: "Early departure 05:00." },
        { id: "TRP-6", date: addDays(2), vehicleId: V(4), driverId: D(4), client: "Total", purpose: "Staff shuttle", origin: "Lagos", destination: "Agbara", km: 84, pax: 16, escort: "No", police: 0, status: "Requested", notes: "" },
        { id: "TRP-7", date: addDays(-6), vehicleId: V(7), driverId: D(6), client: "Chevron", purpose: "Document delivery", origin: "Lagos", destination: "Victoria Island", km: 34, pax: 1, escort: "No", police: 0, status: "Completed", notes: "" },
        { id: "TRP-8", date: addDays(-8), vehicleId: V(5), driverId: null, client: "KI Fleet", purpose: "Executive movement", origin: "Abuja", destination: "Wuse", km: 24, pax: 2, escort: "No", police: 0, status: "Completed", notes: "" },
        { id: "TRP-9", date: addDays(-11), vehicleId: V(6), driverId: D(5), client: "WAGL", purpose: "Equipment haulage", origin: "Port Harcourt", destination: "Warri", km: 196, pax: 2, escort: "Yes", police: 2, status: "Completed", notes: "" },
        { id: "TRP-10", date: addDays(-14), vehicleId: V(3), driverId: D(3), client: "NNPC", purpose: "Pipeline patrol", origin: "Port Harcourt", destination: "Omoku", km: 142, pax: 4, escort: "Yes", police: 3, status: "Completed", notes: "" },
        { id: "TRP-11", date: addDays(-17), vehicleId: V(1), driverId: D(1), client: "WAGL", purpose: "Crew change", origin: "Lagos", destination: "OML 11", km: 318, pax: 6, escort: "Yes", police: 4, status: "Completed", notes: "" },
        { id: "TRP-12", date: addDays(-21), vehicleId: V(4), driverId: D(4), client: "Chevron", purpose: "Staff shuttle", origin: "Lagos", destination: "Lekki", km: 70, pax: 20, escort: "No", police: 0, status: "Completed", notes: "" },
        { id: "TRP-13", date: addDays(-25), vehicleId: V(5), driverId: null, client: "KI Fleet", purpose: "Airport pickup", origin: "Abuja", destination: "Nnamdi Azikiwe Airport", km: 46, pax: 1, escort: "No", police: 0, status: "Completed", notes: "" },
        { id: "TRP-14", date: addDays(-28), vehicleId: V(6), driverId: D(5), client: "Total", purpose: "Materials delivery", origin: "Port Harcourt", destination: "OML 58", km: 405, pax: 2, escort: "Yes", police: 2, status: "Completed", notes: "" },
        { id: "TRP-15", date: addDays(-31), vehicleId: V(3), driverId: D(3), client: "NNPC", purpose: "Site inspection", origin: "Port Harcourt", destination: "Eleme", km: 55, pax: 3, escort: "No", police: 0, status: "Completed", notes: "" },
      ],
      tyres: [
        { id: "TYR-1", vehicleId: V(1), position: "Front left", brand: "Michelin", size: "265/65R17", status: "Fitted", installed: addDays(-63), installKm: 82000, removed: null, tread: 7.5, cost: 80000, notes: "" },
        { id: "TYR-2", vehicleId: V(1), position: "Front right", brand: "Michelin", size: "265/65R17", status: "Fitted", installed: addDays(-63), installKm: 82000, removed: null, tread: 7.2, cost: 80000, notes: "" },
        { id: "TYR-3", vehicleId: V(1), position: "Rear left", brand: "Michelin", size: "265/65R17", status: "Fitted", installed: addDays(-63), installKm: 82000, removed: null, tread: 6.8, cost: 80000, notes: "" },
        { id: "TYR-4", vehicleId: V(1), position: "Rear right", brand: "Michelin", size: "265/65R17", status: "Fitted", installed: addDays(-63), installKm: 82000, removed: null, tread: 1.6, cost: 80000, notes: "Replace at next service." },
        { id: "TYR-5", vehicleId: V(6), position: "Front left", brand: "Bridgestone", size: "8.25R16", status: "Fitted", installed: addDays(-120), installKm: 164000, removed: null, tread: 4.4, cost: 96000, notes: "" },
        { id: "TYR-6", vehicleId: V(6), position: "Front right", brand: "Bridgestone", size: "8.25R16", status: "Fitted", installed: addDays(-120), installKm: 164000, removed: null, tread: 4.1, cost: 96000, notes: "" },
        { id: "TYR-7", vehicleId: V(4), position: "Front left", brand: "Goodyear", size: "215/75R17.5", status: "Fitted", installed: addDays(-200), installKm: 90200, removed: null, tread: 3.2, cost: 72000, notes: "" },
        { id: "TYR-8", vehicleId: V(4), position: "Spare", brand: "Goodyear", size: "215/75R17.5", status: "In store", installed: null, installKm: null, removed: null, tread: 9, cost: 72000, notes: "Held at Lagos workshop." },
        { id: "TYR-9", vehicleId: V(3), position: "Rear left", brand: "Dunlop", size: "265/65R17", status: "Retired", installed: addDays(-500), installKm: 28000, removed: addDays(-60), tread: 0.9, cost: 68000, notes: "Sidewall damage." },
      ],
      parts: [
        { id: "PRT-1", sku: "FLT-OIL-01", name: "Oil filter — Toyota 1GD", category: "Filters", qty: 6, minQty: 4, unitCost: 12500, location: "Lagos store", vendorId: W(4), notes: "" },
        { id: "PRT-2", sku: "FLT-AIR-02", name: "Air filter — Hilux", category: "Filters", qty: 2, minQty: 4, unitCost: 9500, location: "Lagos store", vendorId: W(4), notes: "Below reorder level." },
        { id: "PRT-3", sku: "BRK-PAD-03", name: "Front brake pads — Hiace", category: "Brakes", qty: 3, minQty: 2, unitCost: 34000, location: "Abuja store", vendorId: W(4), notes: "" },
        { id: "PRT-4", sku: "OIL-15W40", name: "Engine oil 15W-40 (20 L)", category: "Lubricants", qty: 8, minQty: 5, unitCost: 78000, location: "Lagos store", vendorId: W(4), notes: "" },
        { id: "PRT-5", sku: "TYR-265-01", name: "Tyre 265/65R17", category: "Tyres", qty: 1, minQty: 2, unitCost: 80000, location: "Lagos store", vendorId: W(3), notes: "" },
        { id: "PRT-6", sku: "BAT-100AH", name: "Battery 100Ah", category: "Electrical", qty: 0, minQty: 2, unitCost: 145000, location: "Port Harcourt store", vendorId: W(4), notes: "Out of stock." },
        { id: "PRT-7", sku: "COOL-GRN", name: "Coolant (5 L)", category: "Consumables", qty: 12, minQty: 6, unitCost: 14500, location: "Lagos store", vendorId: W(4), notes: "" },
      ],
      invoices: [
        { id: "INV-1", date: addDays(-48), number: "AW-1042", vendorId: W(1), description: "Sept maintenance — KIF-001", amount: 500000, paid: 200000, client: "WAGL", status: "Pending", advice: "Received", dueDate: addDays(-18), notes: "" },
        { id: "INV-2", date: addDays(-34), number: "TH-2281", vendorId: W(3), description: "Tyres — KIF-001", amount: 320000, paid: 320000, client: "Total", status: "Paid", advice: "Received", dueDate: addDays(-4), notes: "" },
        { id: "INV-3", date: addDays(-16), number: "NM-7710", vendorId: W(2), description: "Turbo hose — KIF-002", amount: 750000, paid: 0, client: "Chevron", status: "Under review", advice: "Pending", dueDate: addDays(14), notes: "" },
        { id: "INV-4", date: addDays(-12), number: "AW-1088", vendorId: W(1), description: "Suspension — KIF-008", amount: 185000, paid: 0, client: "WAGL", status: "Approved", advice: "Pending", dueDate: addDays(18), notes: "" },
        { id: "INV-5", date: addDays(-5), number: "NP-3391", vendorId: W(4), description: "Parts restock", amount: 96000, paid: 0, client: "Internal", status: "Pending", advice: "Pending", dueDate: addDays(25), notes: "" },
        { id: "INV-6", date: addDays(-70), number: "NM-7422", vendorId: W(2), description: "Body work — KIF-003", amount: 190000, paid: 190000, client: "NNPC", status: "Paid", advice: "Received", dueDate: addDays(-40), notes: "" },
      ],
      incidents: [
        { id: "INC-1", date: addDays(-9), vehicleId: V(7), driverId: D(6), type: "Damage", severity: "Low", location: "Lagos — Third Mainland Bridge", cost: 45000, claimStatus: "Open", claimAmount: 40000, status: "Open", description: "Windscreen chip from road debris. Replacement booked." },
        { id: "INC-2", date: addDays(-26), vehicleId: V(3), driverId: D(3), type: "Accident", severity: "Medium", location: "Port Harcourt — Aba Road", cost: 190000, claimStatus: "Submitted", claimAmount: 160000, status: "Open", description: "Rear panel damage while reversing at client yard." },
        { id: "INC-3", date: addDays(-55), vehicleId: V(2), driverId: D(2), type: "Breakdown", severity: "Medium", location: "Abuja — Kubwa Expressway", cost: 120000, claimStatus: "None", claimAmount: 0, status: "Closed", description: "Turbo failure, vehicle towed to North Motors." },
      ],
    };
  }

  /* ---------- state ---------- */
  const emptyState = () => ({
    version: 1,
    settings: { company: "My Fleet", currency: "₦", alertDays: 30, watchDays: 90, terms: 30 },
    vehicles: [], drivers: [], maintenance: [], fuel: [], trips: [],
    tyres: [], parts: [], vendors: [], invoices: [], incidents: [],
  });

  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(emptyState(), parsed);
        state.settings = Object.assign(emptyState().settings, parsed.settings || {});
        return state;
      }
    } catch (e) { console.warn("Could not read stored data", e); }
    state = emptyState();
    return state;
  }

  function save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(state));
    } catch (e) { console.warn("Could not save", e); }
  }

  function reset(seedWithDemo) {
    state = seedWithDemo ? Object.assign(emptyState(), demo()) : emptyState();
    state.settings = Object.assign(emptyState().settings, state.settings || {});
    save();
    return state;
  }

  function replaceState(next) {
    state = Object.assign(emptyState(), next || {});
    state.settings = Object.assign(emptyState().settings, (next && next.settings) || {});
    save();
    return state;
  }

  /* ---------- lookups ---------- */
  const byId = (coll) => (id) => (state[coll] || []).find((x) => x.id === id) || null;
  const vehicle = (id) => byId("vehicles")(id);
  const driver = (id) => byId("drivers")(id);
  const vendor = (id) => byId("vendors")(id);
  const vehicleLabel = (id) => {
    const v = vehicle(id);
    return v ? `${v.plate} · ${v.make} ${v.model}` : "—";
  };
  const vehicleShort = (id) => {
    const v = vehicle(id);
    return v ? v.plate : "—";
  };

  const DOC_FIELDS = [
    { k: "licence", l: "Vehicle licence" },
    { k: "roadworthy", l: "Road worthiness" },
    { k: "insurance", l: "Insurance" },
    { k: "cmr", l: "CMR" },
    { k: "hackney", l: "Hackney permit" },
    { k: "ownership", l: "Proof of ownership" },
  ];

  /* ---------- derived helpers ---------- */
  const maintFor = (id) => state.maintenance.filter((m) => m.vehicleId === id);
  const fuelFor = (id) => state.fuel.filter((m) => m.vehicleId === id);
  const tripsFor = (id) => state.trips.filter((m) => m.vehicleId === id);
  const tyresFor = (id) => state.tyres.filter((m) => m.vehicleId === id);
  const incidentsFor = (id) => state.incidents.filter((m) => m.vehicleId === id);

  const vehicleCosts = (id) => {
    const maint = maintFor(id).filter(m => m.status === "Completed").reduce((s, m) => s + Number(m.cost || 0), 0);
    const fuel = fuelFor(id).reduce((s, f) => s + Number(f.cost || 0), 0);
    const tyres = tyresFor(id).reduce((s, t) => s + Number(t.cost || 0), 0);
    const incidents = incidentsFor(id).reduce((s, i) => s + Number(i.cost || 0), 0);
    return { maint, fuel, tyres, incidents, total: maint + fuel + tyres + incidents };
  };

  const nextService = (id) => {
    const rows = maintFor(id).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = rows.find((m) => m.status === "Completed" && m.nextDue) || rows.find((m) => m.nextDue);
    return latest ? latest.nextDue : null;
  };

  const lastService = (id) => {
    const dates = maintFor(id).filter(m => m.status === "Completed").map((m) => m.date).filter(Boolean).sort();
    return dates.length ? dates[dates.length - 1] : null;
  };

  const worstDoc = (v) => {
    let worst = null;
    DOC_FIELDS.forEach((d) => {
      const n = daysUntil(v[d.k]);
      if (n !== null && (worst === null || n < worst.days)) worst = { ...d, days: n, date: v[d.k] };
    });
    return worst;
  };

  const fuelEfficiency = (id) => {
    const rows = fuelFor(id).filter((f) => f.odometer).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (rows.length < 2) return null;
    let km = 0, litres = 0;
    for (let i = 1; i < rows.length; i++) {
      const d = rows[i].odometer - rows[i - 1].odometer;
      if (d > 0) { km += d; litres += Number(rows[i].litres || 0); }
    }
    return litres > 0 ? km / litres : null;
  };

  const monthKeys = (n) => {
    const out = [];
    const d = new Date();
    d.setDate(1);
    for (let i = n - 1; i >= 0; i--) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}`);
    }
    return out;
  };

  /* ---------- alerts ---------- */
  function alerts() {
    const out = [];
    const { alertDays = 30, watchDays = 90 } = state.settings;
    const sevFor = (n) => (n < 0 ? "red" : n <= alertDays ? "amber" : n <= watchDays ? "blue" : null);

    state.vehicles.forEach((v) => {
      DOC_FIELDS.forEach((d) => {
        const n = daysUntil(v[d.k]);
        if (n === null) return;
        const sev = sevFor(n);
        if (!sev) return;
        out.push({
          severity: sev, module: "vehicles", id: v.id, tag: "Compliance",
          title: `${d.l} ${n < 0 ? "expired" : "expiring"} — ${v.plate}`,
          detail: n < 0 ? `Expired ${Math.abs(n)} days ago (${fmtDate(v[d.k])})` : `${n} days left · ${fmtDate(v[d.k])}`,
        });
      });
      if (v.status === "In workshop") {
        out.push({ severity: "blue", module: "vehicles", id: v.id, tag: "Workshop", title: `${v.plate} is in the workshop`, detail: v.notes || "Vehicle off the road" });
      }
      const ns = nextService(v.id);
      if (ns) {
        const n = daysUntil(ns);
        if (n <= 14) {
          out.push({
            severity: n < 0 ? "red" : "amber", module: "maintenance", id: v.id, tag: "Service",
            title: `Service ${n < 0 ? "overdue" : "due"} — ${v.plate}`,
            detail: n < 0 ? `Was due ${fmtDate(ns)}` : `Due ${fmtDate(ns)} · in ${n} days`,
          });
        }
      }
    });

    state.drivers.forEach((d) => {
      [["licenceExpiry", "Licence"], ["medicalExpiry", "Medical"]].forEach(([k, label]) => {
        const n = daysUntil(d[k]);
        if (n === null) return;
        const sev = sevFor(n);
        if (!sev) return;
        out.push({
          severity: sev, module: "drivers", id: d.id, tag: "Driver",
          title: `${d.name} — ${label.toLowerCase()} ${n < 0 ? "expired" : "expiring"}`,
          detail: n < 0 ? `Expired ${Math.abs(n)} days ago` : `${n} days left · ${fmtDate(d[k])}`,
        });
      });
    });

    state.parts.forEach((p) => {
      if (Number(p.qty) <= Number(p.minQty)) {
        out.push({
          severity: Number(p.qty) === 0 ? "red" : "amber", module: "parts", id: p.id, tag: "Stock",
          title: `${p.name} ${Number(p.qty) === 0 ? "out of stock" : "below reorder level"}`,
          detail: `${p.qty} on hand · reorder at ${p.minQty} · ${p.sku}`,
        });
      }
    });

    state.invoices.forEach((inv) => {
      const outAmt = Number(inv.amount || 0) - Number(inv.paid || 0);
      if (outAmt <= 0 || inv.status === "Rejected") return;
      const n = inv.dueDate ? daysUntil(inv.dueDate) : null;
      if (n !== null && n < 0) {
        out.push({
          severity: "red", module: "invoices", id: inv.id, tag: "Payment",
          title: `Invoice ${inv.number} overdue by ${Math.abs(n)} days`,
          detail: `${money(outAmt)} outstanding · due ${fmtDate(inv.dueDate)}`,
        });
      } else if (n !== null && n <= 7) {
        out.push({
          severity: "amber", module: "invoices", id: inv.id, tag: "Payment",
          title: `Invoice ${inv.number} due in ${n} days`,
          detail: `${money(outAmt)} outstanding · due ${fmtDate(inv.dueDate)}`,
        });
      }
    });

    state.incidents.forEach((i) => {
      if (i.status === "Open" && i.claimStatus !== "Settled") {
        out.push({
          severity: i.severity === "High" ? "red" : "amber", module: "incidents", id: i.id, tag: "Incident",
          title: `${i.type} open — ${vehicleShort(i.vehicleId)}`,
          detail: `Claim ${String(i.claimStatus || "none").toLowerCase()} · ${money(i.cost)} repair`,
        });
      }
    });

    const rank = { red: 0, amber: 1, blue: 2 };
    return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }

  /* ---------- export ---------- */
  function download(filename, text, type) {
    const blob = new Blob([text], { type: type || "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 300);
  }

  function toCSV(rows) {
    if (!rows.length) return "";
    const keys = Object.keys(rows[0]);
    const esc = (v) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return [keys.join(",")].concat(rows.map((r) => keys.map((k) => esc(r[k])).join(","))).join("\n");
  }

  /* ---------- expose ---------- */
  Object.assign(window.App = window.App || {}, {
    DB_KEY, schema, LOCATIONS, VEHICLE_TYPES, FUEL_TYPES, VEHICLE_STATUS,
    PAY_STATUS, TRIP_STATUS, MAINT_STATUS, INCIDENT_TYPES, SEVERITY, DOC_FIELDS,
    load, save, reset, replaceState, demo,
    uid: (p) => `${p}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    iso, today, addDays, daysUntil, fmtDate, monthKey, monthLabel,
    num, money, money0,
    vehicle, driver, vendor, vehicleLabel, vehicleShort,
    maintFor, fuelFor, tripsFor, tyresFor, incidentsFor, vehicleCosts,
    nextService, lastService, worstDoc, fuelEfficiency, monthKeys,
    alerts, download, toCSV,
  });

  /* Object.assign would copy the value of a getter, freezing state at null */
  Object.defineProperty(window.App, "state", {
    configurable: true,
    get: () => state,
  });
})();

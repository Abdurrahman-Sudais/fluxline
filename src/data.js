// Fictional production data for the schedule-board prototype: one flexo printing line, tomorrow's orders,
// and past changeover records that the duration model learns from. All names and numbers are invented.

export const LINE = {name: 'Line 2 · 8-colour flexo press', shiftStart: '06:00', shiftMinutes: 960};
export const clock = (m) => { const t = 6 * 60 + Math.round(m); return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

/** Ink darkness 1 (light) → 5 (dark). Going dark→light means a full wash-up. */
export const SHADES = {1: 'Pastel', 2: 'Light', 3: 'Mid', 4: 'Dark', 5: 'Black/process'};
export const MATERIALS = ['PE film', 'BOPP film', 'Kraft paper'];

/** The set-up left on the press at the end of today's shift. */
export const START_STATE = {id: 'prev', product: 'Yesterday’s last job', shade: 4, material: 'PE film', width: 820, plates: 'P-31'};

// [id, product, customer, shade, material, width mm, plate set, run minutes, due (minutes after 06:00), order received]
const J = (id, product, customer, shade, material, width, plates, run, due, order) => ({id, product, customer, shade, material, width, plates, run, due, order});
export const jobs = [
  J('J-401', 'Bread bag, wholemeal', 'Golden Crust Bakery', 2, 'PE film', 640, 'P-12', 70, 960, 1),
  J('J-402', 'Rice sack 25 kg', 'Sahel Grains', 4, 'Kraft paper', 900, 'P-44', 60, 600, 2),
  J('J-403', 'Snack pouch, chilli', 'Crunchy Co.', 5, 'BOPP film', 520, 'P-27', 60, 960, 3),
  J('J-404', 'Bread bag, white', 'Golden Crust Bakery', 1, 'PE film', 640, 'P-12', 65, 480, 4),
  J('J-405', 'Detergent refill', 'CleanHome', 3, 'PE film', 760, 'P-19', 55, 960, 5),
  J('J-406', 'Snack pouch, plantain', 'Crunchy Co.', 4, 'BOPP film', 520, 'P-27', 55, 720, 6),
  J('J-407', 'Flour sack 10 kg', 'Sahel Grains', 2, 'Kraft paper', 900, 'P-44', 50, 960, 7),
  J('J-408', 'Ice bag', 'Polar Ice', 1, 'PE film', 700, 'P-08', 30, 360, 8),
  J('J-409', 'Coffee pouch', 'Highland Roasters', 5, 'BOPP film', 480, 'P-33', 40, 960, 9),
  J('J-410', 'Detergent 5 kg', 'CleanHome', 3, 'PE film', 760, 'P-19', 50, 840, 10),
];

/** Scenario: an urgent order the customer needs by 12:00. */
export const RUSH = J('J-411', 'Sugar sachet (urgent)', 'SweetDay Foods', 2, 'Kraft paper', 420, 'P-50', 35, 360, 11);
/** Scenario: planned maintenance on the press. */
export const DOWNTIME = {from: 240, to: 360, label: 'Anilox roll change, 10:00–12:00'};

/** True changeover behaviour used only to create the fictional history below (the model never sees it). */
const truth = (a, b) => 8 + (b.shade < a.shade ? 6 * (a.shade - b.shade) : 2 * (b.shade - a.shade)) + (a.material !== b.material ? 15 : 0) + Math.abs(a.width - b.width) / 100 * 3 + (a.plates !== b.plates ? 12 : 0);

/** Past changeover records from the line: features of the jobs either side, and the minutes the changeover took. */
export const history = (() => {
  let s = 11;
  const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  const mk = () => ({shade: 1 + Math.floor(rnd() * 5), material: MATERIALS[Math.floor(rnd() * 3)], width: 400 + Math.round(rnd() * 5) * 100, plates: `P-${Math.floor(rnd() * 6)}`});
  const out = [];
  for (let i = 0; i < 240; i += 1) { const a = mk(); const b = mk(); out.push({a, b, minutes: Math.max(5, Math.round(truth(a, b) + (rnd() - 0.5) * 8))}); }
  return out;
})();

/** The last five shifts: planned vs actual minutes (run + changeover). */
export const performance = [
  {day: 'Mon', planned: 905, actual: 958, changeoverPlanned: 236, changeoverActual: 281},
  {day: 'Tue', planned: 880, actual: 902, changeoverPlanned: 198, changeoverActual: 214},
  {day: 'Wed', planned: 930, actual: 941, changeoverPlanned: 205, changeoverActual: 209},
  {day: 'Thu', planned: 870, actual: 925, changeoverPlanned: 221, changeoverActual: 262},
  {day: 'Fri', planned: 915, actual: 920, changeoverPlanned: 190, changeoverActual: 196},
];

export const roles = [
  {id: 'planner', label: 'Production Planner', can: ['plan', 'approve']},
  {id: 'manager', label: 'Plant Manager', can: ['plan', 'approve', 'export']},
  {id: 'supervisor', label: 'Shift Supervisor', can: ['plan']},
  {id: 'viewer', label: 'Viewer', can: []},
];
export const people = {planner: 'Chiamaka Obi', manager: 'Ruth Okafor', supervisor: 'Yakubu Musa', viewer: 'Guest'};

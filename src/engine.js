// Schedule-board rules. Changeover minutes come from a linear model fitted to past changeovers; the
// sequencer searches job orders for the least changeover time without missing due times; planners approve.
import {history as HISTORY} from './data.js';

export const can = (roles, roleId, perm) => !!roles.find((r) => r.id === roleId)?.can.includes(perm);

export const FEATURES = ['Base clean-down', 'Wash-up per shade lighter', 'Per shade darker', 'Material change', 'Per 100 mm width change', 'Plate change'];
export const features = (a, b) => [1, Math.max(0, a.shade - b.shade), Math.max(0, b.shade - a.shade), a.material !== b.material ? 1 : 0, Math.abs(a.width - b.width) / 100, a.plates !== b.plates ? 1 : 0];

/** Ordinary least squares via the normal equations (small, dense, solved with Gaussian elimination). */
export function fit(records) {
  const k = FEATURES.length;
  const A = Array.from({length: k}, () => Array(k + 1).fill(0));
  for (const r of records) { const x = features(r.a, r.b); for (let i = 0; i < k; i += 1) { for (let j = 0; j < k; j += 1) A[i][j] += x[i] * x[j]; A[i][k] += x[i] * r.minutes; } }
  for (let c = 0; c < k; c += 1) {
    let p = c; for (let r = c + 1; r < k; r += 1) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < k; r += 1) if (r !== c) { const f = A[r][c] / A[c][c]; for (let j = c; j <= k; j += 1) A[r][j] -= f * A[c][j]; }
  }
  return A.map((row, i) => row[k] / row[i]);
}

const train = HISTORY.slice(0, 200);
const test = HISTORY.slice(200);
export const COEF = fit(train);
export const predict = (a, b, coef = COEF) => Math.max(5, features(a, b).reduce((s, x, i) => s + x * coef[i], 0));
/** Mean absolute error on held-out records, shown beside every estimate. */
export const MAE = test.reduce((s, r) => s + Math.abs(predict(r.a, r.b) - r.minutes), 0) / test.length;

/** Lay jobs out in order from the shift start, inserting changeovers and skipping any downtime window. */
export function schedule(order, start, {downtime = null} = {}) {
  let t = 0; let prev = start; const items = [];
  const skip = (from, dur) => (downtime && from < downtime.to && from + dur > downtime.from ? downtime.to : from);
  for (const job of order) {
    const co = predict(prev, job);
    const coStart = skip(t, co);
    const runStart = skip(coStart + co, job.run);
    const end = runStart + job.run;
    items.push({job, coStart, co, runStart, end, late: Math.max(0, end - job.due)});
    t = end; prev = job;
  }
  const changeover = items.reduce((s, i) => s + i.co, 0);
  const late = items.reduce((s, i) => s + i.late, 0);
  return {items, changeover, late, lateJobs: items.filter((i) => i.late > 0).length, end: t};
}

const cost = (s) => s.changeover + 20 * s.late;

/** Search for a good order: try several starting orders, then improve by moving single jobs until nothing helps. */
export function optimise(jobs, start, opts = {}) {
  const seeds = [[...jobs].sort((a, b) => a.order - b.order), [...jobs].sort((a, b) => a.due - b.due), nearest(jobs, start)];
  let best = null;
  for (const seed of seeds) {
    let cur = seed; let cs = cost(schedule(cur, start, opts)); let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < cur.length; i += 1) for (let j = 0; j < cur.length; j += 1) {
        if (i === j) continue;
        const next = [...cur]; const [m] = next.splice(i, 1); next.splice(j, 0, m);
        const c = cost(schedule(next, start, opts));
        if (c < cs - 1e-9) { cur = next; cs = c; improved = true; }
      }
    }
    if (!best || cs < best.cost) best = {order: cur, cost: cs};
  }
  return best.order;
}

function nearest(jobs, start) {
  const left = [...jobs]; const out = []; let prev = start;
  while (left.length) { left.sort((a, b) => predict(prev, a) - predict(prev, b)); prev = left.shift(); out.push(prev); }
  return out;
}

export const fifo = (jobs) => [...jobs].sort((a, b) => a.order - b.order);

export function initial(roles) {
  return {rush: false, downtime: false, manualOrder: null, approved: null, log: [], role: roles[0].id};
}

const now = () => new Date().toISOString();

export function act(state, a, {roles, actor, plan}) {
  const fail = (error) => ({state, ok: false, error});
  if (a.type === 'role') return {state: {...state, role: a.role}, ok: true};
  const allow = (p) => can(roles, state.role, p);
  const log = (summary, patch) => ({ok: true, state: {...state, ...patch, log: [{at: now(), actor, role: state.role, summary}, ...state.log]}});
  switch (a.type) {
    case 'scenario':
      if (!allow('plan')) return fail('Viewers cannot change scenarios.');
      return log(`${a.value ? 'Added' : 'Removed'} scenario: ${a.key === 'rush' ? 'urgent order J-411' : 'press downtime 10:00–12:00'}`, {[a.key]: !!a.value, manualOrder: null, approved: null});
    case 'move': {
      if (!allow('plan')) return fail('Viewers cannot change the sequence.');
      const order = [...(state.manualOrder ?? plan.map((j) => j.id))];
      const i = order.indexOf(a.id); const j = i + a.dir;
      if (i < 0 || j < 0 || j >= order.length) return fail('Cannot move further.');
      [order[i], order[j]] = [order[j], order[i]];
      return log(`Moved ${a.id} ${a.dir < 0 ? 'earlier' : 'later'}`, {manualOrder: order, approved: null});
    }
    case 'reset-order':
      return log('Restored the recommended sequence', {manualOrder: null, approved: null});
    case 'approve': {
      if (!allow('approve')) return fail('Only the production planner or plant manager approves the daily schedule.');
      const why = (a.reason || '').trim();
      if (why.length < 8) return fail('Add a short note for the shift (at least 8 characters).');
      if (a.lateJobs > 0 && !a.acceptLate) return fail('This schedule makes jobs late. Tick the box to confirm you accept that, or change the sequence.');
      return log(`Approved schedule (${a.summary}) — ${why}`, {approved: {by: actor, reason: why, at: now(), summary: a.summary}});
    }
    default:
      return fail('Unknown action.');
  }
}

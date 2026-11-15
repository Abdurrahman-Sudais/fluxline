import test from 'node:test';
import assert from 'node:assert/strict';
import site from '../src/content.js';
import {DOWNTIME, RUSH, START_STATE, history, jobs, people, roles} from '../src/data.js';
import {COEF, MAE, act, fifo, fit, initial, optimise, predict, schedule} from '../src/engine.js';

test('the changeover model recovers the drivers and is accurate on held-out records', () => {
  assert.ok(MAE < 4, `MAE ${MAE}`);
  assert.ok(COEF[1] > COEF[2], 'washing up to a lighter ink costs more than going darker');
  assert.ok(COEF[3] > 10 && COEF[5] > 8, 'material and plate changes are expensive');
  const same = jobs.find((j) => j.id === 'J-405'); const twin = jobs.find((j) => j.id === 'J-410');
  assert.ok(predict(same, twin) < predict(twin, jobs.find((j) => j.id === 'J-407')));
  assert.equal(fit(history.slice(0, 200)).length, 6);
});

test('the sequencer beats order-received on changeover and lateness, in every scenario', () => {
  for (const [list, dt] of [[jobs, null], [[...jobs, RUSH], null], [jobs, DOWNTIME], [[...jobs, RUSH], DOWNTIME]]) {
    const f = schedule(fifo(list), START_STATE, {downtime: dt}); const o = schedule(optimise(list, START_STATE, {downtime: dt}), START_STATE, {downtime: dt});
    assert.ok(o.changeover + 20 * o.late < f.changeover + 20 * f.late);
    assert.equal(o.items.length, list.length);
  }
  const base = schedule(optimise(jobs, START_STATE), START_STATE);
  assert.equal(base.lateJobs, 0);
});

test('downtime is never used for running or changing over', () => {
  const s = schedule(optimise(jobs, START_STATE, {downtime: DOWNTIME}), START_STATE, {downtime: DOWNTIME});
  for (const it of s.items) {
    assert.ok(!(it.coStart < DOWNTIME.to && it.coStart + it.co > DOWNTIME.from));
    assert.ok(!(it.runStart < DOWNTIME.to && it.end > DOWNTIME.from));
  }
});

test('approval: planner only, needs a note, and late jobs must be acknowledged', () => {
  const ctx = (s) => ({roles, actor: people[s.role], plan: optimise(jobs, START_STATE)});
  let s = initial(roles);
  assert.match(act(s, {type: 'approve', reason: 'ok', lateJobs: 0}, ctx(s)).error, /note/);
  assert.match(act(s, {type: 'approve', reason: 'Wash-up crew on at 13:00', lateJobs: 2}, ctx(s)).error, /late/);
  assert.ok(act(s, {type: 'approve', reason: 'Wash-up crew on at 13:00', lateJobs: 2, acceptLate: true, summary: 'x'}, ctx(s)).ok);
  const sup = act(s, {type: 'role', role: 'supervisor'}, ctx(s)).state;
  assert.match(act(sup, {type: 'approve', reason: 'Looks good to me', lateJobs: 0}, ctx(sup)).error, /planner/);
  s = act(s, {type: 'move', id: optimise(jobs, START_STATE)[1].id, dir: -1}, ctx(s)).state;
  assert.ok(s.manualOrder);
  s = act(s, {type: 'scenario', key: 'rush', value: true}, ctx(s)).state;
  assert.equal(s.manualOrder, null);
});

test('founder and contact', () => {
  assert.equal(site.team[0].name, 'Damilola Adebayo');
  assert.equal(site.email, 'augustina@fluxline.space');
});

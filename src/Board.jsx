import React, {useEffect, useMemo, useState} from 'react';
import site from './content.js';
import {DOWNTIME, LINE, RUSH, SHADES, START_STATE, clock, jobs, people, performance, roles} from './data.js';
import {COEF, FEATURES, MAE, act, can, features, fifo, initial, optimise, predict, schedule} from './engine.js';
import {Gantt, SHADE_FILL, SHADE_INK} from './Gantt.jsx';
import {Logo} from './App.jsx';

const KEY = 'fluxline-board-v1';
const m0 = (m) => `${Math.round(m)} min`;

export default function Board() {
  const [state, setState] = useState(() => initial(roles));
  const [tab, setTab] = useState('schedule');
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  const [acceptLate, setAcceptLate] = useState(false);
  const [pair, setPair] = useState(['J-404', 'J-403']);
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && 'rush' in s) setState(s); } catch { /* ignore */ } }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }, [state]);

  const list = state.rush ? [...jobs, RUSH] : jobs;
  const opts = {downtime: state.downtime ? DOWNTIME : null};
  const plan = useMemo(() => optimise(list, START_STATE, opts), [state.rush, state.downtime]); // eslint-disable-line react-hooks/exhaustive-deps
  const order = state.manualOrder ? state.manualOrder.map((id) => list.find((j) => j.id === id)) : plan;
  const s = schedule(order, START_STATE, opts);
  const rec = schedule(plan, START_STATE, opts);
  const base = schedule(fifo(list), START_STATE, opts);
  const actor = people[state.role];
  const allow = (p) => can(roles, state.role, p);
  const run = (a, after) => { const r = act(state, a, {roles, actor, plan}); setMsg(r.ok ? '' : r.error); if (r.ok) { setState(r.state); after?.(); } };
  const summary = `${order.length} jobs · ${m0(s.changeover)} changeover · ${s.lateJobs} late · ends ${clock(s.end)}`;
  const exportCsv = () => { const rows = [['position', 'job', 'product', 'changeover start', 'changeover min', 'run start', 'end', 'late min'], ...s.items.map((it, i) => [i + 1, it.job.id, it.job.product, clock(it.coStart), Math.round(it.co), clock(it.runStart), clock(it.end), Math.round(it.late)])].map((x) => x.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')); const url = URL.createObjectURL(new Blob([rows.join('\n')], {type: 'text/csv'})); const a = document.createElement('a'); a.href = url; a.download = 'fluxline-schedule.csv'; a.click(); URL.revokeObjectURL(url); };
  const [pa, pb] = pair.map((id) => [...jobs, RUSH].find((j) => j.id === id));
  const fx = features(pa, pb);

  return (
    <div className="bd">
      <header className="bd-top">
        <a href="/" className="brand" aria-label="Back to the Fluxline website"><Logo size={26} /><span>FLUXLINE</span></a>
        <span className="mono">{LINE.name} · tomorrow, shift {LINE.shiftStart}–22:00</span>
        <label className="bd-role">Signed in as <select value={state.role} onChange={(e) => run({type: 'role', role: e.target.value})}>{roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
        <button className="btn ghost sm" onClick={() => { setState(initial(roles)); setMsg(''); }}>Reset</button>
      </header>
      <p className="bd-banner">Fictional jobs and history. Fluxline recommends; a planner approves the schedule. It does not connect to or control any machine.</p>
      <main className="bd-main">
        <div className="bd-head">
          <h1>{site.app.title}</h1>
          <div className="bd-tabs" role="group" aria-label="View">{[['schedule', 'Schedule'], ['model', 'Changeover model'], ['actuals', 'Planned vs actual']].map(([id, l]) => <button key={id} className={tab === id ? 'on' : ''} aria-pressed={tab === id} onClick={() => setTab(id)}>{l}</button>)}</div>
        </div>
        {msg && <p className="bd-err" role="alert">{msg}</p>}

        {tab === 'schedule' && (
          <div className="bd-grid">
            <section className="bd-card bd-wide" aria-labelledby="tl-h">
              <div className="bd-row"><h2 id="tl-h">Timeline</h2>
                <div className="toggles">
                  <label><input type="checkbox" checked={state.rush} disabled={!allow('plan')} onChange={(e) => run({type: 'scenario', key: 'rush', value: e.target.checked})} /> Urgent order J-411 (due 12:00)</label>
                  <label><input type="checkbox" checked={state.downtime} disabled={!allow('plan')} onChange={(e) => run({type: 'scenario', key: 'downtime', value: e.target.checked})} /> {DOWNTIME.label}</label>
                </div>
              </div>
              <Gantt sched={s} downtime={opts.downtime} label={state.manualOrder ? 'Your sequence' : 'Recommended sequence'} />
              <Gantt sched={base} downtime={opts.downtime} label="In the order received" compact />
              <dl className="kpis">
                <div><dt>Changeover</dt><dd>{m0(s.changeover)}<small>vs {m0(base.changeover)} in order received</small></dd></div>
                <div><dt>Late jobs</dt><dd className={s.lateJobs ? 'bad' : ''}>{s.lateJobs}<small>{s.late ? `${m0(s.late)} late in total` : 'every due time met'}</small></dd></div>
                <div><dt>Shift ends</dt><dd className={s.end > LINE.shiftMinutes ? 'bad' : ''}>{clock(s.end)}<small>{s.end > LINE.shiftMinutes ? 'runs past 22:00' : 'inside the shift'}</small></dd></div>
                <div><dt>Estimate error</dt><dd>±{MAE.toFixed(1)}<small>min per changeover, on held-out records</small></dd></div>
              </dl>
            </section>

            <section className="bd-card" aria-labelledby="sq-h">
              <div className="bd-row"><h2 id="sq-h">Sequence</h2>{state.manualOrder && <button className="btn ghost sm" onClick={() => run({type: 'reset-order'})}>Use recommendation</button>}</div>
              {state.manualOrder && <p className="note">You changed the order: {m0(s.changeover - rec.changeover)} more changeover{s.lateJobs > rec.lateJobs ? `, ${s.lateJobs - rec.lateJobs} more late` : ''} than the recommendation.</p>}
              <ol className="sqlist">{s.items.map((it, i) => (
                <li key={it.job.id} className={it.late ? 'late' : ''}>
                  <span className="co">+{Math.round(it.co)}′</span>
                  <span className="sw" style={{background: SHADE_FILL[it.job.shade], color: SHADE_INK[it.job.shade]}}>{it.job.id.slice(2)}</span>
                  <span className="jb"><b>{it.job.product}</b><small>{it.job.customer} · {SHADES[it.job.shade]} · {it.job.material} · {it.job.width} mm · {it.job.plates}</small><small>{clock(it.runStart)}–{clock(it.end)} · due {clock(it.job.due)}{it.late ? ` · late ${Math.round(it.late)} min` : ''}</small></span>
                  <span className="mv"><button aria-label={`Move ${it.job.id} earlier`} disabled={!allow('plan') || i === 0} onClick={() => run({type: 'move', id: it.job.id, dir: -1})}>↑</button><button aria-label={`Move ${it.job.id} later`} disabled={!allow('plan') || i === s.items.length - 1} onClick={() => run({type: 'move', id: it.job.id, dir: 1})}>↓</button></span>
                </li>
              ))}</ol>
            </section>

            <aside className="bd-card" aria-label="Approval and log">
              <h2>Approve for the shift</h2>
              {state.approved ? <p className="ok">Approved by {state.approved.by}: {state.approved.summary} — “{state.approved.reason}”</p> : (<>
                <p className="mono">{summary}</p>
                <textarea rows="3" aria-label="Note for the shift" placeholder="Note for the shift (required)" value={note} onChange={(e) => setNote(e.target.value)} disabled={!allow('approve')} />
                {s.lateJobs > 0 && <label className="chk"><input type="checkbox" checked={acceptLate} onChange={(e) => setAcceptLate(e.target.checked)} disabled={!allow('approve')} /> I accept that {s.lateJobs} job{s.lateJobs > 1 ? 's' : ''} will be late.</label>}
                <button className="btn" disabled={!allow('approve')} onClick={() => run({type: 'approve', reason: note, lateJobs: s.lateJobs, acceptLate, summary}, () => setNote(''))}>Approve schedule</button>
                {!allow('approve') && <p className="fine">Only the production planner or plant manager approves.</p>}
              </>)}
              {state.approved && allow('export') && <button className="btn ghost sm" onClick={exportCsv}>Export run sheet (CSV)</button>}
              <h3>Log</h3>
              <ul className="log">{state.log.slice(0, 8).map((l, i) => <li key={i}><time>{new Date(l.at).toLocaleTimeString()}</time> <b>{l.actor}</b> · {l.summary}</li>)}{!state.log.length && <li className="fine">Scenarios, moves and approvals appear here.</li>}</ul>
            </aside>
          </div>
        )}

        {tab === 'model' && (
          <div className="bd-grid two">
            <section className="bd-card" aria-labelledby="md-h">
              <h2 id="md-h">What the model learned</h2>
              <p className="fine">A linear model fitted to 200 past changeovers on this line, checked on 40 it never saw (typical error ±{MAE.toFixed(1)} min).</p>
              <ul className="coef">{FEATURES.map((f, i) => <li key={f}><span>{f}</span><i style={{width: `${Math.min(100, (COEF[i] / 25) * 100)}%`}} /><b>{COEF[i].toFixed(1)} min</b></li>)}</ul>
            </section>
            <section className="bd-card" aria-labelledby="pr-h">
              <h2 id="pr-h">Estimate a changeover</h2>
              <div className="pair">{[0, 1].map((k) => <label key={k}>{k ? 'To' : 'From'}<select value={pair[k]} onChange={(e) => setPair(k ? [pair[0], e.target.value] : [e.target.value, pair[1]])}>{[...jobs, RUSH].map((j) => <option key={j.id} value={j.id}>{j.id} · {j.product}</option>)}</select></label>)}</div>
              <p className="est"><b>{Math.round(predict(pa, pb))}</b> min <small>± {MAE.toFixed(1)}</small></p>
              <ul className="parts">{FEATURES.map((f, i) => fx[i] ? <li key={f}><span>{f}{i && fx[i] !== 1 ? ` × ${fx[i]}` : ''}</span><b>{(fx[i] * COEF[i]).toFixed(1)}</b></li> : null)}</ul>
            </section>
          </div>
        )}

        {tab === 'actuals' && (
          <section className="bd-card" aria-labelledby="ac-h">
            <h2 id="ac-h">Planned vs actual, last five shifts</h2>
            <table className="act"><thead><tr><th scope="col">Shift</th><th scope="col">Planned</th><th scope="col">Actual</th><th scope="col">Gap</th><th scope="col">Changeover planned</th><th scope="col">Changeover actual</th></tr></thead>
              <tbody>{performance.map((p) => <tr key={p.day}><th scope="row">{p.day}</th><td>{p.planned}</td><td>{p.actual}</td><td className={p.actual - p.planned > 30 ? 'bad' : ''}>{p.actual - p.planned > 0 ? '+' : ''}{p.actual - p.planned}</td><td>{p.changeoverPlanned}</td><td>{p.changeoverActual}</td></tr>)}</tbody></table>
            <p className="fine">Minutes. Most of the gap is changeover over-runs; those records are added to the model’s training data each week.</p>
          </section>
        )}
      </main>
    </div>
  );
}

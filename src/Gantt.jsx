import React from 'react';
import {LINE, SHADES, clock} from './data.js';

export const SHADE_FILL = {1: '#e3f4fb', 2: '#a6dcf1', 3: '#36b3e3', 4: '#0b6694', 5: '#141414'};
export const SHADE_INK = {1: '#111', 2: '#111', 3: '#111', 4: '#fff', 5: '#fff'};

/** A horizontal timeline of one shift: jobs as blocks shaded by ink, changeovers hatched, downtime banded. */
export function Gantt({sched, downtime = null, label, span = LINE.shiftMinutes, compact = false, animate = false}) {
  const max = Math.max(span, sched.end);
  const x = (m) => `${(m / max) * 100}%`;
  const w = (m) => `${(m / max) * 100}%`;
  const hours = [];
  for (let m = 0; m <= max; m += 120) hours.push(m);
  return (
    <div className={`gantt${compact ? ' compact' : ''}`} {...(animate ? {'data-ink': ''} : {})}>
      {label && <p className="g-label">{label}</p>}
      <div className="g-track" role="img" aria-label={`${label ? `${label}: ` : ''}${sched.items.length} jobs, ${Math.round(sched.changeover)} minutes of changeover, ${sched.lateJobs} late, finishing at ${clock(sched.end)}`}>
        {span < max && <span className="g-over" style={{left: x(span), width: w(max - span)}} aria-hidden="true" />}
        {downtime && <span className="g-down" style={{left: x(downtime.from), width: w(downtime.to - downtime.from)}} aria-hidden="true" />}
        {sched.items.map((it, i) => (
          <React.Fragment key={it.job.id}>
            <span className="g-co" style={{left: x(it.coStart), width: w(it.co), '--i': i}} title={`Changeover ${Math.round(it.co)} min`} />
            <span className={`g-job${it.late ? ' late' : ''}`} style={{left: x(it.runStart), width: w(it.job.run), background: SHADE_FILL[it.job.shade], color: SHADE_INK[it.job.shade], '--i': i}} title={`${it.job.id} ${it.job.product} · ${SHADES[it.job.shade]} · ${clock(it.runStart)}–${clock(it.end)}${it.late ? ` · late ${Math.round(it.late)} min` : ''}`}>
              {!compact && <b>{it.job.id.slice(2)}</b>}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="g-axis" aria-hidden="true">{hours.map((m) => <span key={m} style={{left: x(m)}}>{clock(m)}</span>)}</div>
    </div>
  );
}

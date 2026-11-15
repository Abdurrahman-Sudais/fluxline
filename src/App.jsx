import React, {useState} from 'react';
import site from './content.js';
import {DOWNTIME, RUSH, START_STATE, SHADES, jobs, performance} from './data.js';
import {COEF, FEATURES, MAE, fifo, optimise, predict, schedule} from './engine.js';
import {ACROSS, SERVICES, STAGES, WHY} from './aws.js';
import {PROGRESS} from './forms.js';
import {Gantt, SHADE_FILL, SHADE_INK} from './Gantt.jsx';
import Board from './Board.jsx';
import PilotForm from './PilotForm.jsx';
import ContactForm from './ContactForm.jsx';

export function Logo({size = 30}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#111" />
      <rect x="7" y="9" width="10" height="6" fill="#00a0dc" /><rect x="21" y="9" width="12" height="6" fill="#e4007c" />
      <rect x="7" y="18" width="16" height="6" fill="#ffd200" /><rect x="27" y="18" width="6" height="6" fill="#fff" />
      <rect x="7" y="27" width="6" height="5" fill="#fff" /><rect x="16" y="27" width="17" height="5" fill="#00a0dc" />
    </svg>
  );
}

const BASE_FIFO = schedule(fifo(jobs), START_STATE);
const BASE_OPT = schedule(optimise(jobs, START_STATE), START_STATE);
const min = (m) => `${Math.round(m)} min`;
const hrs = (m) => `${(m / 60).toFixed(1)} h`;

function Reg({className = ''}) {
  return <svg className={`reg ${className}`} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" /><path d="M12 0v24M0 12h24" /></svg>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [['Changeovers', '/#changeovers'], ['Sequencing', '/#sequencing'], ['Scenarios', '/#scenarios'], ['Technology', '/#technology'], ['Pricing', '/#pricing'], ['Contact', '/#contact']];
  return (
    <header className="hd">
      <a href="/" className="brand" aria-label="Fluxline home"><Logo /><span>FLUXLINE</span></a>
      <nav id="nav" className={open ? 'nav open' : 'nav'} aria-label="Main">
        {links.map(([t, h]) => <a key={t} href={h} onClick={() => setOpen(false)}>{t}</a>)}
        <a className="nav-app" href="/app" onClick={() => setOpen(false)}>Open the schedule board</a>
      </nav>
      <a className="hd-cta" href="/app">Schedule board</a>
      <button className="menu" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
    </header>
  );
}

function Hero() {
  const saved = BASE_FIFO.changeover - BASE_OPT.changeover;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="colorbar" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="hero-top">
        <div>
          <p className="kicker">Manufacturing production planning</p>
          <h1 id="hero-title">Plan production around costly changeovers.</h1>
        </div>
        <div className="hero-side">
          <p className="lede">{site.about}</p>
          <div className="ctas"><a className="btn" href="/app">Open the schedule board</a><a className="btn ghost" href="#pilot">Request a pilot</a></div>
        </div>
      </div>
      <figure className="press" aria-label="The same ten jobs in two orders">
        <Reg className="tl" /><Reg className="tr" />
        <Gantt sched={BASE_FIFO} label="In the order received" animate />
        <Gantt sched={BASE_OPT} label="Sequenced by Fluxline" animate />
        <figcaption>
          <span><b>{min(BASE_FIFO.changeover)}</b> → <b className="mag">{min(BASE_OPT.changeover)}</b> of changeover</span>
          <span><b>{BASE_FIFO.lateJobs}</b> → <b className="mag">{BASE_OPT.lateJobs}</b> late jobs</span>
          <span><b className="mag">{hrs(saved)}</b> of press time back</span>
          <span className="fine">Ten fictional jobs on one flexo press. Hatched = changeover. Shade = ink darkness.</span>
        </figcaption>
      </figure>
    </section>
  );
}

const SAMPLE = ['J-404', 'J-401', 'J-405', 'J-402', 'J-403', 'J-409'].map((id) => jobs.find((j) => j.id === id));

function Changeovers() {
  const vals = SAMPLE.flatMap((a) => SAMPLE.map((b) => (a === b ? 0 : predict(a, b))));
  const hi = Math.max(...vals);
  return (
    <section className="sec" id="changeovers" aria-labelledby="co-title">
      <p className="kicker">The problem</p>
      <h2 id="co-title">Some job changes take ten minutes. Others take an hour.</h2>
      <div className="split">
        <div>
          <p className="intro">Going from a dark ink to a light one means a full wash-up. A new substrate means re-threading; a different width or plate set means re-tooling. The order you run jobs in decides how much of the shift goes on making product — and in most small plants it is decided on a whiteboard.</p>
          <ul className="drivers">{FEATURES.slice(1).map((f, i) => <li key={f}><span>{f}</span><b>+{COEF[i + 1].toFixed(1)} min</b></li>)}</ul>
          <p className="fine">What drives changeover time on this fictional line, learned from 200 past changeovers. Typical error on 40 held-out changeovers: ±{MAE.toFixed(1)} min.</p>
        </div>
        <div className="matrix" data-ink>
          <table>
            <caption>Estimated changeover minutes, from row job to column job</caption>
            <thead><tr><th />{SAMPLE.map((b) => <th key={b.id} scope="col"><span className="sw" style={{background: SHADE_FILL[b.shade]}} />{b.id.slice(2)}</th>)}</tr></thead>
            <tbody>{SAMPLE.map((a) => (
              <tr key={a.id}><th scope="row"><span className="sw" style={{background: SHADE_FILL[a.shade]}} />{a.id.slice(2)} <small>{a.product}</small></th>
                {SAMPLE.map((b) => { const v = a === b ? null : predict(a, b); return <td key={b.id} style={v ? {'--h': v / hi} : undefined}>{v ? Math.round(v) : '—'}</td>; })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Sequencing() {
  return (
    <section className="sec ink" id="sequencing" aria-labelledby="seq-title">
      <p className="kicker">Production sequencing</p>
      <h2 id="seq-title">An order for the day that respects every due time.</h2>
      <p className="intro">Fluxline searches thousands of possible job orders, scoring each by total changeover time and any lateness — with lateness weighted twenty times heavier. The planner sees the recommendation, the reasoning and the alternative, then approves.</p>
      <ol className="seq" data-ink>{BASE_OPT.items.map((it, i) => (
        <li key={it.job.id} style={{'--i': i}}>
          <span className="seq-co">{i === 0 ? 'from yesterday' : ''} +{Math.round(it.co)}′</span>
          <span className="seq-job" style={{background: SHADE_FILL[it.job.shade], color: SHADE_INK[it.job.shade]}}><b>{it.job.id}</b>{it.job.product}<small>{SHADES[it.job.shade]} · {it.job.material} · {it.job.width} mm</small></span>
        </li>
      ))}</ol>
      <p className="fine">Light to dark, same substrate and plates together, urgent jobs early. Fictional jobs.</p>
    </section>
  );
}

function Scenarios() {
  const rows = [
    ['Tomorrow as planned', jobs, null],
    ['Urgent order arrives (due 12:00)', [...jobs, RUSH], null],
    ['Press down 10:00–12:00', jobs, DOWNTIME],
    ['Both at once', [...jobs, RUSH], DOWNTIME],
  ].map(([t, js, dt]) => { const opts = {downtime: dt}; return {t, f: schedule(fifo(js), START_STATE, opts), o: schedule(optimise(js, START_STATE, opts), START_STATE, opts)}; });
  return (
    <section className="sec" id="scenarios" aria-labelledby="sc-title">
      <p className="kicker">Scenario comparison</p>
      <h2 id="sc-title">See what an urgent order or a breakdown really costs.</h2>
      <p className="intro">Add an order or block out the press, and Fluxline re-plans in seconds — showing changeover time, late jobs and when the shift finishes, before anyone commits.</p>
      <div className="sc" data-ink>
        <div className="sc-row sc-h" aria-hidden="true"><span>Scenario</span><span>Order received</span><span>Fluxline</span></div>
        {rows.map(({t, f, o}) => (
          <div key={t} className="sc-row"><span><b>{t}</b></span>
            <span>{min(f.changeover)} changeover · {f.lateJobs} late</span>
            <span className="mag-t"><b>{min(o.changeover)}</b> changeover · <b>{o.lateJobs}</b> late</span></div>
        ))}
      </div>
      <p className="fine">When something has to give, Fluxline says which job will be late and by how much — the planner decides.</p>
    </section>
  );
}

function Performance() {
  const top = Math.max(...performance.map((p) => Math.max(p.planned, p.actual)));
  return (
    <section className="sec" aria-labelledby="perf-title">
      <div className="split">
        <div>
          <p className="kicker">Performance tracking</p>
          <h2 id="perf-title">Planned against actual, every shift.</h2>
          <p className="intro">Each shift’s actual run and changeover times are recorded against the plan. The gaps show where estimates are off — and every new record makes the next estimate better.</p>
        </div>
        <div className="perf" role="img" aria-label="Planned versus actual minutes for the last five shifts" data-ink>
          {performance.map((p) => (
            <div key={p.day} className="perf-day">
              <div className="perf-bars"><i className="pl" style={{height: `${(p.planned / top) * 100}%`}} /><i className="ac" style={{height: `${(p.actual / top) * 100}%`}} /></div>
              <b>{p.day}</b><small>{p.actual - p.planned > 0 ? '+' : ''}{p.actual - p.planned}′</small>
            </div>
          ))}
          <p className="perf-key"><span><i className="pl" /> planned</span><span><i className="ac" /> actual</span></p>
        </div>
      </div>
    </section>
  );
}

const STEPS = [['Import', 'Upload your job list, changeover log and shift reports as spreadsheets.'], ['Learn', 'Fluxline fits a changeover model to your own records and shows its error.'], ['Sequence', 'It recommends an order for the next day that respects due times and downtime.'], ['Approve', 'The planner adjusts if needed and approves; actuals flow back after the shift.']];
const RULES = [['Planners approve', 'Nothing runs on Fluxline’s say-so. A planner approves each daily schedule and can move any job.'], ['Estimates show their error', 'Every changeover estimate is shown with the model’s typical error on records it never saw.'], ['Deadlines first', 'The sequencer would rather spend changeover minutes than miss a due time — and says so when it can’t avoid it.'], ['Your records, your model', 'Estimates learn from your own line, not an industry average.']];

function Steps() {
  return (
    <section className="sec" aria-labelledby="how-title">
      <p className="kicker">How it works</p>
      <h2 id="how-title">From a spreadsheet to tomorrow’s run sheet.</h2>
      <ol className="steps">{STEPS.map(([t, d], i) => <li key={t} data-ink><span>{['C', 'M', 'Y', 'K'][i]}</span><h3>{t}</h3><p>{d}</p></li>)}</ol>
      <h3 className="sub">Ground rules</h3>
      <div className="rules">{RULES.map(([t, d]) => <article key={t} data-ink><h3>{t}</h3><p>{d}</p></article>)}</div>
    </section>
  );
}

function Stats() {
  return (
    <section className="sec" aria-labelledby="stats-title">
      <p className="kicker">Why it matters</p>
      <h2 id="stats-title">Most plants are small, and changeover time can change.</h2>
      <div className="stats">{site.stats.map((s) => <article key={s.value} data-ink><b>{s.value}</b><p>{s.label}</p><a href={s.url} target="_blank" rel="noopener noreferrer">{s.source}</a></article>)}</div>
    </section>
  );
}

const WHO = [['Packaging manufacturers', 'Films, bags and cartons with frequent size and print changes.'], ['Printing businesses', 'Ink, plate and substrate changes between short runs.'], ['Plastics processors', 'Colour and material purges on extrusion and moulding lines.'], ['Contract manufacturers', 'Many customers, many recipes, cleaning between each.']];

function Who() {
  return (
    <section className="sec" aria-labelledby="who-title">
      <p className="kicker">Who it’s for</p>
      <h2 id="who-title">Small plants where changeovers eat the shift.</h2>
      <div className="who">{WHO.map(([t, d]) => <article key={t} data-ink><h3>{t}</h3><p>{d}</p></article>)}</div>
    </section>
  );
}

const PLANS = [['Line', '$290', 'per line / month', ['One production line', 'Spreadsheet imports', 'Changeover model', 'Daily sequencing and approval'], false], ['Plant', '$690', 'per month', ['Up to 4 lines', 'Everything in Line', 'Scenarios and downtime planning', 'Planned vs actual reporting'], true], ['Group', 'Custom', '', ['Several plants', 'ERP or MES integration on request', 'Single sign-on', 'Agreed data-handling terms'], false]];

function Pricing() {
  return (
    <section className="sec" id="pricing" aria-labelledby="pricing-title">
      <p className="kicker">Pricing</p>
      <h2 id="pricing-title">Priced by production line.</h2>
      <p className="intro">Illustrative pricing for a proposed product, to be agreed with pilot plants.</p>
      <div className="plans">{PLANS.map(([n, p, per, items, hl]) => <article key={n} className={hl ? 'plan hl' : 'plan'} data-ink><h3>{n}</h3><p className="price">{p}<small>{per}</small></p><ul>{items.map((x) => <li key={x}>{x}</li>)}</ul><a className={hl ? 'btn' : 'btn ghost'} href="#pilot">{n === 'Group' ? 'Contact us' : 'Request a pilot'}</a></article>)}</div>
    </section>
  );
}

function Technology() {
  return (
    <section className="sec" id="technology" aria-labelledby="tech-title">
      <p className="kicker">Technology</p>
      <h2 id="tech-title">How we use Amazon Web Services.</h2>
      <p className="intro">{WHY}</p>
      <ol className="flow">{STAGES.map(([t, svcs, d], i) => <li key={t} data-ink><span className="mono">Stage {i + 1}</span><h3>{t}</h3><p className="svcs">{svcs.map((s) => <span key={s}>{s}</span>)}</p><p>{d}</p></li>)}</ol>
      <div className="across" data-ink><p className="mono">Across every stage</p><ul>{ACROSS.map(([a, b]) => <li key={a}><b>{a}</b> {b}</li>)}</ul></div>
      <h3 className="sub">Services and their role in Fluxline</h3>
      <table className="svc"><thead><tr><th scope="col">Service</th><th scope="col">Role</th></tr></thead><tbody>{SERVICES.map(([a, b]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td></tr>)}</tbody></table>
      <p className="fine">Proposed, not deployed. This website and the schedule board run in your browser on fictional data.</p>
    </section>
  );
}

function Team() {
  return (
    <section className="sec" id="team" aria-labelledby="team-title">
      <p className="kicker">Team</p>
      <h2 id="team-title">The founder behind Fluxline.</h2>
      <div className="team">{site.team.map((p) => <article key={p.name} data-ink><span className="av" aria-hidden="true">{p.initials}</span><div><h3>{p.name}</h3><p className="role">{p.role}</p><p>{p.bio}</p><ul className="tags">{p.focus.map((f) => <li key={f}>{f}</li>)}</ul></div></article>)}</div>
    </section>
  );
}

function Pilot() {
  return (
    <section className="sec" id="pilot" aria-labelledby="pilot-title">
      <p className="kicker">Progress & pilot programme</p>
      <h2 id="pilot-title">Bring one line and its spreadsheets.</h2>
      <div className="pilot">
        <div>
          <p className="intro">Fluxline is in its building stage and opening its first pilots. A pilot covers one production line: we import your job lists and changeover records, fit the model, and your planner approves a recommended schedule each day while we compare plan and actual.</p>
          <h3 className="sub">Where Fluxline is today</h3>
          <table className="ticket"><tbody>{PROGRESS.map(([st, t, d]) => <tr key={t} className={st === 'Next' ? 'next' : ''}><th scope="row">{st}</th><td><b>{t}</b><span>{d}</span></td></tr>)}</tbody></table>
        </div>
        <div className="card-form"><PilotForm /></div>
      </div>
    </section>
  );
}

const FAQ = [['What data do we need?', 'A list of upcoming jobs with due dates, and a log of past changeovers — even a rough spreadsheet. The more history, the better the estimates.'], ['Does Fluxline control our machines?', 'No. It recommends a sequence and a planner approves it. It does not connect to or control equipment.'], ['What if a job has to go first?', 'The planner can move any job; Fluxline re-calculates changeover time and lateness straight away.'], ['Is Fluxline live?', 'Not yet. It is a proposed product; the schedule board is a prototype running in your browser on fictional jobs.']];

function Faq() {
  return (
    <section className="sec" aria-labelledby="faq-title">
      <p className="kicker">FAQ</p>
      <h2 id="faq-title">Frequently asked questions.</h2>
      <div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </section>
  );
}

function Contact() {
  return (
    <section className="sec" id="contact" aria-labelledby="contact-title">
      <div className="pilot">
        <div>
          <p className="kicker">Contact</p>
          <h2 id="contact-title">Talk to the Fluxline team.</h2>
          <p className="intro">Questions about the product, the pilot programme, spreadsheet imports or how production data is handled. Messages go directly to the founder.</p>
          <p className="contact-line"><span className="mono">Email</span><a href={`mailto:${site.email}`}>{site.email}</a></p>
        </div>
        <div className="card-form"><ContactForm /></div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="ft">
      <div className="colorbar" aria-hidden="true"><i /><i /><i /><i /></div>
      <a href="/" className="brand light" aria-label="Fluxline home"><Logo /><span>FLUXLINE</span></a>
      <p>{site.tagline}</p>
      <nav aria-label="Footer"><a href="/app">Schedule board</a><a href="/#technology">Technology (AWS)</a><a href="/#pricing">Pricing</a><a href="/#contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href={`mailto:${site.email}`}>{site.email}</a></nav>
      <p className="fine">© 2026 Fluxline. Founded by {site.team[0].name}. A proposed product: pricing is illustrative and the schedule board uses fictional data.</p>
    </footer>
  );
}

function Home() {
  return (<><Hero /><Changeovers /><Sequencing /><Scenarios /><Performance /><Steps /><Stats /><Who /><Pricing /><Technology /><Team /><Pilot /><Faq /><Contact /></>);
}

const LEGAL = {
  privacy: ['Privacy notice', [
    ['This website', 'Fluxline is a proposed product. This website and the schedule board run in your browser on fictional data.'],
    ['Schedule board', 'Your changes are kept in your browser’s local storage (key fluxline-board-v1) and never leave your device. “Reset” clears them.'],
    ['Forms', `Until a form service is connected, the pilot and contact forms open a pre-filled email to ${site.email}; nothing is sent until you send it. This notice will be updated before any customer-relationship service is connected.`],
    ['Cookies & analytics', 'None.'],
  ]],
  terms: ['Terms of use', [
    ['A proposed product', 'Nothing here is an offer of service. Pricing is illustrative.'],
    ['Demonstration only', 'The schedule board uses fictional jobs and must not be used to plan real production.'],
    ['Planners decide', 'Fluxline recommends; planners approve every schedule.'],
    ['No affiliation', 'Organisation types named are prospective customers; no affiliation is implied.'],
  ]],
};

function Legal({kind}) {
  const [title, items] = LEGAL[kind];
  return <section className="sec legal"><p className="kicker">Review draft</p><h1>{title}</h1>{items.map(([t, d]) => <div key={t}><h2>{t}</h2><p>{d}</p></div>)}</section>;
}

function NotFound() {
  return <section className="sec legal"><p className="kicker">404</p><h1>This page is out of register.</h1><p>We couldn’t find it.</p><p><a className="btn" href="/">Back to Fluxline</a></p></section>;
}

export default function App({path = '/'}) {
  if (path.startsWith('/app')) return <Board />;
  const page = path === '/' ? <Home /> : path === '/privacy' ? <Legal kind="privacy" /> : path === '/terms' ? <Legal kind="terms" /> : <NotFound />;
  return (<><a className="skip" href="#main">Skip to content</a><Header /><main id="main">{page}</main><Footer /></>);
}

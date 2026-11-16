// Pilot-request and contact-form rules, and the HubSpot Forms API payloads (see docs/crm-plan.md).
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const ORG_TYPES = ["Packaging manufacturer", "Printing business", "Plastics processor", "Contract manufacturer", "Other"];
export const COMPANY_SIZES = ['1–10 employees', '11–50 employees', '51–200 employees', '201–1,000 employees', '1,000+ employees'];
export const USE_CASES = ["Pilot on one production line", "Reducing changeover time", "Meeting delivery dates", "Handling urgent orders and downtime", "Planned vs actual tracking", "Other"];
export const TOPICS = ["Product question", "Pilot programme", "Spreadsheet imports and integrations", "Technical or security question", "Press or media", "Other"];

/** Where the company is today; the last entry is what comes next. [status, title, detail] */
export const PROGRESS = [["2026", "Company founded", "By Augustina Oyetade, to give small plants the scheduling tools large ones take for granted."], ["Done", "Planning method defined", "Changeover model from your own records, a sequencer that respects due dates and downtime, planner approval."], ["Done", "Schedule board prototype", "Sequencing, scenarios, approval and planned-vs-actual shown on a fictional flexo line."], ["Done", "AWS reference architecture", "Data intake, model training, optimisation and planner workspace designed."], ["Next", "First pilots", "One production line per pilot, from your spreadsheet exports, with schedules your planner approves daily."]];

export const blankPilot = () => ({name: '', email: '', company: '', size: '', kind: '', useCase: '', detail: '', message: '', consent: false, website: ''});
export const blankContact = () => ({name: '', email: '', company: '', topic: '', message: '', consent: false, website: ''});

export function validatePilot(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid work email.';
  if (!f.company.trim()) e.company = 'Please enter your company.';
  if (!COMPANY_SIZES.includes(f.size)) e.size = 'Choose a company size.';
  if (!ORG_TYPES.includes(f.kind)) e.kind = 'Choose the closest match.';
  if (!USE_CASES.includes(f.useCase)) e.useCase = 'Choose a use case.';
  if (f.message.length > 2000) e.message = 'Please keep it under 2,000 characters.';
  if (!f.consent) e.consent = 'Please confirm we may contact you.';
  return e;
}

export function validateContact(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email.';
  if (!TOPICS.includes(f.topic)) e.topic = 'Choose a topic.';
  if (f.message.trim().length < 10) e.message = 'Please write a short message (10+ characters).';
  if (f.message.length > 2000) e.message = 'Please keep it under 2,000 characters.';
  if (!f.consent) e.consent = 'Please confirm we may reply.';
  return e;
}

const fields = (pairs) => pairs.filter(([, v]) => v).map(([name, value]) => ({objectTypeId: '0-1', name, value}));
const names = (n) => { const [first, ...rest] = n.trim().split(/\s+/); return [['firstname', first], ['lastname', rest.join(' ')]]; };

export const pilotPayload = (f, context) => ({fields: fields([...names(f.name), ['email', f.email.trim()], ['company', f.company.trim()], ['company_size', f.size], ['organisation_type', f.kind], ['primary_use_case', f.useCase], ["production_line_detail", f.detail.trim()], ['enquiry_message', f.message.trim()]]), context,
  legalConsentOptions: {consent: {consentToProcess: true, text: 'Fluxline may contact me about this request.', communications: []}}});

export const contactPayload = (f, context) => ({fields: fields([...names(f.name), ['email', f.email.trim()], ['company', f.company.trim()], ['contact_topic', f.topic], ['enquiry_message', f.message.trim()]]), context,
  legalConsentOptions: {consent: {consentToProcess: true, text: 'Fluxline may reply to this message.', communications: []}}});

/** HubSpot ids from the build environment; the contact form has its own GUID. */
export function hubspot(kind, env = (typeof import.meta !== 'undefined' && import.meta.env) || {}) {
  const portal = env.VITE_HUBSPOT_PORTAL_ID;
  const form = kind === 'contact' ? env.VITE_HUBSPOT_CONTACT_FORM_GUID : env.VITE_HUBSPOT_FORM_GUID;
  return portal && form ? {portal, form} : null;
}

export async function send(hs, payload) {
  const res = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(hs.portal)}/${encodeURIComponent(hs.form)}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
  return res.ok;
}

# Fluxline

**Plan production around costly changeovers.**

Fluxline helps small manufacturers (packaging makers, printing businesses, plastics processors and contract manufacturers) sequence production orders to reduce cleaning, tooling and setup time between jobs. A machine-learning model estimates changeover durations from production records. An optimisation engine then recommends schedules that account for deadlines and machine availability, and a planner approves them.

> Fluxline is a proposed product. Pricing is illustrative and the prototype uses fictional data. Founder: **Damilola Adebayo**. Website: `fluxline.space` · contact: `augustina@fluxline.space`. The LinkedIn page is not yet linked. Organisation types named on the site are prospective customers with no implied affiliation.

## Design

The look is the print shop: CMYK process colours, registration marks, colour bars and press timelines. Archivo is used at expanded widths for headlines and condensed widths for data, with JetBrains Mono for figures.

- **Hero:** the same ten jobs laid out twice, in the order received and as sequenced by Fluxline. Jobs drop onto the timeline, changeovers are hatched in magenta, and the minutes saved and late jobs avoided are computed live.
- **Changeover drivers:** what the model learned, plus a heat-map matrix of estimated changeover minutes between jobs.
- **Recommended sequence:** shown on a dark "ink" section.
- **Scenarios:** an urgent order, downtime, or both.
- **Planned vs actual:** a chart of the last five shifts.
- **Other sections:** CMYK-numbered steps, ground rules, sourced statistics (NAM and Shingo's SMED results), pricing, team, FAQ.
- **Technology:** "How we use Amazon Web Services" in five stages (S3, Lambda, SageMaker AI, DynamoDB, ECS/Fargate, API Gateway, Cognito), a row for the services that span every stage, and a table of each service's role.
- **Progress and pilot:** "Where Fluxline is today" as a job ticket beside the pilot form, followed by a contact form with a topic picker.

## Schedule board (`/app`)

The board plans one fictional 8-colour flexo press for tomorrow's shift (06:00–22:00).

- **Changeover model:** a linear model fitted in the browser to 200 past changeovers. Its inputs are ink shade lighter or darker, material, width and plate changes. It is checked on 40 held-out records (typical error about ±2 minutes), and the board shows its coefficients and lets you estimate any pair of jobs.
- **Sequencer:** starts from several orders (order received, earliest due, nearest changeover), then improves by moving single jobs. Lateness costs 20× more than changeover minutes.
- **Scenarios:** an urgent order (due 12:00) and press downtime (10:00–12:00). Downtime is never used for running or changeovers.
- **Planner control:** planners can move jobs and see the cost against the recommendation. Approval needs a note for the shift and explicit acceptance of any late jobs. Only the Production Planner or Plant Manager can approve, and the Plant Manager can export the run sheet as CSV.
- **Planned vs actual:** results for the last five shifts.

Every change is logged, and state persists in `localStorage`.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build   # Vite build, server render, static prerender of /, /app, /privacy, /terms and 404.html
npm test        # node --test: model accuracy, sequencer, downtime, approval rules, forms, AWS content
```

Docs: `docs/architecture.md` (proposed AWS architecture and design rules) and `docs/crm-plan.md` (HubSpot forms and properties). Until HubSpot is configured, the forms keep requests in the browser and open a pre-filled email. Set `VITE_HUBSPOT_PORTAL_ID`, `VITE_HUBSPOT_FORM_GUID` and `VITE_HUBSPOT_CONTACT_FORM_GUID` (see `.env.example`) and update the privacy notice first.

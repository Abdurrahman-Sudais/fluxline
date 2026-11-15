# Architecture

Status: **proposed**. The website and the prototype run entirely in the browser on fictional data. None of the AWS services below are deployed or connected.

## Today: browser-only prototype

- Vite + React, server-rendered to static HTML for every route (`scripts/prerender.mjs`).
- Fictional jobs, changeover history and shift performance live in `src/data.js`; the changeover model, sequencer and actions are pure functions in `src/engine.js`, tested with `node --test`.
- Changes persist in `localStorage`; roles are switched in the UI, not authenticated.

## Why AWS

Fluxline’s work is a cycle: production records come in every shift, changeover models are retrained as more records arrive, and sequencing is a compute-heavy search that runs whenever an order or a machine changes. Designing on AWS lets storage, model training and on-demand optimisation run as managed services, and keeps each manufacturer’s data isolated as they grow from one line to a whole plant.

## Proposed production service

| Stage | Services | What happens |
|---|---|---|
| 1. Import | Amazon S3, AWS Lambda | Spreadsheet exports of jobs, changeover logs and shift reports land in per-customer storage; Lambda validates and normalises them. |
| 2. Learn changeovers | Amazon SageMaker AI | A duration model is trained on past changeovers — shade, material, width and tooling either side — and reports its error on held-out records. |
| 3. Jobs & constraints | Amazon DynamoDB | Open orders, due dates, machine calendars, material availability and approved schedules are stored per line. |
| 4. Optimise | Amazon ECS, AWS Fargate | Containerised optimisation runs on demand to search job sequences that cut changeover time without missing due dates. |
| 5. Planner workspace | Amazon API Gateway, Amazon Cognito | Authenticated schedule, scenario and approval APIs serve the schedule board, with planner and supervisor roles. |
| Across every stage | AWS Lambda, Amazon CloudWatch, AWS KMS, Amazon SES | AWS Lambda runs validation and scenario triggers; Amazon CloudWatch monitors imports, training jobs and solver runs; AWS KMS encrypts each manufacturer’s production data; Amazon SES sends approved schedules to shift supervisors |

### Services and their role

- **Amazon S3** — Stores imported job lists, changeover logs, shift reports and exported schedules, separated by customer.
- **AWS Lambda** — Validates imports, triggers re-planning when an order or machine changes, and records planned-vs-actual results.
- **Amazon SageMaker AI** — Trains and hosts the changeover-duration model for each line, and tracks its accuracy as new records arrive.
- **Amazon DynamoDB** — Holds jobs, due dates, machine calendars, constraints, approved schedules and the decision log.
- **Amazon ECS** — Runs the sequencing optimiser as a containerised service, isolated from the rest of the platform.
- **AWS Fargate** — Supplies compute for each optimisation run on demand, so a long search never slows the workspace.
- **Amazon API Gateway** — Exposes the schedule, scenario and approval endpoints, plus the website’s pilot-request intake.
- **Amazon Cognito** — Signs users in and separates planner, plant-manager and supervisor roles.
- **Amazon SES** — Sends approved schedules and pilot-request notifications.
- **Amazon CloudWatch** — Collects logs and metrics for imports, model training, solver run time and API errors.
- **AWS KMS** — Encrypts production data at rest with customer-specific keys.

The same lists live in `src/aws.js` and are shown on the home page (`#technology`).

### Design rules

1. **Planners approve.** Fluxline recommends a sequence; a planner approves each day's schedule, and can reorder any job.
2. **Estimates show their error.** Every changeover estimate comes with the model's typical error on records it was not trained on.
3. **Deadlines before savings.** The sequencer penalises lateness far more than changeover minutes, and says plainly when a job will be late.
4. **Isolated by customer.** Each manufacturer's production data sits in its own partition with role checks on every request.

## Website lead capture

The pilot and contact forms post to HubSpot (see `docs/crm-plan.md`). If a server-side intake is needed later, Amazon API Gateway + AWS Lambda can validate submissions and Amazon SES can notify the founder.

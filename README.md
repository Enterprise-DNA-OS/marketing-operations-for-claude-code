# Marketing Operations for Claude Code

Own your prospect register, campaign review and sales handoff process. A database plus commands, with a fictional demo you can run locally.

## Three ways to own it

- **Do it yourself:** free MIT-licensed code, operated with Claude Code, Codex, OpenCode or Cursor. Hosting, agent subscriptions and your time remain your costs.
- **We customise it:** Enterprise DNA brings your Account Engagement records across, adds your fields and rules, and builds the screens or connections you need, on another stack if required.
- **We run it for you:** Omni by Enterprise DNA installs, connects and operates your version. One setup fee, then a monthly retainer.

[Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=salesforce-account-engagement).

## Run the fictional demo

Node 20 or newer. No database account required.

```bash
npm install
npm run demo
npm run marketing -- lead-queue
npm run marketing -- campaign-review
npm run marketing -- weekly-review --json
npm run view
npm run docs
npm test
```

Embedded PGlite persists in .data/db. DATABASE_URL selects PostgreSQL 15 or newer; DATA_DIR selects another local directory. For real records, start a fresh database with npm run migrate and import. Never seed your business database. Keep the owner connection private.

## The working week

Start with /attention, review /lead-queue, check /audience, chase /handoffs, then compare /campaign-review. /weekly-review combines results, eligible leads and outstanding checks. /draft-campaign writes an internal brief to drafts without sending anything.

Use /prospects, /prospect, /campaigns, /opportunities, /stale-prospects, /suppressed, /scoring-rules, /activity and /compliance for the records. Changes use /add-prospect, /assign, /qualify, /review-retention, /consent, /add-campaign, /set-campaign, /enrol, /log-activity, /set-score-rule, /handoff, /close-handoff, /add-opportunity and /set-opportunity. /import brings across a prospect export; /export archives everything. /customise and /new-view extend it.

npm run marketing -- help lists exact flags. Every mutation requires --actor and accepts --dry-run, which rolls back data and audit history. Every command accepts --json. Names match case-insensitively; id prefixes work. Ambiguous matches list candidates and exit 1. Actor labels do not authenticate a person.

## Rules you can inspect

The vendor score is a starting balance. New recorded activities add the configured points, saved with each event. Later rule changes affect future events only. Do not enter history already counted in the starting balance. Activity dates require a time zone and cannot be in the future.

Audience eligibility requires express consent, evidence, a retention purpose, a current review date, no opt-out or do-not-email flag and no disqualified lifecycle. Any suppressed record blocks every record sharing that email. The audience returns one record per email, preferring the highest score. The operator checks that each campaign fits the scope of consent.

Handoffs require an eligible prospect and allow one pending handoff per prospect. Accepted or declined handoffs need an outcome and cannot be closed twice. Each opportunity belongs to one campaign in that campaign's currency. No mixed-currency total, causal attribution or profit estimate is made. Won less spend is a simple comparison, not margin. Responses use recorded membership statuses, not tracking pixels.

## Ten questions answered from your records

These work today. They are not a claim that Salesforce cannot be configured to answer them.

1. Which high-scoring prospects have evidence that permits audience review? (/lead-queue)
2. Which strong prospects must stay out because permission or retention is unresolved? (/suppressed and /prospects)
3. Which campaign has more members than eligible addresses? (/campaign-review)
4. Which open campaign has exceeded its budget? (/attention)
5. Who owns each overdue sales handoff? (/handoffs)
6. Which prospects have gone quiet despite a strong starting score? (/stale-prospects)
7. How much won work and open pipeline belongs to each campaign in its own currency? (/campaign-review)
8. Which events added points to this prospect? (/prospect)
9. Who recorded a permission change, with what evidence? (/prospect)
10. Which duplicate email records are suppressed together? (/compliance and /suppressed)

## Your first hour: ten things to ask for

1. Put our name and logo in brand.json.
2. Show overdue sales handoffs.
3. Explain why a high-scoring prospect is excluded.
4. Show campaign results by currency.
5. Draft a campaign review for the owner.
6. Dry-run our prospect import and reconcile counts.
7. Record verified permission evidence and a retention review date.
8. Add our qualification rule with a migration and test.
9. Print a handoff brief and consent review sheet.
10. Add a read-only report and export all records.

## Import, documents and operation

[The switching guide](docs/replace-salesforce-account-engagement.md) explains the one-command prospect CSV import, supported headers, preserved source rows, repeat-import conflicts and separate migration work. The fixture is synthetic; validate your account's export first.

npm run docs renders campaign review packs, sales handoff briefs and prospect consent sheets. npm run view renders the week, campaign results and permission review dashboards. Set brand.json for your name, logo and colours. These HTML snapshots contain private records. Open them locally or print to PDF.

This is a campaign operations base, not a hosted sender, form service, tracker or visual journey engine. [Why no front end](docs/why-no-front-end.md) explains the boundary. Connections are scoped separately. [Record checks](docs/compliance.md) cite NZ consent and privacy guidance and distinguish house controls from legal requirements.

## Verification and licence

npm test uses an isolated temporary database, migrates twice, seeds twice and exercises every command. It checks consent suppression, duplicate handling, transactions, import reconciliation, score history, currency separation, audit protection and HTML output. Windows, Ubuntu and PostgreSQL CI are configured; execution results are reported separately. TEST_DATABASE_URL must select an empty disposable PostgreSQL database.

MIT. Copyright 2026 Enterprise DNA. Independent of Salesforce and Anthropic.

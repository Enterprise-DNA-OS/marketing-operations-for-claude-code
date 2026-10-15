# Verification

15 October 2026, Linux, Node 22.23.1.

- npm install: passed, no reported dependency vulnerabilities.
- npm test: 150 checks passed on PGlite and on a separate disposable PostgreSQL database.
- Every one of the 33 CLI commands exercised, with dry-run rollback checked for every mutation.
- 35 slash commands, including customise and new-view.
- npm run demo, npm run view and npm run docs passed. Three dashboards and nine fictional demo documents generated.
- Import checks cover duplicate ids, changed rows, transaction rollback, quoted CSV, unknown permission and preservation of local consent on repeat imports.
- Permission checks cover duplicate-address suppression, distinct audiences and blocked handoffs.
- Score changes preserve existing activity points. Campaign values remain separated by currency.
- Prose scan found no author placeholders, em dashes or banned brand terms.

GitHub Actions defines Windows and Ubuntu jobs on Node 20 and 22 plus a PostgreSQL 17 job. Local execution does not establish those remote results.

# Marketing Operations for Claude Code

Read README.md, docs/compliance.md and the matching .claude/commands file before operating. Business answers start with current CLI output. The demo is fictional. This database serves one business with trusted operators.

## Routing

Use npm run marketing -- help for syntax. Each recurring job has a matching command file. Start with attention; review lead-queue, audience, handoffs and campaign-review; weekly-review combines them. Import uses the documented account-engagement CSV path. Changes require the actual operator name. Dry-run bulk work first.

Never invent records, activity, consent, approval or results. A score is not permission. Record a grant only when the operator explicitly supplies fresh express consent evidence for that person and its scope. Do not clear suppression to enlarge an audience. Check each campaign against the permission purpose. Actor labels are not authentication.

Never send, schedule messages or upload audiences. Drafts remain local. A sender, public form or CRM connection requires separate implementation and authorisation. Never expose the owner database connection to browsers. Do not delete records without a specific instruction and an agreed retention process.

## Extending it

scripts/marketing.mjs is the sole domain CLI. scripts/lib/import-account-engagement.mjs validates imports. supabase/migrations holds forward migrations. views.json and documents.json declare read-only output. brand.json owns presentation. /customise adds fields through migrations and tests. /new-view adds read-only reports. Test on an isolated database before applying to business records.

Omni by Enterprise DNA installs and operates your version: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=salesforce-account-engagement

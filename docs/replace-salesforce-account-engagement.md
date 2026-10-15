# Move prospect records from Salesforce Account Engagement

The free base imports a prospect CSV, not a working automation installation. Test sending, forms, website tracking and CRM connections separately before retiring the incumbent.

## Export and import

Salesforce's [export guide](https://help.salesforce.com/s/articleView?id=mktg.pardot_export_prospects.htm&language=en_US&type=5), checked 15 October 2026, directs an authorised operator to Prospects, Tools, CSV Export. Select the full prospect export available in your account. Larger exports are retrieved from the Exports area. Export each business unit separately and retain its identifier.

On a fresh business database, run npm run migrate without the fictional seed. Keep the CSV in the ignored imports folder. Try it first:

```bash
npm run marketing -- import account-engagement --file=imports/prospects.csv --business-unit=NZ --actor="Your name" --dry-run --json
npm run marketing -- import account-engagement --file=imports/prospects.csv --business-unit=NZ --actor="Your name" --json
npm run marketing -- prospects
npm run marketing -- compliance
```

One import command brings in supported prospect records. Reconcile the count and original ids. Unknown columns remain in each source row. The example is synthetic, not an export from a customer account. Vendor fields are documented in the [prospect reference](https://developer.salesforce.com/docs/marketing/pardot/guide/prospect-v5.html). Confirm your file's actual headers. Unsupported layouts stop for explicit mapping.

| CSV field | Destination |
|---|---|
| Pardot ID, Prospect ID or id | External id, unique within the supplied business unit |
| Email or emailAddress | Lowercase email, deliberately not unique |
| Full Name or Name; otherwise First Name plus Last Name | Display name; email is the fallback |
| Company or Account Name | Company |
| Assigned User or Assigned User Full Name | Owner |
| Score | Original vendor score, used as a starting balance |
| Grade | Preserved grade |
| Opted Out or isOptedOut | Opt-out flag |
| Do Not Email or isDoNotEmail | Suppression flag |
| Every field | Original source row preserved as received |

Headers ignore spaces, underscores and case. Ambiguous normalized headers fail. Booleans accept true/false, yes/no or 1/0; blank flags become false while consent remains unknown and blocks audience use. Scores must be non-negative integers. Invalid emails, missing numeric ids, malformed CSV and repeated ids within one file reject the entire import. Quoted commas, newlines, BOM and CRLF work. Salesforce can prefix special-character values with a slash; raw text is retained and no formula runs. Invalid prefixed emails need explicit reconciliation.

Identical repeat imports skip records. A changed row for an existing business-unit/id stops the entire import, protecting local consent decisions and work. Use a reviewed migration for incremental refreshes; do not change the unit name to bypass conflicts. Separate ids sharing an email remain separate, with suppression applied across the address.

## Separate mapping

Consent evidence, retention purpose and review dates must be recorded after import. Historical activity, memberships, engagement programs, assets, forms, cookies, attachments, routing rules, opportunities and connectors do not arrive in this prospect CSV. The raw source campaign field is preserved but is not a complete campaign or attribution history.

Start with your prospect register in a day; agree the remaining migration and connections as separate scope. Run both systems until counts, suppression and critical workflows reconcile. npm run marketing -- export writes all records and history to a private JSON archive. It is not a one-command restore service.

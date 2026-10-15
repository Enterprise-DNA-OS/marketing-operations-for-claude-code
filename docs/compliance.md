# Marketing record checks

Sources checked 15 October 2026. These checks find missing records. They do not certify compliance or authorise a message.

| Check | Source | Behaviour |
|---|---|---|
| CONSENT_EVIDENCE | [NZ DIA, consent](https://www.dia.govt.nz/Spam-Three-Steps) | Unknown permission blocks audience inclusion. The shipped policy requires recorded express consent. NZ law also recognises inferred and deemed consent; the software does not decide either. An export flag saying someone has not opted out is not consent evidence. |
| Address suppression | [DIA, unsubscribe](https://www.dia.govt.nz/Spam-Three-Steps) | Recording a withdrawal immediately excludes every record sharing that email. NZ rules require unsubscribe requests to be honoured within five working days. This build neither receives requests automatically nor proves other senders have processed them. |
| RETENTION_REVIEW | [NZ Privacy Act principle 9](https://www.privacy.org.nz/privacy-principles/9/) | Missing purpose, missing review date and overdue reviews are flagged. Review dates are a house control, not a statutory retention period or deletion schedule. |
| MANUAL_SECURITY | [NZ Privacy Act principle 5](https://www.privacy.org.nz/privacy-principles/5/) | Always asks the operator to review access, backups and generated files. Queries cannot verify those controls. |
| UNASSIGNED, OVERDUE_HANDOFF, DUPLICATE_ADDRESS | House operating rules | Flags missing owners, late sales decisions and shared addresses. These are not legal findings. |

The business must assess the scope of consent against each campaign's purpose. The audience query checks recorded permission and retention, not whether a particular offer is covered. Before a message leaves a separate sender, confirm consent, accurate sender details and a working unsubscribe facility. Recheck suppression at send time. Nothing here sends or schedules messages. Australian deployments need a separate review of their applicable rules.

## Access and history

One business, trusted operators. Actor names are attribution, not authentication or proof of approval. Use named database roles, protected machines and tested backups. All business tables enable row security without public policies; views use the caller's access. The CLI's owner connection remains privileged. Never expose it to a browser.

Activities, consent events, original import rows and audit events reject ordinary updates and deletes. The database owner can change those protections, so this is not tamper-proof evidence. Mutations and audit entries commit together. Dry runs roll both back. A withdrawal updates one record and suppresses the shared email across all records. A fresh grant requires evidence and clears that record's opt-out and do-not-email flags; other records can still suppress the address. Never invent evidence or use a grant to clear suppression for convenience.

Source rows, audit details, exports, HTML and drafts also contain personal information. Protect the full output directory and include it in retention reviews. File modes restrict new exports where supported; Windows requires folder permissions. No automatic deletion or backup service is shipped. The JSON archive is complete, but a tested database backup remains the recovery mechanism.

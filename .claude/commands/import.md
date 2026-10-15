---
description: "Run the import marketing operations job from current records."
---

# /import

Bring in the supported Account Engagement prospect CSV. Read docs/replace-salesforce-account-engagement.md first. Always dry-run, review the counts, then apply the same file and business unit.

Read CLAUDE.md and docs/compliance.md. Run npm run marketing -- import account-engagement with the named flags shown by npm run marketing -- help.

Flags: --file, --business-unit, --actor, --dry-run. Every command accepts --json.

Use the actual operator name and requested values. Run --dry-run first for bulk work. Never invent evidence. Resolve names case-insensitively or use id prefixes. An ambiguous match must be clarified with the listed candidates. Never send, schedule or upload an audience.

---
description: "Run the log-activity marketing operations job from current records."
---

# /log-activity

Run the log-activity job from current business records.

Read CLAUDE.md and docs/compliance.md. Run npm run marketing -- log-activity with the named flags shown by npm run marketing -- help.

Flags: --prospect, --campaign, --kind, --happened-at, --evidence, --actor, --dry-run. Every command accepts --json.

Use the actual operator name and requested values. Run --dry-run first for bulk work. Never invent evidence. Resolve names case-insensitively or use id prefixes. An ambiguous match must be clarified with the listed candidates. Never send, schedule or upload an audience.

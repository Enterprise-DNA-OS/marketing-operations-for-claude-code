---
description: "Run the consent marketing operations job from current records."
---

# /consent

Record a real consent grant or withdrawal. A grant needs explicit operator instruction and fresh express consent evidence; never use it to bypass suppression. Withdrawals exclude the shared address immediately.

Read CLAUDE.md and docs/compliance.md. Run npm run marketing -- consent with the named flags shown by npm run marketing -- help.

Flags: --prospect, --action, --evidence, --actor, --dry-run. Every command accepts --json.

Use the actual operator name and requested values. Run --dry-run first for bulk work. Never invent evidence. Resolve names case-insensitively or use id prefixes. An ambiguous match must be clarified with the listed candidates. Never send, schedule or upload an audience.

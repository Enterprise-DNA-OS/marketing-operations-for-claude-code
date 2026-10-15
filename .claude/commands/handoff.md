---
description: "Run the handoff marketing operations job from current records."
---

# /handoff

Assign an eligible prospect to sales with an owner and agreed date. One pending handoff per prospect.

Read CLAUDE.md and docs/compliance.md. Run npm run marketing -- handoff with the named flags shown by npm run marketing -- help.

Flags: --prospect, --owner, --due-on, --note, --actor, --dry-run. Every command accepts --json.

Use the actual operator name and requested values. Run --dry-run first for bulk work. Never invent evidence. Resolve names case-insensitively or use id prefixes. An ambiguous match must be clarified with the listed candidates. Never send, schedule or upload an audience.

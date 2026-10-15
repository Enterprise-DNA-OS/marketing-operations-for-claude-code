---
description: "Run the audience marketing operations job from current records."
---

# /audience

Review distinct addresses eligible under the local permission policy. Confirm that the actual campaign purpose matches the consent evidence. This is not approval to send.

Read CLAUDE.md and docs/compliance.md. Run npm run marketing -- audience with the named flags shown by npm run marketing -- help.

Flags: --campaign, --min-score. Every command accepts --json.

Report the actual output and any missing evidence. Resolve names case-insensitively or use id prefixes. An ambiguous match must be clarified with the listed candidates. Never send, schedule or upload an audience.

# rules/ — Behavioural Rule Schemas

These JSON Schema files define the portable, language-agnostic structure for BriefingBuddy's NOTAM logic.

They mirror the Agent Digest and exist so implementations in any stack (Node/Python/etc.) can load a consistent ruleset.

## Files
- `notam_groups.schema.json` — allowed group names (airport + FIR)
- `qcode_mapping.schema.json` — Q-code subject → group
- `keyword_weights.schema.json` — fallback scoring rules
- `fir_prefix_mapping.schema.json` — FIR ID prefix → group + secondary keywords
- `time_window.schema.json` — window options + overlap rule + PERM semantics
- `icao_parsing.schema.json` — strict-first field/date parsing contract

## Rule of record
If behaviour diverges, Dart behaviour described in `docs/BriefingBuddy_NOTAM_Logic_Agent_Digest.md` is authoritative.

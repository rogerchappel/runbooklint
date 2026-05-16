# Policy Reference

RunbookLint merges `.runbooklint.json` over its built-in defaults.

## Fields

- `requiredHeadings`: section names that must appear in each runbook.
- `ownerHeadings`: acceptable headings that identify accountable people or teams.
- `environmentHeadings`: acceptable headings that describe scope and target environments.
- `validationHeadings`: headings that count as post-change validation coverage.
- `rollbackHeadings`: headings that count as rollback or recovery coverage.
- `commandRiskPatterns`: regular expressions for risky shell snippets.
- `bannedPhrases`: prose phrases to flag with suggestions.
- `requiredVariableDefinitions`: variables that must be defined in the document.
- `allowMissingOwner`: disables owner findings when true.

## Severity levels

`error` is for unsafe or incomplete runbooks. `warning` is for gaps that need review. `info` is for quality nudges.

`--fail-on` controls the lowest severity that exits non-zero.

# Security Policy

RunbookLint is a local-first CLI. It parses Markdown and emits reports; it does not execute commands from runbooks and does not call external services.

## Supported versions

Security fixes target the latest released minor version. Before a public release, fixes land on `main`.

## Reporting a vulnerability

Please report suspected vulnerabilities by opening a private GitHub security advisory or emailing the maintainer if advisories are unavailable. Include:

- The affected version or commit.
- A minimal reproduction.
- Expected and actual behavior.
- Whether the issue can expose secrets, corrupt files, or cause command execution.

Do not include real credentials, private incident details, or production runbooks in reports.

## Security boundaries

In scope:

- Unexpected file writes outside requested output paths.
- Unsafe parsing behavior that can crash on ordinary Markdown.
- Packaging mistakes that could cause the CLI to execute runbook content.

Out of scope:

- Findings that are false positives or false negatives unless they create a direct security vulnerability.
- Vulnerabilities in user-authored commands, because RunbookLint never runs them.
- Issues requiring local machine compromise before invoking the CLI.

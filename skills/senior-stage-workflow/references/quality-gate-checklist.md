# Quality Gate Checklist

## Minimal Gate (low risk)
- targeted lint
- targeted build/typecheck
- targeted smoke

## Standard Gate (medium risk)
- targeted lint
- full build
- targeted tests
- smoke suite in staging

## High-Risk Gate
- targeted lint
- full build
- targeted + integration tests
- smoke + rollback rehearsal in staging
- explicit go/no-go note before merge

## Smoke Template
- auth/login
- list/read endpoints of touched module
- create/update/delete path touched
- state transition assertions
- sensitive-field leak check

## Release Template
- Commit(s):
- Scope:
- Validation:
- Staging result:
- Merge result:
- Residual risks:

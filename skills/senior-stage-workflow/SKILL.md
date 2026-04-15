---
name: senior-stage-workflow
description: Apply a senior staged-delivery workflow for software changes. Use when a project needs safe incremental delivery with quality gates (lint/build/tests), smoke testing, staging deploy, controlled merge/release, and documented traceability.
---

# Senior Stage Workflow

## Execute In Stages

1. Define scope and risks.
- State the exact files/modules to touch.
- Identify blast radius and rollback path.

2. Implement the smallest shippable change.
- Prefer minimal diffs.
- Preserve backward compatibility unless the task requires breaking changes.

3. Run quality gate based on impact.
- Always run targeted lint/build for touched areas.
- Run targeted tests for changed business rules.
- Escalate to broader tests only when risk is cross-cutting.

4. Run smoke tests for critical paths.
- Validate login/session.
- Validate main CRUD/API paths touched.
- Validate key business state transitions (for example payment/purchase status).

5. Deploy to staging first.
- Never release directly to production.
- Confirm environment variables and migrations.
- Re-run smokes in staging.

6. Merge and release.
- Merge only after gates are green.
- Keep commit messages explicit and scoped.
- Push merge to `main`, then deploy.

7. Document traceability.
- Record: what changed, why, validations run, deployment impact, residual risk.
- Update session/todo/decision docs used by the project.

## Decision Rules

- If blocked by dirty workspace, isolate with a temporary worktree.
- If lint debt is historical, validate touched files directly and state global debt explicitly.
- If a production issue appears, do hotfix with minimal scope first, then refactor.
- If validation fails, do not merge; fix or rollback.

## Required Output Per Task

Return a short release note containing:
- Scope changed
- Validation evidence (commands + result)
- Merge/deploy status
- Next risk-aware step

## References

- Use [references/quality-gate-checklist.md](references/quality-gate-checklist.md) for gate templates.

# CLAUDE.md Quality Report

## Summary

- Files found: **1** — root `CLAUDE.md`, created by Harness Creator.
- Average score: **52/100 (C)**.
- Files needing update: **1**.
- Targeted updates have **not** been applied; the improver workflow requires owner confirmation after this report.

This is a manual project-context quality assessment, not the bundled harness structural score. `./init.sh` returned structural 100/100, which proves the expected sections/artifacts are present, not that this generic CLAUDE.md describes the product or that the application works.

## File-by-File Assessment

### 1. `./CLAUDE.md` — Project Root

**Score: 52/100 (Grade: C)**

| Criterion | Score | Notes |
|---|---:|---|
| Commands/workflows | 12/20 | `./init.sh` and the actual verifier command work. Their structural-only scope is not clear in CLAUDE.md; app check/test/build commands do not exist yet and must not be invented. |
| Architecture clarity | 4/20 | Describes generic harness artifacts but not the product, actual root `PRODUCT.md`, approved specification, implementation plan, or future upload/OCR/render boundary. |
| Non-obvious patterns | 0/15 | No Indonesian text-entry, row-over-global precedence, stale-upload protection, immutable source, native dimensions, or no-overlap invariant. |
| Conciseness | 12/15 | Short sections, but generic boilerplate uses space that could carry project-specific facts. |
| Currency | 12/15 | Generated commands/artifact names are current. Suggested `docs/PRODUCT.md` is not the actual root location; unconditional git-log startup assumes a repository/history that is not initialized. |
| Actionability | 12/15 | Bootstrap is runnable. Product routing, CodeGraph-first discovery, and application completion evidence need explicit instructions. |

## Verified Evidence

- Read the complete generated root CLAUDE.md; no nested agent instruction files were created or searched for.
- `./init.sh` ran the installed Harness Creator validator and exited successfully with every structural subsystem 5/5.
- `node --check scripts/verify-harness.mjs` passed.
- CodeGraph full indexing and actual file lookup succeeded: one bootstrap JavaScript file, six nodes, five edges. This is not a graph of application source.
- The project directory contains PRODUCT/docs/state/bootstrap artifacts, not `src/`, `package.json`, a local `.git/`, or a finished application.

## Recommended Targeted Changes

1. Name the product and current checkpoint, preventing a generic template from being mistaken for a runnable OCR app.
2. Route startup to the real PRODUCT/spec/plan paths and CodeGraph. Remove routine unconditional git-history inspection rather than adding a fake repository assumption.
3. Add only the binding non-obvious invariants; keep detailed architecture in the approved documents.
4. Distinguish structural startup from actual application tests/build and real upload/OCR/PNG smoke proof.

### Proposed Update: `./CLAUDE.md`

**Why:** Future sessions need the approved product constraints and real startup/evidence boundaries without rereading a long transcript. Existing working-rule, scope, and lifecycle sections remain intact.

```diff
 # CLAUDE.md
 
-Project harness for reliable agent-assisted development.
+Gold Price Generator: an Indonesian, mobile-first editor for the supplied
+Redmark/Gift Series price-list layout. Approved stack: React + Vite + TypeScript,
+browser-local Tesseract.js OCR, native-resolution Canvas PNG output.
+
+Current checkpoint: product/tooling initialized; application implementation waits
+for review of the implementation plan. The temporary mockup is not production OCR.
 
 ## Startup Workflow
 
 Before writing code:
 
-1. **Confirm working directory** with `pwd`
+1. **Confirm working directory** with `pwd`; work in this repository, not the `laragon` parent.
 2. **Read this file** completely
-3. **Read project docs if present** (`docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, README, or equivalent)
-4. **Run `./init.sh`** to verify environment is healthy
+3. **Read `PRODUCT.md`** and the approved specification and implementation plan under `docs/superpowers/`.
+4. **Run `./init.sh`**; it currently validates harness structure, not application behavior.
 5. **Read `feature_list.json`** to see current feature state
-6. **Review recent commits** with `git log --oneline -5`
+6. **Use CodeGraph first** for code discovery (`codegraph explore "<file or symbol>"`).
+   Use ordinary file tools only when its index is explicitly inactive or cannot answer;
+   refresh with `codegraph sync .` after actual source changes.
+
+## Product Invariants
+
+- Indonesian UI; price/percentage inputs are text with dot grouping and decimal comma.
+- Per-row markup replaces global, including zero; always calculate from reviewed originals.
+- New uploads cannot retain old prices or late OCR/render results. Missing values stay missing.
+- Keep photos local; self-host pinned OCR assets. Never substitute sample prices for an upload.
+- Preserve source dimensions/artwork; only changed prices/date may be repainted.
+- Keep the original date unless deliberately changed; never guess today after OCR failure.
+- Measure real text bounds. Shrink only to the specified readable floor; otherwise block export.
+- Verify 360px through desktop, 16px form text, 44px primary targets, and local accessible errors.
 
 ## Definition of Done
 
 A feature is done only when ALL of the following are true:
 
 - [ ] Target behavior is implemented
 - [ ] Required verification actually ran (tests / lint / type-check)
+- [ ] Changed behavior was exercised on the real upload/OCR/PNG path when applicable
 - [ ] Evidence recorded in `feature_list.json` or `progress.md`
 - [ ] Repository remains restartable from standard startup path
 
 ## Verification Commands
 
 ...existing bootstrap command block remains...
 
 Required checks:
 - `node scripts/verify-harness.mjs`
+- `node --check scripts/verify-harness.mjs`
+
+The verifier uses the installed `harness-creator` skill under `~/.agents/skills/`.
+Its score is structural only. Add real app check/test/build commands when the
+manifest exists; do not mark application features complete from this score.
```

The ellipsis above denotes unchanged existing text in the review excerpt, not a replacement line or executable patch. Apply only the listed targeted edits after approval, using fresh file anchors.

## Intentionally Unchanged

- No unverified npm/deploy commands are documented as currently runnable.
- No duplicate AGENTS.md, package-specific instruction files, local overrides, or global agent settings are added.
- No product code, credentials, deployment links, or claims of a completed OCR workflow are fabricated.

## Maintenance Notes

If using Claude Code, `#` can capture learnings into project memory. Keep root instructions concise and project-specific; route longer facts into PRODUCT/spec/progress. Personal-only preferences belong in `.claude.local.md` if needed, with that file ignored before creation; shared defaults do not need another local file.

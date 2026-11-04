# CLAUDE.md

Gold Price Generator: an Indonesian, mobile-first editor for the supplied
Redmark/Gift Series price-list layout. Approved stack: React + Vite + TypeScript,
browser-local Tesseract.js OCR, native-resolution Canvas PNG output.

Current checkpoint: product/tooling initialized; the owner approved the
implementation plan and native execution. The temporary mockup is not production OCR.

## Startup Workflow

Before writing code:

1. **Confirm working directory** with `pwd`; work in this repository, not the `laragon` parent.
2. **Read this file** completely
3. **Read `PRODUCT.md`** and the approved specification and implementation plan under `docs/superpowers/`.
4. **Run `./init.sh`**; it currently validates harness structure, not application behavior.
5. **Read `feature_list.json`** to see current feature state
6. **Use CodeGraph first** for code discovery (`codegraph explore "<file or symbol>"`).
   Use ordinary file tools only when its index is explicitly inactive or cannot answer;
   refresh with `codegraph sync .` after actual source changes.

If baseline verification is failing, repair that first before adding new scope.

## Working Rules

- **One feature at a time**: Pick exactly one unfinished feature from `feature_list.json`
- **Verification required**: Don't claim done without running verification commands
- **Update artifacts**: Before ending session, update `progress.md` and `feature_list.json`
- **Stay in scope**: Don't modify files unrelated to the current feature
- **Leave clean state**: Next session must be able to run `./init.sh` immediately

## Required Artifacts

- `feature_list.json` — Feature state tracker (source of truth)
- `progress.md` — Session continuity log
- `init.sh` — Standard startup and verification path
- `session-handoff.md` — Optional, for larger sessions

## Product Invariants

- Indonesian UI; price/percentage inputs are text with dot grouping and decimal comma.
- Per-row markup replaces global, including zero; always calculate from reviewed originals.
- New uploads cannot retain old prices or late OCR/render results. Missing values stay missing.
- Keep photos local; self-host pinned OCR assets. Never substitute sample prices for an upload.
- Preserve source dimensions/artwork; only changed prices/date may be repainted.
- Keep the original date unless deliberately changed; never guess today after OCR failure.
- Measure real text bounds. Shrink only to the specified readable floor; otherwise block export.
- Verify 360px through desktop, 16px form text, 44px primary targets, and local accessible errors.

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] Required verification actually ran (tests / lint / type-check)
- [ ] Changed behavior was exercised on the real upload/OCR/PNG path when applicable
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from standard startup path

## End of Session

Before ending a session:

1. Update `progress.md` with current state
2. Update `feature_list.json` with new feature status
3. Record any unresolved risks or blockers
4. Commit with descriptive message once work is in safe state
5. Leave repo clean enough for next session to run `./init.sh` immediately

## Verification Commands

```bash
# Full verification (recommended)
./init.sh
```

Required checks:
- `node scripts/verify-harness.mjs`
- `node --check scripts/verify-harness.mjs`

The verifier uses the installed `harness-creator` skill under `~/.agents/skills/`.
Its score is structural only. Add real app check/test/build commands when the
manifest exists; do not mark application features complete from this score.

## Escalation

If you encounter:
- **Architecture decisions**: Consult project architecture docs if present, otherwise ask user
- **Unclear requirements**: Check product/requirements docs if present, otherwise ask user
- **Repeated test failures**: Update progress, flag for human review
- **Scope ambiguity**: Re-read `feature_list.json` for definition of done

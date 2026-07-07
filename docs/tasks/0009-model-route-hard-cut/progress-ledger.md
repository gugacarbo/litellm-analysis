# Progress Ledger: model-route-hard-cut

> **Plan:** `0009-model-route-hard-cut`
> **Registry:** `docs/tasks/0009-model-route-hard-cut/super-plan.json`
> **Generated:** 2026-07-07T14:03:12Z
> **Regenerated on every `super-plan.json` write via the active `render-progress-ledger.sh` helper path**

## Summary

| Status | Count |
|--------|-------|
| pending | 4 |
| in_progress | 0 |
| ready_for_review | 0 |
| reviewing | 0 |
| needs_fix | 0 |
| blocked | 0 |
| completed | 2 |
| cancelled | 0 |
| **Total** | **6** |

## Agent Profiles

| Profile | Model | Agent |
|---------|-------|-------|
| general | default | general |
| deep | default | deep |
| quick | default | quick |

## Tasks

| Task ID | Title | Profile | Batch | Phase | Status | Dependencies |
|---------|-------|---------|-------|-------|--------|-------------|
| Task-A-0009 | Canonicalize shared ModelRoute contract and adapter semantics | general | A | foundation | ✅ completed | — |
| Task-B-0009 | Harden the HTTP/orchestration boundary | general | B | foundation | ✅ completed | Task-A-0009 |
| Task-C-0009 | Collapse parallel route and config handling in the server runtime | deep | C | core | ⏳ pending | Task-B-0009 |
| Task-D-0009 | Refactor the web models surface around typed route and table-row data | deep | D | surface | ⏳ pending | Task-A-0009, Task-C-0009 |
| Task-E-0009 | Refresh regression coverage for the hard cut | general | E | surface | ⏳ pending | Task-B-0009, Task-C-0009, Task-D-0009 |
| Task-F-0009 | Close docs alignment and final verification hooks | quick | F | final | ⏳ pending | Task-E-0009 |

## Timeline

| Timestamp | Task | Event | Try |
|-----------|------|-------|-----|
| — | — | no task events logged yet | — |

## Requirements Coverage

| Requirement | Status | Covered By |
|-------------|--------|------------|
| REQ-1: ModelRoute is the only public model-route contract across shared packages | ✅ completed | Task-A-0009 |
| REQ-2: HTTP boundary accepts only current modelRoute payloads | ✅ completed | Task-B-0009, Task-E-0009 |
| REQ-3: Server runtime no longer carries parallel route shapes for the same semantics | ⏳ pending | Task-C-0009 |
| REQ-4: Web models surface consumes typed route and derived table-row data | ⏳ pending | Task-D-0009, Task-E-0009 |
| REQ-5: Regression coverage locks the hard cut | ⏳ pending | Task-E-0009 |
| REQ-6: Docs and conventions reflect the completed hard cut | ⏳ pending | Task-F-0009 |

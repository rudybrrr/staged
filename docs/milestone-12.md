# Milestone 12: MVP UI Polish

Status: Implemented.

## Goal

Make the existing Staged workflow visually coherent, demo-ready, and easier to use, without adding new product functionality.

Staged already has a strong local verification spine, but the current UI is too rough for a portfolio MVP. This milestone improves presentation, hierarchy, empty states, and consistency while preserving existing behavior.

## Purpose

Milestone 11 completed Markdown Export, closing out the local verification and reporting spine. Before provider/API integration begins, Staged needs a focused visual polish pass so the existing workflow reads clearly and demos well.

This milestone was a visual UI implementation pass guided by `docs/ui-polish-spec.md`, which defines the layout, visual system, component plan, icon plan, interaction states, and slice-by-slice conversion plan referenced below. It did not change Rust, backend behavior, Tauri configuration, product behavior, AI/API integration, RAG implementation, Stage History, or persistence.

## Product Context

Staged is a local-first, cost-aware verification workbench for auditing AI-generated code changes before commit. Milestones 0 through 11 cover project setup, local repository inspection, changed files, read-only diffs, allowlisted command execution, deterministic Pre-Stage Screening, Stage Payload preview, Token Budget estimates, Staging Ground readiness, Safety Gate and redaction preview, a local read-only Stage Report preview, and local Markdown export.

RAG is documented in `docs/rag-architecture.md` but is not implemented. Provider/model AI integration (Milestone 10B and beyond) has not started.

Milestone 12 restyles and reorders the existing panels. It does not introduce new evidence sources, does not change the AI boundary, and does not change what data the app collects or how it flows between panels.

## In Scope

Per `docs/ui-polish-spec.md`:

- Improve overall app layout and visual hierarchy.
- Reorder the workflow so it reads naturally: repo selection, changed files, diff and local checks, deterministic screening, Stage Payload and Token Budget, Staging Ground and Safety Gate, Stage Report and Markdown Export.
- Standardize panel/card styling.
- Standardize section headings.
- Standardize status badges.
- Add restrained `lucide-react` icon usage during implementation.
- Improve button hierarchy and disabled states.
- Improve empty states.
- Improve code, diff, JSON, command output, and Markdown preview readability.
- Improve spacing, typography, and visual grouping.
- Keep the app's dark-mode developer workbench style.
- Make the app screenshot/demo ready.

## Out of Scope

The following are not part of Milestone 12:

- New product functionality.
- AI/API integration.
- Provider or model selection.
- Prompt construction.
- Stage History.
- SQLite.
- RAG implementation.
- Tree-sitter.
- Vector search.
- Auto-fixing.
- GitHub PR integration.
- Full redesign.
- Branding overhaul.
- shadcn/ui adoption.
- Framer Motion or other animation libraries.
- Routing.
- New state management.
- Backend behavior changes.
- Rust changes.

## Implementation Slices

Implementation follows the slice plan defined in `docs/ui-polish-spec.md` §8. Each slice is a separate commit and preserves existing functionality:

- **12A: UI primitives and icon dependency.** Add the `lucide-react` dependency and build the shared primitives (`AppShell`, `Panel`, `SectionHeader`, `StatusBadge`, `ActionButton`, `EmptyState`, `CodeBlock`, `MetricPill`) with zero panel changes. This is the only slice that adds a dependency, and it happens during implementation, not during this documentation task.
- **12B: App shell and top status bar.** Introduce the app shell, a slim top status bar, and the two-column workflow/review layout. Reorder panels in `src/app/App.tsx` into workflow order. Remove the oversized hero and the "current milestone target" block.
- **12C: Repository, changes, diff, and command panels.** Convert the repo picker, repository inspection summary, changed files list, diff viewer, and command runner to the shared primitives and icon map.
- **12D: Payload, budget, staging, safety, report, and export panels.** Convert Pre-Stage Screening, Stage Payload, Token Budget, Staging Ground, Safety Gate, and Stage Report/Markdown Export to the shared primitives. Replace ad-hoc status color maps with `StatusBadge`. Make the Safety Gate blocked state visually unmistakable. Move Stage Report and Markdown Export into the review rail.
- **12E: Regression pass and screenshot readiness.** Consistency sweep, spacing/tone tweaks, and portfolio screenshot capture. No new components or behavior in this slice.

## Technical Summary

Milestone 12 is a presentational pass only. It restyles existing panels in place using Tailwind and a small set of internal UI primitives; it does not change `src/app/lib/*`, backend logic, data flow, or Rust/Tauri code.

Conceptual flow (unchanged from Milestone 11):

```text
Repo selection
  -> Changed files
    -> Diff and local checks (command runner)
      -> Deterministic screening (Pre-Stage Screening)
        -> Stage Payload and Token Budget
          -> Staging Ground and Safety Gate
            -> Stage Report and Markdown Export
```

Milestone 12 makes this existing flow visually explicit through layout order, section grouping, and a left-edge workflow indicator. It does not add, remove, or reorder the underlying evidence.

## Manual Test Plan

- Select a valid repository and confirm changed files, diff viewer, command runner, Pre-Stage Screening, Stage Payload, Token Budget, Staging Ground, Safety Gate, Stage Report, and Markdown Export all still work.
- Select an invalid folder and confirm the error state is clear.
- Select a repository with no changed files and confirm the empty state is useful.
- Run a command that succeeds and a command that fails, and confirm both states are easy to read.
- Trigger the Safety Gate blocked state (for example with a fake secret such as `API_KEY=fake_test_key_123`) and confirm it is visually obvious in the panel, the top bar, and the Stage Report.
- Copy the Markdown export and confirm the output is unchanged from Milestone 11.
- Confirm the app is visually coherent enough for a portfolio demo screenshot.

## Definition of Done

- App has a clearer workflow layout.
- Major panels look consistent.
- Important statuses are easier to scan.
- Empty states are useful and readable.
- Buttons have clear hierarchy.
- Diff/output/report areas are easier to read.
- Safety Gate blocked state is visually obvious.
- Markdown export is easy to find.
- No existing functionality regresses.
- No new feature scope is added.

## Notes

Milestone 12 is a focused MVP polish pass, not a full redesign. The design basis is `docs/ui-polish-spec.md`, which should be treated as authoritative for layout, component boundaries, icon usage, and interaction states during implementation.

Deeper design-system work, shadcn/ui adoption, animation, and responsive/mobile layout remain later expansion paths and are tracked in `docs/mvp-tradeoffs.md`.

### Follow-up: 12F visual redesign pass (complete)

A follow-up visual-only redesign pass, `12F`, was planned in `docs/ui-visual-redesign-plan.md` and is now implemented (slices 12F-1 through 12F-5): visual foundation and status-badge unification, an evidence pipeline strip with a rebalanced layout, a review rail verdict card with collapsed payload/token details, evidence workbench grouping (Source / Diff / Screening) with improved code/output readability, and a screenshot-readiness regression pass.

12F restyled and regrouped existing panels only. No product behavior, backend behavior, AI/API integration, RAG implementation, Stage History, or persistence was added. The app is now more portfolio-demo and screenshot ready. Accessibility, responsive/mobile refinements, README screenshots/GIFs, possible shadcn/ui adoption, and deeper design-system work remain separate future expansion paths, tracked in `docs/mvp-tradeoffs.md`.

# UI Visual Redesign Plan

Status: Implemented. All five 12F slices (12F-1 through 12F-5) have shipped.

This document records the completed 12F visual redesign pass that came out of the approved
screenshot-readiness critique. It is a **visual redesign only**: it restyled and rearranged
existing panels and primitives. It did not change product behavior, evidence sources,
the AI boundary, backend, or Tauri configuration.

Design basis and predecessor: `docs/ui-polish-spec.md` (first polish pass, Milestone 12).
12F was the follow-up visual pass after that milestone and is now implemented.

Stack: Tauri v2 + React + TypeScript + Tailwind. `lucide-react` is available.

Grounding — the real code this plan modifies:

- Primitives: `src/app/ui/AppShell.tsx`, `Panel.tsx`, `StatusBadge.tsx`, `ActionButton.tsx`,
  `EmptyState.tsx`, `CodeBlock.tsx`, `MetricPill.tsx`, `SectionHeader.tsx`, `index.ts`.
- Composition + derived state: `src/app/App.tsx`.
- Feature panels: `src/app/features/*`.
- Derived state already computed in `App.tsx` and available for a pipeline strip:
  `stagePayload`, `screeningFindings`, `safetyGateResult.status`, `tokenBudget`,
  `stagingGroundReadiness.status`, `stageReport.report_status` /
  `stageReport.recommendation.decision`.

---

## 1. Design diagnosis

The functionality is complete; the presentation is not portfolio-grade. Concrete weaknesses:

- **Flat hierarchy.** Every region — repo picker, inspection, diff, token table, payload
  metadata — is a `rounded-2xl border-zinc-800 bg-zinc-900/70 p-6` panel of equal visual
  weight. Nothing signals a primary focus. The eye has no entry point.
- **Right rail is a metadata dump.** `App.tsx` renders the rail as five stacked full panels
  (`StagePayloadPreviewPanel`, `TokenBudgetPanel`, `StagingGroundPanel`, `SafetyGatePanel`,
  `StageReportPanel`). All the heavy metadata, chip walls, completeness stats, limitations
  lists, token contributions table, and raw JSON live here, so the rail runs 2–3× the height
  of the left column after a repo is selected. The rail does three unrelated jobs at once:
  status, raw payload inspection, and token accounting.
- **Too much prose.** Empty states repeat near-identical "Select a valid Git repository…"
  sentences across panels. Limitations render as multiple full-width text boxes. The token
  estimator note is a multi-line paragraph. Reads like documentation pasted into UI.
- **Weak panel contrast.** `border-zinc-800` on `bg-zinc-950` is too subtle; panels dissolve
  into the background. There is only one surface level, so there is no sense of layering.
- **Inconsistent status treatment.** The top bar mixes `StatusBadge` (`rounded-full`) and
  `MetricPill` (`rounded-lg`) side by side — different shapes and fills in one row. `StatusTone`
  has nine tones, several visually identical (`idle`, `info`, `preview` are the same classes),
  which dilutes meaning.
- **Cramped JSON/code blocks.** The read-only payload JSON renders in a narrow rail column
  with horizontal scrolling and no header affordance, undercutting the most
  developer-credible element in the app.
- **Invisible evidence pipeline.** Staged *is* a pipeline (Payload → Screening → Safety Gate →
  Report → Staging Ground), but the UI never shows the flow. It is the strongest available
  visual hook and is currently buried as five equal panels.

---

## 2. Target visual direction

**One direction: a local verification console built around a visible evidence pipeline.**
Reference feel: a CI run detail page meets a security scanner. Serious, dense-but-readable,
privacy-forward. Not a SaaS dashboard, not a chatbot, not marketing UI.

Two zones with clearly different jobs:

- **Left — evidence workbench (primary, wide).** Where you *do* and *read*: repo, changed
  files, diff, local checks, screening. Gets the most space and the strongest content
  (diff, command output).
- **Right — review rail (secondary, narrow, sticky, short).** Where you *decide*: the verdict
  and the pipeline status at a glance. Everything heavy/inspectable is collapsed behind
  "Show more…".
- **Top — pipeline strip.** A horizontal spine directly under the top bar showing the five
  stages and their state, derived from existing data.

The redesign moves inspection data out of the rail so the rail can be glanceable, which fixes
the "right side is far too long" imbalance.

---

## 3. New layout model

```
┌───────────────────────────────────────────────────────────────┐
│ STICKY TOP BAR   Staged · tagline · [privacy]   repo · branch · gate · tokens │
├───────────────────────────────────────────────────────────────┤
│ PIPELINE STRIP   Payload → Screening → Safety Gate → Report → Staging Ground  │
├──────────────────────────────────────────┬────────────────────┤
│ EVIDENCE WORKBENCH (min-w-0, ~1fr)        │ REVIEW RAIL (sticky)│
│                                           │                     │
│  Source group                             │  Verdict card       │
│   repo picker · inspection · changed files│   (visual climax)   │
│                                           │                     │
│  Diff group                               │  Pipeline status    │
│   diff viewer · command runner            │  mini-summary       │
│                                           │                     │
│  Screening group                          │  Payload / Token    │
│   pre-stage screening                     │  details (collapsed)│
└──────────────────────────────────────────┴────────────────────┘
```

- **Sticky top bar.** Keep `AppShell`'s existing sticky header. Identity left
  (`Staged` + tagline + one small always-on privacy chip). Global verdict-level status right:
  repo/branch, working tree (Clean/Dirty), Safety Gate, Tokens — unified to a single chip
  shape (see §4).
- **Pipeline strip.** New region rendered by `AppShell` between header and body (§6).
- **Two-column body.** Keep the existing
  `lg:grid-cols-[minmax(0,1fr)_22rem]` grid; the left stays `min-w-0`.
- **Left evidence workbench.** Grouped into Source / Diff / Screening (§8) instead of a flat
  `space-y-8` stack.
- **Right sticky review rail.** Wrap the rail contents in a `sticky` container with a capped
  height and internal scroll so it never dwarfs the left column.
- **Collapsed payload/token details.** The raw JSON, payload completeness, limitations, and
  token contributions table move into a collapsed disclosure at the bottom of the rail.
- **Verdict card = visual climax.** A single card at the top of the rail with the strongest
  treatment in the app, showing Safety Gate state + one-line reason + the recommended action.

---

## 4. Tailwind visual tokens

Concrete class guidance. Cool-neutral zinc palette; two surface levels; discipline over variety.

- **App background:** `bg-zinc-950 text-zinc-300` (already on `AppShell`; keep base text one
  step down from `zinc-100` so headings/numbers stand out).
- **Panel surface (level 1):** `rounded-xl border border-zinc-800 bg-zinc-900/60 p-5`.
  Bump border contrast from current `bg-zinc-900/70` flatness by pairing with an inset ring on
  emphasis panels.
- **Inset / code surface (level 2):** `rounded-lg border border-zinc-800/80 bg-zinc-950`.
- **Verdict card (emphasis):**
  `rounded-xl border border-zinc-700 bg-zinc-900 p-5 ring-1 ring-inset ring-white/5`.
- **Borders:** hairline `border-zinc-800`; emphasis `border-zinc-700`; in-panel divider
  `border-t border-zinc-800/70`.
- **Shadows:** avoid on panels (dark UIs read depth via surface + border). At most a soft
  `shadow-lg shadow-black/20` on sticky top bar and rail to lift them while scrolling.
- **Typography scale:**
  - Section eyebrow: `text-[11px] font-medium uppercase tracking-wider text-zinc-500`
  - Panel title: `text-sm font-semibold text-zinc-100`
  - Body: `text-sm text-zinc-400` (prose `leading-relaxed`)
  - Mono/code: `font-mono text-[13px] leading-6 text-zinc-300`
- **Metric numbers:** `text-2xl font-semibold tabular-nums text-zinc-50` with a
  `text-[11px] uppercase tracking-wide text-zinc-500` label. Use `tabular-nums` on **every**
  number in the app — this is what makes it read like an instrument.
- **Spacing:** panel padding `p-5`; inside-group gap `gap-3` (related panels sit close);
  between-group gap `gap-8` (creates rhythm); rail block gap `space-y-4`.
- **Rounded corners:** panels `rounded-xl`; chips/buttons `rounded-md`; code/inset `rounded-lg`.
  Pick these three and never deviate.
- **Status badges (single component, filled-tint, four semantic states):**
  ```
  base:    inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border
  neutral: bg-zinc-800/60 text-zinc-300 border-zinc-700
  ok:      bg-emerald-500/10 text-emerald-300 border-emerald-500/20
  warn:    bg-amber-500/10 text-amber-300 border-amber-500/20
  blocked: bg-red-500/10 text-red-300 border-red-500/20
  ```
  Optional leading dot: `<span class="size-1.5 rounded-full bg-current" />`.
- **Code blocks:**
  ```
  wrapper: rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden
  header:  flex items-center justify-between px-3 py-1.5 border-b border-zinc-800
           text-[11px] uppercase tracking-wide text-zinc-500
  body:    p-4 overflow-x-auto font-mono text-[13px] leading-6 text-zinc-300
           max-h-[32rem] overflow-y-auto
  ```

---

## 5. Component changes

Grounded in existing primitives only. No new design system; changes are additive and
backward-compatible where possible.

- **AppShell** (`src/app/ui/AppShell.tsx`)
  - Add an optional `pipeline?: ReactNode` slot rendered in a sticky region *below* the header
    and *above* the two-column grid.
  - Wrap the `rail` in a sticky container: `sticky top-[<header+strip height>] max-h-[…]
    overflow-y-auto` so the rail scrolls independently and cannot dwarf the left column.
  - Keep the `minmax(0,1fr)_22rem` grid and `min-w-0` left column.
- **Panel** (`src/app/ui/Panel.tsx`)
  - Add `variant?: "default" | "emphasis" | "inset"` mapping to the surfaces in §4.
  - Reduce default padding to `p-5`, title to `text-sm font-semibold`, add a hairline header
    divider (`border-b border-zinc-800/70`) between header and body.
  - Add `collapsible?: boolean` + `defaultOpen?: boolean` (local `useState` only) for the rail
    disclosures. When collapsed, show only the header + an optional `summary` node.
- **StatusBadge** (`src/app/ui/StatusBadge.tsx`)
  - Keep the `StatusTone` union for source compatibility, but collapse the *visual* mapping to
    four buckets: neutral (`idle`/`info`/`preview`/`disabled`/`running`), ok (`pass`),
    warn (`warning`), blocked (`fail`/`blocked`). Switch base to `rounded-md` filled-tint (§4).
  - Add optional `dot?: boolean` and `icon?: ReactNode`.
- **ActionButton** (`src/app/ui/ActionButton.tsx`)
  - No API change. Enforce usage: `primary` is reserved for the single recommended action in
    the verdict card; everything else (Select folder, Refresh, command runner) uses `secondary`
    or `ghost`. This removes the current competition between Select folder and Refresh.
- **EmptyState** (`src/app/ui/EmptyState.tsx`)
  - Tighten to icon + one short `title` line; make `description` truly optional and drop the
    repeated multi-sentence copy at call sites. Reuse one instance style everywhere.
- **CodeBlock** (`src/app/ui/CodeBlock.tsx`)
  - Adopt the header + body structure in §4 (label becomes a real header row with room for a
    future copy control), roomier `leading-6`, `overflow-x-auto`. Used for JSON, diff, and
    command output.
- **MetricPill** (`src/app/ui/MetricPill.tsx`)
  - Split usage: introduce a `Metric` display treatment (large `tabular-nums` value + small
    label) for the *numbers that matter* (changed files, findings, tokens). Keep `MetricPill`
    only for compact key/value metadata inside collapsed details. Stop rendering 6+ pills inline
    in the rail. `Metric` can live in the same file or as a small sibling export — not a new
    system.

---

## 6. Pipeline strip design

A horizontal strip that makes the evidence pipeline visible. Pure presentation over existing
derived state; **no routing, no new product behavior.**

- **Steps (in order):** `Payload` · `Screening` · `Safety Gate` · `Report` · `Staging Ground`.
- **Labels:** step name + one key number/state, e.g. `Payload · ready`, `Screening · 4 findings`,
  `Safety Gate · Warning`, `Report · preview`, `Staging Ground · review only`.
- **State derivation (from data already in `App.tsx`):**
  - Payload: `stagePayload ? ok : neutral` (idle until a valid repo builds a payload).
  - Screening: worst level in `screeningFindings` — any `fail` → blocked, any `warning` → warn,
    else `ok`; neutral when no repo.
  - Safety Gate: `safetyGateResult.status` → `pass`=ok, `warning`=warn, `blocked`=blocked;
    neutral when `null`.
  - Report: `stageReport.report_status` (`preview_only` vs `complete`) with
    `recommendation.decision` shaping the label; neutral when no payload.
  - Staging Ground: `stagingGroundReadiness.status` (`not_ready`=neutral,
    `review_only`=warn/neutral, `ready_later`=ok).
- **Badge/dot treatment:** each step is a compact node — state dot (`size-2 rounded-full`
  colored per §4) + label. Connect steps with a thin `border-zinc-800` divider/`→` chevron.
  Reuse `StatusBadge` tones for the dot color; keep it single-line and `overflow-x-auto` on
  narrow widths.
- **Optional scroll-to-panel behavior:** clicking a step may `scrollIntoView` the matching
  panel via a `ref` or `id` anchor. This is *scroll only* — **no router, no history, no state
  library.** If not implemented, steps are non-interactive; that is acceptable.
- **Idle state:** with no repo selected, all steps render neutral/idle so the strip still
  communicates the pipeline shape.

---

## 7. Review rail redesign

Goal: short, calm, glanceable. Three blocks max. This is the primary fix for rail length.

- **Verdict card (top, emphasis variant).** The visual climax. Shows:
  - Safety Gate state as a large badge (ok/warn/blocked per §4).
  - One plain-language sentence of *why* (from `safetyGateResult` / `stageReport.recommendation.rationale`).
  - The recommended next action as the single `primary` `ActionButton` on the page (label
    derived from `stageReport.recommendation.decision`, e.g. "Review manually",
    "Do not submit", "Ready for future AI review"). If the action is not wired to behavior, it
    renders as text/disabled — **no new product behavior.**
- **Pipeline status mini-summary.** A vertical echo of the strip: each stage + state badge,
  so the rail restates the run status without the metadata.
- **Collapsed payload/token details.** A single `collapsible` Panel, closed by default, with a
  one-line summary (e.g. `stage-payload.v1 · 0 changed files · 545 tok`). Expanding reveals the
  moved content: read-only JSON (`CodeBlock`), payload completeness, limitations, and the token
  contributions table. This is where `StagePayloadPreviewPanel` and `TokenBudgetPanel` detail
  content goes.
- **Safety Gate = blocked treatment.** When `safetyGateResult.status === "blocked"`, the
  verdict card uses the blocked tint (`bg-red-500/10 border-red-500/20`), a shield/`XCircle`
  icon, and the action reads "Do not submit" (disabled/secondary). It should read as the loudest
  element on screen without being alarmist — tinted, not solid red.
- **Recommendation treatment.** One sentence + one button. No paragraphs. Rationale detail, if
  long, sits behind "Show more…".
- **Hidden behind Show more:** raw JSON, payload completeness stats, limitations list, token
  estimator note, token contributions table, per-section byte/char breakdowns.

---

## 8. Evidence workbench redesign (left column)

Replace the flat `space-y-8` stack with three visual groups (tight `gap-3` within a group,
`gap-8` between groups). Each group led by a `SectionHeader` eyebrow.

- **Source group:** `RepoPicker` + `Repository inspection` panel + `ChangedFilesPanel`.
- **Diff group:** `DiffViewerPanel` + `CommandRunnerPanel`.
- **Checks group:** command runner results treated as first-class output (may live inside the
  Diff group visually, but command *result* output gets the upgraded `CodeBlock`).
- **Screening group:** `PreStageScreeningPanel` (deterministic findings).

Prominence:

- **Diff viewer** — the actual review surface; give it the most left-column real estate and the
  upgraded code surface.
- **Command result** — render with the upgraded `CodeBlock` (header + roomy mono), not inline
  gray text.
- **Changed files** — clear, scannable list; selected row clearly highlighted.
- **Key counts** — changed files, findings, tokens use the `Metric` treatment
  (large `tabular-nums`) rather than being buried in prose or small chips.

De-emphasize: repeated placeholder prose, redundant metadata chips, and any content duplicated
by the rail.

---

## 9. Implementation slices

Small, independently shippable Sonnet tasks. Each leaves the app fully working. Prefix `12F`.

### 12F-1 — Visual foundation and status unification
- **Goal:** establish the token system and one consistent badge language before any layout
  change. Palette/surface/border/typography tokens from §4; rewrite `StatusBadge` visual mapping
  to four buckets + `rounded-md` filled-tint; unify top-bar chips so `StatusBadge` and
  `MetricPill` share shape/rhythm; add `tabular-nums` to numbers.
- **Allowed files (conceptually):** `src/app/ui/StatusBadge.tsx`, `MetricPill.tsx`,
  `Panel.tsx` (surface/typography only), `ActionButton.tsx` (usage only), and the top-bar chip
  markup in `src/app/App.tsx`.
- **Forbidden:** no layout/grid changes, no rail restructure, no behavior changes, no new files
  beyond a small `Metric` display if needed.
- **Manual verification:** app builds; empty state and repo-selected state both render; top-bar
  badges share one shape; ok/warn/blocked colors are visually distinct; numbers use tabular
  figures.
- **Commit message:** `feat(ui): unify status badges and visual foundation tokens (12F-1)`

### 12F-2 — AppShell pipeline strip and layout rebalance
- **Goal:** add the pipeline strip (§6) and make the rail sticky with capped height so the
  columns balance.
- **Allowed files:** `src/app/ui/AppShell.tsx` (add `pipeline` slot + sticky rail wrapper),
  a new pipeline-strip component under `src/app/ui/` or `src/app/features/`, and `App.tsx` to
  derive step state and pass the strip in.
- **Forbidden:** no routing, no state-management library, no new derived *data* (reuse existing
  memoized values), no product behavior. Scroll-to is optional and must be `scrollIntoView` only.
- **Manual verification:** strip shows five steps; states update correctly for no-repo, clean
  repo, and warning gate; rail scrolls independently and no longer runs far past the left column.
- **Commit message:** `feat(ui): add evidence pipeline strip and rebalance layout (12F-2)`

### 12F-3 — Review rail verdict card and collapsed details
- **Goal:** restructure the rail into verdict card + pipeline mini-summary + collapsed
  payload/token details (§7). Move JSON, completeness, limitations, and token table behind
  "Show more…".
- **Allowed files:** `src/app/ui/Panel.tsx` (add `collapsible`/`variant`), `App.tsx` (rail
  composition), `src/app/features/stage-payload/StagePayloadPreviewPanel.tsx`,
  `src/app/features/token-budget/TokenBudgetPanel.tsx`,
  `src/app/features/safety-gate/SafetyGatePanel.tsx`,
  `src/app/features/stage-report/StageReportPanel.tsx`,
  `src/app/features/staging-ground/StagingGroundPanel.tsx`.
- **Forbidden:** no change to what data these panels compute or display when expanded; collapse
  is presentation only. No new primary actions that trigger behavior.
- **Manual verification:** rail defaults to a short, glanceable height; verdict card shows gate
  state + one sentence + one action; blocked state reads clearly; expanding "Show more…" reveals
  the full JSON/completeness/limitations/token table unchanged.
- **Commit message:** `feat(ui): rail verdict card with collapsed payload details (12F-3)`

### 12F-4 — Evidence workbench grouping and code/output readability
- **Goal:** group the left column into Source / Diff / Screening (§8); upgrade `CodeBlock` and
  apply it to diff, command output, and repo path; make diff the prominent surface; key counts
  use `Metric` treatment.
- **Allowed files:** `src/app/ui/CodeBlock.tsx`, `App.tsx` (grouping/section headers),
  `src/app/features/diff-viewer/DiffViewerPanel.tsx`,
  `src/app/features/command-runner/CommandRunnerPanel.tsx`,
  `src/app/features/changed-files/ChangedFilesPanel.tsx`,
  `src/app/features/pre-stage-screening/PreStageScreeningPanel.tsx`.
- **Forbidden:** no change to diff/command/screening logic or data flow; presentation only.
- **Manual verification:** groups read as distinct clusters with rhythm; diff is legible with
  roomy mono and a header; command output uses the upgraded block; changed-files selection is
  clear.
- **Commit message:** `feat(ui): group evidence workbench and improve output readability (12F-4)`

### 12F-5 — Screenshot-readiness regression pass
- **Goal:** final polish and consistency sweep against the acceptance criteria; make the app
  ready for future README screenshots/GIFs.
- **Allowed files:** any `src/app/**` presentation tweak needed to meet §11; no logic files.
- **Forbidden:** no behavior/backend/AI changes; no dependency changes.
- **Manual verification:** run through §11 checklist in empty, clean-repo, and warning-gate
  states; confirm no visual regressions vs prior slices; leave README screenshots/GIFs as a
  separate follow-up path.
- **Commit message:** `chore(ui): screenshot-readiness regression pass (12F-5)`

---

## 10. Non-goals

Explicitly excluded from this plan:

- Product behavior changes (no new actions, flows, or evidence sources).
- Backend / Rust / Tauri config changes.
- AI / API / provider / model integration or prompt construction.
- RAG implementation.
- Persistence (SQLite, Stage History, caching).
- shadcn/ui adoption.
- Framer Motion or any animation library (CSS transitions for disclosure only).
- Routing (pipeline-step clicks are `scrollIntoView` only).
- State-management libraries (local `useState` only, for collapse/disclosure).
- Feature rewrites — same panels, same data, restyled and regrouped.

---

## 11. Acceptance criteria

README-screenshot quality is met when, across empty / clean-repo / warning-gate states:

- **Visible pipeline:** the Payload → Screening → Safety Gate → Report → Staging Ground strip is
  present with correct per-step state.
- **Balanced rail:** after selecting a repo, the rail is no taller than ~1.2× the left column
  above the fold; no wall of stacked prose/tables is visible without expanding a disclosure.
- **Clear verdict:** the Safety Gate verdict card is the most prominent element, with gate state
  + one-sentence reason + one recommended action; the blocked state reads unmistakably.
- **Consistent statuses:** every badge uses one shape and one of four semantic colors; no mixed
  solid/outline or `rounded-full`/`rounded-lg` chips in the same row.
- **Readable code blocks:** JSON, diff, and command output render as real code surfaces (header,
  roomy mono, controlled scroll), not cramped narrow boxes.
- **Fewer walls of prose:** empty states are one line; limitations, estimator notes, and token
  tables sit behind "Show more…".
- **No regressions:** all existing functionality behaves exactly as before; only presentation
  changed. App builds and runs; no console errors introduced.

---

## 12. Implementation status

All five slices are implemented and committed:

- **12F-1** — visual foundation and status unification.
- **12F-2** — evidence pipeline strip and layout rebalance.
- **12F-3** — review rail verdict card and collapsed payload/token details.
- **12F-4** — evidence workbench grouping (Source / Diff / Screening) and code/output readability.
- **12F-5** — screenshot-readiness regression pass.

This was a **visual-only** pass. No product behavior, backend behavior, AI/API integration, RAG
implementation, Stage History, or persistence was added or changed; the acceptance criteria in
§11 were verified against the existing data flow. The app is now more portfolio-demo and
screenshot ready.

Remaining UI work is intentionally out of scope for 12F and tracked as separate future paths in
`docs/mvp-tradeoffs.md`: an accessibility pass, responsive/mobile refinements, README
screenshots/GIFs, possible `shadcn/ui` adoption, and deeper design-system work.

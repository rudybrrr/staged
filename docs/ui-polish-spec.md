# UI Polish Spec (Milestone 12)

Status: planning only. **No product behavior changes.** This document defines a
visual polish pass for Staged. It does not authorize backend, data-flow, or
dependency changes beyond the single icon library named in §6.

## 0. Context and scope

Staged is a local-first, cost-aware AI verification workbench for auditing
AI-generated code changes **before commit**. It is not a generic AI reviewer,
not a GPT wrapper, and not a chatbot. It sits between local AI-generated changes
and the final commit. Core thesis: **local evidence first, AI second.**

The app already works. Every panel referenced here exists under
`src/app/features/*`. This pass improves visual hierarchy, consistency, and
demo readiness by consolidating Tailwind classes into small primitives and
introducing a workflow-ordered layout — nothing more.

Current conventions observed in the code (this pass standardizes them, it does
not invent them):

- App background: `bg-zinc-950`, text `text-zinc-100`.
- Panel: `rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6`.
- Panel heading: `text-lg font-medium`. Muted text: `text-sm text-zinc-500`.
- Status badge: `rounded-full border px-3 py-1 text-xs font-medium`.
- Code/preview: `font-mono ... rounded-lg border border-zinc-800 bg-zinc-950`.
- Status tones: emerald = pass, amber = warning, red = blocked/fail.
- Current layout: single `max-w-4xl` centered column, panels stacked vertically.

Known issue to fix in this pass: in `src/app/App.tsx` the panels render out of
workflow order (screening, payload, budget, safety, staging, report appear in
the JSX **before** changed files, diff, and the command runner). Reordering the
render sequence is an allowed layout change because it moves no logic.

---

## 1. Product UI principle

The UI must communicate, at a glance and without a tour:

- **Local-first.** Everything shown is computed on the user's machine. Copy and
  layout should reinforce "this is your evidence, not a cloud response."
- **Evidence-based.** Each panel presents a concrete artifact (a diff, a command
  result, a screening finding, a redaction preview) — not opinions.
- **Pre-commit verification.** The app is a gate before commit, not a code
  generator. The reading order is an inspection pipeline.
- **Privacy and safety.** The Safety Gate and redaction preview are
  first-class. "No data is sent anywhere" is a promise the UI must visibly keep.
- **AI later, not AI-first.** There is no AI call in this build. Any future
  AI action must read as the *last* step, downstream of and gated by local
  evidence. Placeholder AI affordances stay visibly disabled (see §7).

The feeling to produce: the user is **inspecting local evidence before any
future model call**. Dense, legible, trustworthy — a verification workbench, not
a dashboard or a landing page.

---

## 2. Target layout

Recommend a **desktop workbench** layout. Staged is a Tauri desktop app, so
assume a wide window and design for it (do not optimize for mobile).

### Top status/header bar (persistent)

A slim sticky bar, not the current oversized hero. Left to right:

- Product mark: `Staged` wordmark + one-line tagline ("Local-first verification
  before commit").
- Active repo context: repo name, current branch, clean/dirty state as compact
  `StatusBadge`s. Empty when no repo is selected.
- A single global posture indicator derived from the Safety Gate / Stage Report
  (e.g. "Ready to stage" / "Blocked"). This is the one place a user can read
  overall status without scrolling.

The current `text-4xl` hero and the "Current milestone target" block should be
removed or demoted; they read as marketing/dev-scaffolding, not workbench.

### Main workflow area (below the bar)

Adopt a **two-column workbench** at wide widths, collapsing to one column when
narrow:

- **Left column (primary evidence, ~60–65% width):** the vertical evidence
  pipeline in workflow order — repo → changed files → diff → command runner →
  screening → payload/budget → staging → safety.
- **Right column (review rail, ~35–40% width, sticky):** the **final review
  area** — the Stage Report preview, overall status, and Markdown Export. This
  is where a demo viewer's eyes land to see the verdict.

Rationale: developers scan a tall evidence feed on the left while keeping the
verdict and export pinned on the right. Widen `max-w-4xl` to roughly
`max-w-7xl` to use the desktop window.

If two columns prove too cramped for the diff/preview blocks during
implementation, fall back to a single workflow column with the Stage Report +
Export pinned in a sticky footer bar. Do not go below one clear column.

### Mandatory reading order (must be visually obvious)

```
repo selection
  → changed files
    → diff and local checks (command runner)
      → deterministic screening (Pre-Stage Screening)
        → Stage Payload and Token Budget
          → Staging Ground and Safety Gate
            → Stage Report and Markdown Export
```

A left-edge **WorkflowRail** (§5) of numbered steps makes this order explicit.

---

## 3. Information architecture

Group panels into six labeled sections. Each group gets a `SectionHeader`; the
panels inside are visually related (shared `Panel` chrome, tighter spacing
within a group than between groups).

1. **Repository and changes** — Repo picker, repository inspection summary,
   changed files list. *Prominent* (entry point).
2. **Diff and local checks** — Diff viewer, Command runner. *Prominent* (the
   core evidence).
3. **Deterministic screening** — Pre-Stage Screening. *Prominent* — this is the
   "local evidence first" moment; give it weight.
4. **Payload, budget, and staging** — Stage Payload builder, Token Budget,
   Staging Ground. *Secondary* — supporting detail. Token Budget is dense and
   can be a compact `MetricPill` cluster rather than a full table by default.
5. **Safety and redaction** — Safety Gate, redaction preview. *Prominent* — the
   privacy promise. The blocked state must be impossible to miss.
6. **Report and export** — Local Stage Report preview, Markdown Export.
   *Prominent*, and pinned in the right review rail.

Prominence guidance:

- Prominent: full `Panel` chrome, `SectionHeader` with icon, generous internal
  spacing, status badge visible in the header.
- Secondary: same chrome but denser; collapse verbose sub-tables behind a
  "Details" disclosure where the panel already exposes a lot of `dl` metadata
  (e.g. Safety Gate scan-coverage grid, Stage Payload internals).

---

## 4. Visual system

Restrained dark developer tool. Color only for **state and attention**.

| Token | Tailwind | Notes |
|---|---|---|
| App background | `bg-zinc-950` | keep current |
| Panel/card background | `bg-zinc-900/70` | keep current |
| Panel border | `border border-zinc-800` | subtle; the primary separator |
| Inset/code surface | `bg-zinc-950` inside a panel | one step darker than panel |
| Panel heading | `text-lg font-medium text-zinc-100` | |
| Section header | `text-sm font-semibold uppercase tracking-wide text-zinc-400` | group label |
| Body text | `text-sm leading-6 text-zinc-200` | |
| Muted text | `text-sm text-zinc-500` | labels, captions, empty states |
| Metadata label (`dt`) | `text-xs text-zinc-500` | |
| Metadata value (`dd`) | `text-sm font-medium text-zinc-100` | |

**Spacing rhythm.** Between top-level groups: `space-y-8` / `mt-8` (current).
Within a group between panels: `space-y-4`. Inside a panel: `p-6`, sub-sections
`space-y-6`, tight metadata grids `gap-4`. Keep it dense — do not inflate
padding; a developer workbench should feel information-rich, not airy.

**Typography scale.** Header wordmark `text-base font-semibold`; panel heading
`text-lg`; section header `text-sm uppercase`; body `text-sm`; metadata/caption
`text-xs`. One display size only if a hero survives — avoid `text-4xl`
elsewhere. Use the system UI font for chrome and a mono font for all code,
diffs, JSON, and Markdown.

**Status colors** (border / bg / text, matching existing Safety Gate usage):

- Pass / success: `border-emerald-900/70 bg-emerald-950/30 text-emerald-100`.
- Warning / info-caution: `border-amber-900/70 bg-amber-950/30 text-amber-100`.
- Fail / blocked: `border-red-900/70 bg-red-950/30 text-red-100`.
- Neutral / info / local-preview: `border-zinc-800 bg-zinc-950 text-zinc-300`
  (or a restrained `sky`/`slate` accent for pure "info", used sparingly).

**Code / diff / JSON / Markdown preview.** Standardize on one block style:
`overflow-auto whitespace-pre rounded-lg border border-zinc-800 bg-zinc-950 p-4
font-mono text-sm leading-6 text-zinc-200`, with a sensible `max-h` and scroll.
Diff viewer may add per-line tint: additions `text-emerald-300` / removals
`text-red-300` on the same dark surface — subtle, no full-row background fills.
This becomes the `CodeBlock` primitive (§5).

Do **not** introduce bright accents, gradients, shadows-as-decoration, or
saturated fills. No decorative color.

---

## 5. Component plan

Small internal primitives that consolidate the Tailwind strings already
scattered across panels. This is class consolidation, **not** a design-system
rewrite. Put them under `src/app/components/` (or `src/app/ui/`). Keep each
under ~40 lines; no variant explosion, no forwardRef gymnastics, no external
UI kit.

### Required

- **`AppShell`** — outermost frame: `min-h-screen bg-zinc-950 text-zinc-100`,
  the top status bar, and the workflow/review column layout.
  Props: `header`, `children` (workflow column), `rail` (review column).
  Used once in `App.tsx`. Don't overbuild: no theming system, no context.

- **`Panel`** — the standard card: `rounded-2xl border border-zinc-800
  bg-zinc-900/70 p-6`. Props: `title`, `icon?`, `status?` (StatusBadge tone +
  label), `description?`, `children`, `density?: "normal" | "compact"`.
  Renders the header row (title + optional icon left, optional badge right) so
  every panel is structurally identical. Used by all feature panels. Don't
  overbuild: no collapsible logic beyond an optional `defaultOpen` if a
  disclosure is genuinely needed.

- **`SectionHeader`** — group label above a set of panels: uppercase, tracked,
  `text-zinc-400`, optional icon and count. Props: `label`, `icon?`, `hint?`.
  Used once per IA group (§3).

- **`StatusBadge`** — the pill. Props: `tone: "pass" | "warning" | "blocked" |
  "info" | "neutral"`, `label`, `icon?`. Encapsulates the four tone class sets
  from §4. Used in panel headers, the top bar, and the report. This is the
  single source of truth for status color — replace ad-hoc `statusStyles`
  maps (e.g. in `SafetyGatePanel`) with it.

- **`ActionButton`** — primary/secondary/ghost button with consistent focus
  ring and disabled styling. Props: `variant`, `icon?`, `disabled`, `onClick`,
  children. Used for repo pick, refresh, run command, copy/export. Don't
  overbuild: three variants max, no loading-spinner framework (a simple
  `isLoading` that swaps label text is enough).

- **`EmptyState`** — the "nothing yet" block used everywhere a panel has no
  data. Props: `icon?`, `title`, `hint?`. Renders muted, centered-left text.
  Replaces the scattered `text-sm text-zinc-500` "No folder selected yet."
  lines. Must give a *useful next action*, not just "empty".

- **`CodeBlock`** — the standardized preview surface from §4. Props: `content`,
  `language?` ("diff" | "json" | "markdown" | "text" for light tinting only),
  `maxHeight?`. Used by diff viewer, payload preview, redacted preview, report
  preview. Don't overbuild: no syntax-highlighting dependency — tinting is
  class-based only.

- **`MetricPill`** — compact labeled metric (e.g. token counts, redaction
  count, file count). Props: `label`, `value`, `tone?`. Cluster them with
  `flex flex-wrap gap-2`. Used in Token Budget, Safety Gate summary, Stage
  Report header. Lets dense numbers read at a glance instead of as `dl` tables.

### Optional (add only if they earn their place)

- **`WorkflowStep`** — one numbered step (number, label, current/done/blocked
  tone). Props: `index`, `label`, `state`.
- **`WorkflowRail`** — the left-edge ordered list of `WorkflowStep`s reflecting
  §2's reading order. Purely navigational/orientational; no routing.
- **`PanelGrid`** — thin wrapper for a responsive multi-panel row within a
  group (e.g. Payload + Token Budget side by side). Just a `grid` helper.
- **`InlineAlert`** — one-line status callout inside a panel (error/warn/info)
  for things like inspection failure or clipboard failure, reusing StatusBadge
  tones. Replaces ad-hoc red boxes like the inspection-error `div` in `App.tsx`.

Favor consolidation: if a proposed component would be used once, inline it
instead.

---

## 6. Icon plan

Use **`lucide-react`** as the planned icon library. **Do not install it in this
planning step or in any doc-only commit.** Slice 12A (§8) adds the dependency.

Usage rules (restraint is the point):

- One icon per **major panel header** (via `Panel`'s `icon` prop) and one per
  `SectionHeader`. That's the primary icon budget.
- Status icons only where they aid scanning — inside `StatusBadge` for
  pass/warn/blocked, and in the Stage Report verdict. Not on every metric.
- Minimal button icons: only on high-frequency actions (refresh, copy/export,
  pick folder). Text label always present.
- No decorative icons, no animated icons, no spinning loaders as brand.
- No icon-only controls unless the accessible name is preserved (`aria-label`)
  and, for primary actions, a visible label remains.
- Standard size `h-4 w-4` (headers may use `h-5 w-5`), `stroke` default,
  inherit `currentColor` so tone drives color.

### Initial icon map

| Area / state | lucide icon |
|---|---|
| Repo picker | `FolderGit2` (or `FolderOpen` for the pick action) |
| Git branch / repo status | `GitBranch` |
| Changed files | `FileDiff` (list), `Files` acceptable |
| Diff viewer | `GitCompare` |
| Command runner | `TerminalSquare` |
| Pre-Stage Screening | `ClipboardCheck` |
| Stage Payload | `Package` |
| Token Budget | `Gauge` (or `Coins` for cost framing) |
| Staging Ground | `Layers` |
| Safety Gate | `ShieldCheck` |
| Stage Report | `FileText` |
| Markdown Export | `Download` (or `ClipboardCopy` for copy) |
| Success state | `CheckCircle2` |
| Warning state | `AlertTriangle` |
| Failure state | `XCircle` |
| Blocked state | `ShieldAlert` (or `Ban`) |
| Info / local-preview state | `Info` (or `MonitorCheck` to signal "local") |

Keep the map centralized (a single `icons.ts` re-export) so names are
consistent and swappable.

---

## 7. Interaction states

Every state maps to a `StatusBadge` tone, a short message style, whether it
should **block a future AI submission**, and whether it should surface in the
**final review area** (Stage Report / right rail). Messages are terse,
declarative, developer-facing — no exclamation, no marketing.

| State | Badge tone | Message style | Blocks future AI submit | In review area |
|---|---|---|---|---|
| No repo selected | neutral | EmptyState: "Select a local repository to begin." | n/a (no payload) | no |
| Invalid repo | blocked | InlineAlert: "Not a Git repository." | yes | yes (as reason) |
| Clean repo | info | "Working tree clean — nothing to stage." | soft (nothing to send) | yes |
| Dirty repo | info | badge "Dirty" in header/top bar | no | context only |
| No changed file selected | neutral | EmptyState in diff panel: "Select a file to view its diff." | no | no |
| No diff loaded | neutral | EmptyState: "No diff loaded." | no | no |
| Command not run | neutral | "No command run yet." | no (but note absence) | yes (evidence gap) |
| Command running | info | "Running <cmd>…" (label swap, no spinner brand) | soft (wait) | no |
| Command success | pass | "Exit 0" + short summary | no | yes |
| Command failure | fail | "Exit N — see output." | yes | yes |
| No supported commands | neutral | "No supported commands detected for this repo." | no | yes (evidence gap) |
| Screening pass | pass | "No blocking findings." | no | yes |
| Screening info | info | "N informational findings." | no | yes |
| Screening warning | warning | "N warnings — review before staging." | no | yes |
| Screening fail | fail | "N blocking findings." | yes | yes |
| Safety Gate pass | pass | "No secrets detected. Nothing is sent." | no | yes (prominent) |
| Safety Gate warning | warning | "N potential matches — review redactions." | no | yes (prominent) |
| Safety Gate blocked | blocked | "Blocked — secrets present. Staging withheld." | yes | yes (most prominent) |
| Token Budget normal | info | MetricPill counts, neutral | no | yes |
| Token Budget warning | warning | "Estimate exceeds soft budget." | no (advisory) | yes |
| Local preview only | info | badge "Local preview" on report/payload | n/a | yes |
| Disabled AI action | neutral | button disabled + tooltip "AI not enabled in this build." | inherently blocked | shown as pending, disabled |
| Copied Markdown | pass | transient inline "Copied." (revert ~2s) | no | no |
| Clipboard copy failure | fail | InlineAlert: "Copy failed — select and copy manually." | no | no |

Blocking semantics are **advisory UI state only** in this build (there is no AI
call). "Blocks future AI submit" documents intent for the later AI milestone; do
not wire any enforcement now beyond disabling placeholder AI controls.

The Safety Gate **blocked** state is the single most visually assertive state in
the app: red `StatusBadge` with `ShieldAlert`, a red-bordered panel header, and
a mirrored blocked indicator in the top bar and Stage Report.

---

## 8. Panel conversion plan

Sequenced, safe slices. **Each slice preserves existing functionality and
touches no backend, `src/app/lib/*`, or Rust.** Commit per slice.

### 12A: UI primitives and icon dependency

- **Goal:** land the icon library and the §5 primitives with zero panel changes.
- **Allowed changes:** add `lucide-react` (this is the one permitted dependency
  add, and it happens in the implementation milestone, not the doc commit);
  create `src/app/components/*` and `src/app/components/icons.ts`; add a small
  render smoke test.
- **Files (conceptual):** new component files only; `package.json`/lockfile for
  the single dep.
- **Risks:** over-engineering primitives; premature prop surface.
- **Verify:** components render in isolation; app builds; existing screens
  visually unchanged (primitives not yet used).

### 12B: App shell and top status bar

- **Goal:** introduce `AppShell`, top status bar, two-column workflow/review
  layout, and **reorder panels into workflow order**. Remove the hero and the
  "Current milestone target" block.
- **Allowed changes:** layout/structure/JSX order in `src/app/App.tsx` only;
  wrap existing panels unchanged.
- **Files:** `src/app/App.tsx`, `AppShell`.
- **Risks:** accidentally changing state wiring during reorder; column layout
  breaking the diff/preview width. Keep all props and handlers identical.
- **Verify:** every panel still receives the same props; repo→report flow works
  end to end; nothing in `lib/*` touched (`git diff` confirms).

### 12C: Repository, changes, diff, and command panels

- **Goal:** convert group 1–2 panels to `Panel`/`SectionHeader`/`StatusBadge`/
  `EmptyState`/`CodeBlock`/`ActionButton`; apply the icon map.
- **Allowed changes:** presentational markup/classes inside RepoPicker,
  repository-inspection block, ChangedFilesPanel, DiffViewerPanel,
  CommandRunnerPanel. No changes to their logic, props, or callbacks.
- **Files:** those four/five feature files.
- **Risks:** altering command-runner state reporting; changing selection
  behavior; diff readability regressions.
- **Verify:** pick repo, list files, open diffs, run a command (success and
  failure), refresh — all behave as before.

### 12D: Payload, budget, staging, safety, report, and export panels

- **Goal:** convert group 3–6 panels; replace `SafetyGatePanel`'s local
  `statusStyles`/`findingStyles` with `StatusBadge`/tone helpers; make the
  blocked state assertive; move Stage Report + Export into the right rail;
  surface Token Budget as `MetricPill`s.
- **Allowed changes:** presentational only across Pre-Stage Screening, Stage
  Payload, Token Budget, Staging Ground, Safety Gate, Stage Report panels.
- **Files:** those six feature files.
- **Risks:** Safety Gate is the highest-stakes panel — do not alter which
  findings/limitations/redactions are shown or how `result` is read; only
  restyle. Markdown export copy path must stay byte-identical.
- **Verify:** screening tones, budget numbers, redaction preview, report
  contents, and Markdown export output all match pre-change behavior; blocked
  Safety Gate is unmistakable.

### 12E: Regression pass and screenshot readiness

- **Goal:** consistency sweep and demo prep.
- **Allowed changes:** spacing/tone tweaks only; no new components.
- **Files:** any touched above, minor.
- **Risks:** last-minute scope creep.
- **Verify:** run the full workflow on a clean repo, a dirty repo, a repo with a
  seeded secret (blocked), and a repo with a failing command; capture the
  screenshots intended for the README; confirm no console errors and no `lib/*`
  diff.

---

## 9. Non-goals

Explicitly out of scope for this pass:

- Any product behavior change; any change to `src/app/lib/*` logic.
- AI / API integration; provider or model selection; prompt construction.
- RAG implementation, retrieval, Tree-sitter, vector search.
- shadcn/ui adoption (not now). Framer Motion / animation libraries (not now).
- Full redesign, branding/marketing overhaul, illustration.
- Persistence, routing, new state-management library.
- Backend / Tauri / Rust changes; `tauri.conf.*`, lockfile, or config edits
  beyond the single `lucide-react` add in slice 12A.
- README or milestone-doc edits as part of the *code* slices (docs updated
  separately).

Default recommendation stands: **do not** add shadcn/ui or Framer Motion in this
pass. Tailwind + tiny primitives + one icon library is sufficient.

---

## 10. Acceptance criteria — "good enough for MVP demo"

- A first-time viewer can understand the workflow **without explanation** — the
  numbered order and section headers make the pipeline self-evident.
- Status badges are **consistent** everywhere (one `StatusBadge`, one tone
  scale) — no ad-hoc color strings remain in panels.
- Major panels feel **visually related** — shared `Panel` chrome, shared spacing
  rhythm, shared section grouping.
- Empty states are **useful** — each states the next action, not just "empty".
- Diff, command output, JSON, and report/Markdown areas are **readable** — one
  `CodeBlock` style, legible mono, sane scroll heights.
- The Safety Gate **blocked** state is **visually obvious** at a glance (red,
  iconed, mirrored in top bar and report).
- Markdown Export is **easy to find** — pinned in the review rail near the
  report, clearly labeled with an icon.
- **No existing functionality regresses** — verified by walking the full
  workflow and confirming a clean `git diff` over `src/app/lib/*` and Rust.
- The app is **screenshot-ready** for a portfolio README: dense, dark,
  credible workbench feel in a single wide-window capture.

---

## 11. Risks and constraints

| Risk | Mitigation |
|---|---|
| Over-redesigning into a new app | Restyle-in-place; wrap existing panels; per-slice commits; no logic edits. |
| Accidentally changing data flow | Freeze `src/app/lib/*` and all props/handlers; confirm with `git diff` each slice. |
| Adding too many dependencies | Exactly one new dep (`lucide-react`); no shadcn, no motion, no icon-highlighter libs. |
| Burying important evidence | Keep screening + Safety Gate prominent; use disclosures only for verbose metadata, never for findings/verdicts. |
| Too much whitespace for a dev tool | Keep density: `text-sm`, `gap-4`, `p-6`; do not inflate padding; workbench > airy SaaS. |
| Looks like a generic SaaS dashboard | No gradients/shadows/bright accents; color only for state; mono for evidence; slim top bar not a hero. |
| Two-column layout cramping the diff | Documented single-column + sticky-footer fallback (§2); pick per real widths in 12B. |
| Scope creep in 12E | 12E is tone/spacing only; no new components or behaviors. |

---

## 12. Final recommendation

Proceed to implementation in small Sonnet-sized slices, in this order:

1. **Slice 12A first:** add `lucide-react` and build the small UI primitives
   (`AppShell`, `Panel`, `SectionHeader`, `StatusBadge`, `ActionButton`,
   `EmptyState`, `CodeBlock`, `MetricPill`) with no panel changes.
2. Then **12B** (shell, top bar, workflow reorder), then **12C** and **12D**
   (panel conversions by group), then **12E** (regression + screenshots).
3. **Do not convert all panels in one commit.** One slice per commit, each
   verified to preserve behavior with a clean `git diff` over `src/app/lib/*`
   and the Rust/Tauri layers.

The single most valuable first PR is 12A + 12B: it establishes the primitives
and the workflow-ordered shell, which every later slice depends on, while
touching zero product logic.

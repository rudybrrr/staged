# Staged Comprehensive Project Plan

**Project name:** Staged  
**Working tagline:** Local-first, cost-aware AI verification before commit.  
**Document date:** 25 June 2026  
**Primary goal:** Build a technically serious AI Engineering portfolio project that helps developers audit AI-generated code changes before commit by combining Git diff analysis, local checks, retrieval, privacy controls, token budgeting, and structured LLM risk reports.

---

## 1. Executive Summary

Staged is a local-first, cost-aware AI verification workbench that helps developers audit AI-generated code changes before commit by combining Git diff analysis, local checks, retrieval, privacy controls, token budgeting, and structured LLM risk reports. The product is not positioned as another generic AI code reviewer or as a GPT wrapper. It is a pre-commit verification layer for developers using AI coding agents.

The core user flow is simple:

1. User selects a local repository.
2. Staged detects uncommitted changes.
3. Staged runs Pre-Stage Screening, such as tests, linting, type checking, and repository-specific commands.
4. Staged retrieves relevant code context using Git diffs, search, symbol extraction, and later vector retrieval.
5. Staged builds a compact Stage Payload.
6. Staged optionally sends only the selected Stage Payload to an LLM.
7. The LLM returns a Stage Report with missing tests, likely edge cases, and review recommendations.
8. The user sees what was found locally, what was inferred heuristically, and what was judged by the AI.
9. The user can export the report as Markdown.
10. Later versions include Stage Trials to evaluate whether Staged catches seeded bugs and how much each review costs.

The project thesis:

> AI-generated code should not be blindly accepted. It should be staged for verification through local evidence first, then reviewed by an LLM using the smallest useful context.

This makes Staged more than a GPT wrapper. The LLM is only one component in a larger verification pipeline.

---

## 2. Why This Project Is Worth Building

### 2.1 Problem

AI coding tools are becoming normal, but trust has not caught up. Developers can generate code quickly with tools like ChatGPT, Claude Code, GitHub Copilot, Cursor, Codex, and other AI agents. The problem is that generated code often looks plausible even when it is incomplete, under-tested, insecure, or inconsistent with the rest of the codebase.

The dangerous moment is often before commit:

```text
AI agent changes several files locally
→ Developer scans the diff quickly
→ Tests may or may not be run
→ Developer commits or continues building
→ Hidden bugs enter the repo
```

Staged targets that exact moment.

### 2.2 Market and Research Signals

The market and research signals support the problem:

- Stack Overflow's 2025 Developer Survey found that more developers distrust AI tool accuracy than trust it, 46% versus 33%. This supports the need for human verification and evidence-based AI workflows.[^stackoverflow-ai-2025]
- Sonar's 2026 State of Code materials reported a verification gap in AI coding: 96% of developers do not fully trust AI-generated code, yet only 48% always verify it before committing.[^sonar-verification-gap]
- Gartner's 2026 strategic technology trends include AI-native development platforms, multiagent systems, domain-specific language models, and AI security platforms. This suggests that AI development workflows, security, and governance are becoming strategically important.[^gartner-trends]
- A 2026 empirical study of AI-generated code in the wild analysed hundreds of thousands of verified AI-authored commits and found that AI-generated code can introduce long-term maintenance costs, including code smells, bugs, and security issues.[^ai-code-debt]
- A 2026 study on Tree-sitter-based codebase memory found that structural code representations can reduce token usage and tool calls compared with repeated file exploration, which supports the Staged direction of using code structure and retrieval instead of dumping whole repositories into prompts.[^codebase-memory]

### 2.3 Portfolio Value

Staged is a strong AI Engineering portfolio project because it demonstrates:

- Local desktop app development.
- Git and developer tooling integration.
- Static analysis and deterministic checks.
- Retrieval-augmented generation for code.
- Structured LLM outputs.
- Privacy-aware AI design.
- Token-cost optimization.
- Evaluation methodology.
- Engineering tradeoff thinking.

The portfolio story is strong:

> I built a local-first AI verification workbench that audits AI-generated code changes before commit using Git diffs, tests, type checks, code retrieval, structured risk analysis, privacy controls, token-budgeting, and seeded-bug evaluation.

That is much more credible than saying:

> I built an AI code reviewer using the OpenAI API.

---

## 3. Product Positioning

### 3.1 What Staged Is

Staged is:

- A local-first desktop app.
- A pre-commit verification workbench.
- A code-change evidence collector.
- A cost-aware LLM review pipeline.
- A privacy-aware verification layer around local deterministic analysis.
- A portfolio-grade AI Engineering system.

### 3.2 What Staged Is Not

Staged is not:

- A full replacement for human code review.
- A PR review SaaS competing directly with CodeRabbit, Greptile, Qodo, or GitHub Copilot Code Review.
- An autonomous coding agent.
- A tool that automatically rewrites production code without approval.
- A cloud-first team collaboration platform.
- A generic chatbot for repositories.
- A GPT wrapper that simply sends a diff to a model.
- A tool that guarantees bug-free code.

### 3.3 Differentiation

Most AI code review tools operate around pull requests. Staged operates before commit.

```text
Common AI PR reviewer:
Code written → PR opened → AI comments on PR → Developer responds

Staged:
AI changes local repo → Staged verifies local change set → Developer decides whether to commit
```

The key differentiators:

1. **Pre-commit focus**  
   Staged helps the developer before a PR exists.

2. **Local-first architecture**  
   The repo is scanned locally. Only selected evidence is sent to an LLM, and only when the user approves.

3. **Evidence-first reporting**  
   Reports separate deterministic evidence from heuristic risk and LLM judgment.

4. **Cost-aware AI usage**  
   Staged avoids sending unnecessary context and tracks token usage per review.

5. **Privacy controls**  
   Staged opens the Staging Ground so the user can inspect the exact Stage Payload and Safety Gate redactions before any external call.

6. **Evaluation mode**  
   Staged includes Stage Trials with seeded-bug scenarios to measure usefulness instead of relying on vague impressions.

### 3.4 Naming and Positioning

"Staged" connects naturally to Git's staging area, where developers decide what is ready to move from local work into a commit. The product operates at the boundary between local AI-generated changes and the final commit: it inspects the working tree, screens the change set, prepares a Stage Payload, and produces a Stage Report before the developer commits.

The name supports a developer-tool identity better than "DiffLens," which sounds more like a passive diff viewer. Staged should still use clear technical language internally. UI labels can use terms such as Stage Report, Staging Ground, Stage Payload, Stage History, Stage Trials, Token Budget, Pre-Stage Screening, and Safety Gate, but architecture, database, API, and schema names should remain explicit and unambiguous, such as `scan_id`, `diff_hash`, `repo_path`, `risk_level`, `payload_preview`, and `created_at`.

---

## 4. Target Users

### 4.1 Primary Persona: Student Developer Using AI Tools

The student developer uses ChatGPT, Claude Code, Cursor, Copilot, Codex, or similar tools to build school projects and portfolio apps. They often accept AI-generated changes but worry that the AI broke something. They need a lightweight verification layer that works locally.

Needs:

- Understand what changed.
- Run basic project checks.
- Identify risky files and logic.
- Know what tests are missing.
- Avoid sending entire private repos to AI.
- Keep API cost low.

### 4.2 Secondary Persona: Solo Indie Developer

A solo developer uses AI coding agents to move faster but lacks a team code review process.

Needs:

- Pre-commit review.
- Local report history.
- Lightweight quality gates.
- Privacy and cost control.
- Markdown export for changelogs or PR descriptions.

### 4.3 Tertiary Persona: Junior Developer in a Team

A junior developer wants to check their work before opening a PR.

Needs:

- Catch obvious mistakes early.
- Prepare cleaner PRs.
- Understand risk areas.
- Learn how to review AI-generated code.

---

## 5. Product Principles

1. **Local evidence before AI judgment**  
   Run deterministic checks first. Do not call the model if local evidence already explains the problem.

2. **Smallest useful context**  
   Never send the whole repo by default. Send changed hunks, relevant surrounding code, test results, and retrieved context.

3. **User-visible privacy**  
   The user should be able to see exactly what data would be sent to the AI provider.

4. **Structured outputs over vague text**  
   AI outputs should follow a schema, allowing reliable rendering, filtering, scoring, and export.

5. **Human approval for file writes**  
   The AI can propose tests or fixes, but the user must approve before files are changed.

6. **Cost is a first-class UX concern**  
   The app should estimate, track, and reduce token costs.

7. **Evaluation beats hype**  
   Use Stage Trials to test whether the system actually catches issues.

8. **Narrow MVP, comprehensive roadmap**  
   The first version should be small enough to finish. The larger plan can stay documented for future expansion.

---

## 6. Core User Flow

### 6.1 MVP Flow

```text
Open Staged
→ Select local repository
→ Detect current Git branch and uncommitted changes
→ Show changed files and diff
→ User enters task goal
→ User configures or selects checks
→ Run Pre-Stage Screening
→ Build basic Stage Payload
→ Review Token Budget
→ Open Staging Ground
→ Generate Stage Report
→ Show Stage Report in structured UI
→ Export Markdown report
```

### 6.2 Strong V1 Flow

```text
Open Staged
→ Select repo
→ Load saved repo profile
→ Scan diff
→ Classify files by risk category
→ Run configured Pre-Stage Screening
→ Retrieve relevant context with search and symbol extraction
→ Run Safety Gate
→ Open Staging Ground
→ Select model or auto-route model
→ Generate Stage Report
→ Suggest missing tests
→ Save report in Stage History
→ Export Markdown
→ Optionally run Stage Trials scenario
```

### 6.3 Future Advanced Flow

```text
Open repo
→ Detect AI-generated local change set
→ Build impact graph
→ Map changed functions to tests
→ Run affected tests only
→ Use RAG and call graph context
→ Generate Stage Report
→ Generate test drafts
→ User approves test file writes
→ Run generated tests
→ Compare before and after
→ Record usefulness and Token Budget metrics
```

---

## 7. Feature Set

## 7.1 MVP Features

### 7.1.1 Repo Picker

User selects a local repository folder.

Requirements:

- Validate folder contains `.git`.
- Show repo name, path, current branch, and Git status.
- Save recent repos locally.
- Allow removing repos from recent list.

Implementation:

- Tauri file dialog.
- Rust command validates Git repo.
- Store metadata in SQLite.

### 7.1.2 Git Diff Viewer

Shows uncommitted changes.

Requirements:

- Show changed files.
- Show added, deleted, modified, renamed files.
- Show line-level diff.
- Allow selecting files included in review.
- Support staged and unstaged changes.

Commands:

```bash
git status --short
git diff
git diff --staged
git diff --name-status
```

### 7.1.3 Task Goal Input

User explains what they intended to change.

Examples:

```text
I added login session expiry handling.
I refactored the task creation form.
I changed the database schema for projects.
I fixed the dashboard loading state.
```

Purpose:

- Gives the AI a target to compare against.
- Helps detect unrelated changes.
- Helps produce better test suggestions.

### 7.1.4 Command Runner

Runs project checks locally.

Default commands:

For JavaScript or TypeScript:

```bash
npm test
npm run lint
npm run typecheck
```

For Python:

```bash
pytest
ruff check .
mypy .
```

Requirements:

- User can configure commands per repo.
- Capture stdout, stderr, exit code, duration.
- Show pass, fail, skipped, not configured.
- Do not run destructive commands by default.
- Confirm before running commands that include suspicious terms like `rm`, `del`, `drop`, `truncate`, `deploy`, `push`, `publish`.

### 7.1.5 Basic Risk Classifier

Classifies changed files and diffs before any AI call.

Risk categories:

- Authentication.
- Authorization.
- Database or migrations.
- Payment or billing.
- API contract.
- Validation.
- Security-sensitive configuration.
- Dependency update.
- Test-only change.
- UI-only change.
- Documentation-only change.
- Unknown.

Heuristic examples:

```text
File path contains auth, session, middleware → Auth risk
File path contains migration, schema, prisma, drizzle → Database risk
Diff modifies package.json or lockfile → Dependency risk
Diff changes only .md files → Documentation risk
Diff changes only test files → Test-only risk
```

### 7.1.6 Stage Payload Builder

Builds the model input from local evidence. In the UI, this assembled context is the Stage Payload.

MVP packet:

```json
{
  "task_goal": "User-entered goal",
  "repo_metadata": {
    "branch": "feature/session-expiry",
    "language_guess": ["TypeScript"],
    "framework_guess": ["Next.js"]
  },
  "changed_files": [],
  "diff": "compact git diff",
  "check_results": [],
  "heuristic_risks": [],
  "included_context": []
}
```

### 7.1.7 Token Budget

Before Stage Report generation, show:

- Estimated input tokens.
- Estimated output tokens.
- Selected model.
- Estimated cost.
- Which files or context dominate token usage.

This makes cost visible and supports the product thesis without hiding model usage behind a vague review button.

### 7.1.8 Staging Ground

Show exactly what will be sent to the AI model before the user approves the call.

Requirements:

- User can inspect the Stage Payload.
- User can exclude files.
- User can disable AI call and use local-only mode.
- The Safety Gate runs before the Staging Ground is shown.

### 7.1.9 Stage Report

Generate a structured Stage Report.

Report sections:

- Change summary.
- Risk level.
- Risk categories.
- Evidence-based findings.
- Potential issues.
- Missing tests.
- Suggested next actions.
- Human review checklist.
- Confidence level.
- Token usage and estimated cost.

### 7.1.10 Markdown Export

Export a report to Markdown.

Useful for:

- Portfolio case studies.
- PR descriptions.
- Personal development logs.
- Learning reflection.

---

## 7.2 Strong V1 Features

### 7.2.1 RAG Context Retrieval

Retrieve relevant code context instead of sending the whole repo.

Initial retrieval layers:

1. Changed files.
2. Surrounding functions.
3. Files importing changed files.
4. Files imported by changed files.
5. Nearby tests.
6. README or docs mentioning changed feature.
7. Config files relevant to changed code.

Retrieval should be staged:

```text
Stage 1: Git diff and path heuristics
Stage 2: ripgrep keyword/reference search
Stage 3: Tree-sitter symbol extraction
Stage 4: Vector retrieval over code chunks
Stage 5: Impact graph and test mapping
```

### 7.2.2 Safety Gate

Before any AI call, scan the Stage Payload for likely secrets and privacy-sensitive content.

Detect:

- API keys.
- JWTs.
- Private keys.
- `.env` files.
- Access tokens.
- Database URLs.
- Webhook secrets.
- Cloud credentials.

Actions:

- Replace detected secrets with `[REDACTED_SECRET]`.
- Block `.env` files by default.
- Warn the user before sending suspicious content.
- Keep local redaction logs.

### 7.2.3 Stage History

Store past scans and Stage Reports locally.

Fields:

- Repo ID.
- Branch.
- Diff hash.
- Date.
- Risk level.
- Token usage.
- Token Budget.
- Report JSON.
- Export path.

### 7.2.4 Diff Hash Caching

If the diff has not changed, reuse prior scan results.

Benefits:

- Avoid repeated model calls.
- Faster workflow.
- Lower cost.

Cache key:

```text
repo_path + branch + git_diff_hash + selected_files + task_goal_hash + model_config_hash
```

### 7.2.5 Model Routing

Use different models for different tasks.

Example routing:

```text
Local-only scan → no model
Doc-only or UI-only change → cheaper model
Auth/database/security change → stronger model
Stage Trials → fixed model for fair comparison
```

### 7.2.6 Review Modes

Modes:

1. **Local-only**  
   No AI call. Only deterministic evidence and heuristic risks.

2. **Fast AI Review**  
   Small payload, cheaper model, concise output.

3. **Deep AI Review**  
   More context, stronger model, more detailed report.

4. **Stage Trials**  
   Controlled test cases and metric tracking.

5. **Safety Gate Strict Mode**  
   Maximum redaction, Staging Ground approval required, high-risk files excluded unless manually approved.

### 7.2.7 Test Suggestion Engine

Generate missing test ideas from diff and context.

The system should classify suggested tests:

- Happy path.
- Edge case.
- Error path.
- Security case.
- Regression case.
- Integration case.
- UI behavior case.

### 7.2.8 Structured Output Validation

Use JSON schema to force consistent reports.

OpenAI Structured Outputs are designed to constrain model responses to a supplied JSON Schema, which fits this use case well.[^openai-structured-outputs]

---

## 7.3 Advanced Features

### 7.3.1 Tree-sitter Symbol Parsing

Tree-sitter can build syntax trees for source files and update them efficiently as files change.[^tree-sitter]

Use it to extract:

- Functions.
- Classes.
- Methods.
- Imports.
- Exports.
- Test cases.
- Route handlers.
- API endpoints.
- Schema definitions.

Use cases:

- Identify which function was changed.
- Retrieve surrounding function instead of whole file.
- Find tests referencing the changed function.
- Build a lightweight dependency graph.
- Reduce tokens by sending symbol-level context.

### 7.3.2 Impact Graph

Build a graph of relationships:

```text
File imports file
Function calls function
Test covers function
Route uses handler
Component uses hook
Schema used by API endpoint
```

Use graph for:

- Finding impacted files.
- Prioritizing review context.
- Suggesting affected tests.
- Explaining why a change is risky.

### 7.3.3 Vector Retrieval

Use embeddings to retrieve semantically similar code, docs, and tests. LanceDB supports local-path connections and vector similarity search, making it a reasonable candidate for local vector retrieval.[^lancedb-quickstart]

Stored chunk metadata:

```json
{
  "chunk_id": "uuid",
  "repo_id": "uuid",
  "file_path": "src/auth/session.ts",
  "symbol_name": "validateSession",
  "symbol_type": "function",
  "language": "typescript",
  "start_line": 12,
  "end_line": 64,
  "content_hash": "sha256",
  "embedding_model": "text-embedding-model",
  "created_at": "timestamp"
}
```

Retrieval query types:

- Task goal query.
- Changed symbol query.
- Error output query.
- Missing test query.
- Risk-category query.

### 7.3.4 Test Draft Generation

After suggesting tests, Staged can generate test drafts.

Important rule:

> Generated tests are proposals. The user must approve before Staged writes files.

Flow:

```text
AI suggests tests
→ User selects one
→ Staged retrieves existing test style
→ AI drafts test code
→ User previews patch
→ User approves write
→ Staged runs test command
→ Report updated
```

### 7.3.5 Git Hook Integration

Optional pre-commit hook:

```text
git commit
→ Staged CLI scan runs
→ If high risk and checks failed, warn or block based on user setting
```

This should be optional. The desktop app should remain usable without hooks.

### 7.3.6 Local Model Support

Future support for local models through tools like Ollama or LM Studio.

Purpose:

- Better privacy.
- Lower marginal API cost.
- Offline experimentation.

Limitations:

- Local models may be weaker for deep code reasoning.
- Hardware limits matter.
- Output schema reliability may be worse.

### 7.3.7 Multi-Model Comparison

Compare review outputs from multiple models.

Use only in Stage Trials or research mode because it increases cost.

Metrics:

- Agreement rate.
- Risk classification consistency.
- Useful issue count.
- False positive count.
- Cost per useful finding.

---

## 8. Architecture

## 8.1 Recommended Stack

### Desktop App

- Tauri v2.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui or Radix primitives.

Tauri is suitable because it lets the app use a web frontend while controlling local system access through a Rust backend and capabilities model. Tauri v2 also supports frontend independence and cross-platform builds.[^tauri-v2][^tauri-capabilities]

### Backend Layer

Options:

1. **Rust-only backend through Tauri commands**  
   Best for Git commands, file system access, process execution, security, and desktop integration.

2. **Rust Tauri plus Python sidecar**  
   Useful if Python libraries are needed for notebook-style analysis, ML evaluation, or vector processing.

3. **Rust Tauri plus local Node worker**  
   Useful if most repo tooling is JavaScript/TypeScript-based.

Recommended starting point:

```text
Tauri Rust commands + React frontend + SQLite
```

Add sidecars only when needed.

### Local Storage

- SQLite for app state, repo profiles, scan history, settings, and reports. The UI presents this as Stage History.
- LanceDB or equivalent later for vector chunks.
- File-system cache for diff snapshots and exported reports.

### AI Provider

Start with OpenAI API.

Use:

- Structured outputs for report JSON.
- Prompt caching where applicable.
- Embeddings for vector retrieval later.

OpenAI prompt caching is designed to reduce latency and cost for long prompts.[^openai-prompt-caching]

---

## 8.2 High-Level Architecture

```text
React UI
  ↓ Tauri invoke
Rust Command Layer
  ↓
Repo Engine
  ├─ Git Scanner
  ├─ Diff Parser
  ├─ Command Runner
  ├─ Secret Redactor
  ├─ Risk Classifier
  ├─ Context Retriever
  ├─ Stage Payload Builder
  ├─ AI Client
  ├─ Report Generator
  └─ Local Storage
```

### Data Flow

```text
Repo path
→ Git status and diff
→ Changed file classification
→ Pre-Stage Screening
→ Context retrieval
→ Safety Gate
→ Evidence packet
→ Token estimate
→ User approval
→ structured Stage Report
→ UI rendering
→ Report saved locally
```

---

## 9. Suggested Repository Structure

```text
staged/
  README.md
  package.json
  src/
    app/
      App.tsx
      routes/
      components/
      features/
        repo-picker/
        diff-viewer/
        checks/
        risk-report/
        settings/
        benchmark/
      lib/
        api.ts
        schemas.ts
        utils.ts
    styles/
      globals.css
  src-tauri/
    Cargo.toml
    tauri.conf.json
    src/
      main.rs
      commands/
        repo.rs
        git.rs
        checks.rs
        files.rs
        ai.rs
        storage.rs
        redaction.rs
      domain/
        scan.rs
        risk.rs
        evidence.rs
        report.rs
      infra/
        git_cli.rs
        process_runner.rs
        sqlite.rs
        token_estimator.rs
  docs/
    product-plan.md
    architecture.md
    privacy-model.md
    evaluation-plan.md
  benchmark-repos/
    js-auth-bug/
    ts-validation-bug/
    python-date-bug/
  exports/
```

---

## 10. Data Model

### 10.1 SQLite Tables

#### repos

```sql
CREATE TABLE repos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  default_branch TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### repo_commands

```sql
CREATE TABLE repo_commands (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL,
  label TEXT NOT NULL,
  command TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (repo_id) REFERENCES repos(id)
);
```

#### scans

```sql
CREATE TABLE scans (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL,
  branch TEXT,
  task_goal TEXT,
  diff_hash TEXT NOT NULL,
  selected_files_json TEXT NOT NULL,
  local_scan_json TEXT NOT NULL,
  ai_report_json TEXT,
  risk_level TEXT,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (repo_id) REFERENCES repos(id)
);
```

#### reports

```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  markdown TEXT NOT NULL,
  export_path TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);
```

#### settings

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### benchmark_runs

```sql
CREATE TABLE benchmark_runs (
  id TEXT PRIMARY KEY,
  benchmark_name TEXT NOT NULL,
  model TEXT,
  total_cases INTEGER NOT NULL,
  true_positives INTEGER,
  false_positives INTEGER,
  false_negatives INTEGER,
  risk_accuracy REAL,
  total_tokens INTEGER,
  total_cost REAL,
  created_at TEXT NOT NULL
);
```

---

## 11. AI System Design

## 11.1 AI Responsibilities

The LLM should do:

- Summarise the change intent.
- Compare diff against user-stated task goal.
- Identify plausible failure modes.
- Explain risk in plain language.
- Suggest missing tests.
- Prioritize human review areas.
- Produce structured JSON.

The LLM should not do by default:

- Read the whole repo.
- Make unsupported claims.
- Pretend deterministic certainty.
- Write files without approval.
- Replace actual tests or type checks.
- Decide that code is safe with high confidence when evidence is weak.

## 11.2 Prompt Design

### System Prompt Requirements

The system prompt should enforce:

- Evidence-first reasoning.
- Distinction between facts and speculation.
- No unsupported claims.
- Structured JSON only.
- File path citation where possible.
- Conservative risk scoring.
- Test suggestions tied to changed behavior.

### Prompt Skeleton

```text
You are Staged, a code-change verification assistant.

Your job is not to approve code. Your job is to identify risk based only on the provided evidence.

Separate deterministic evidence from possible risks.
If evidence is insufficient, say so.
Do not invent files, functions, test results, or repository behavior.
Return JSON matching the provided schema.
```

### User Payload

```json
{
  "task_goal": "...",
  "repo_summary": "...",
  "changed_files": [],
  "diff_hunks": [],
  "check_results": [],
  "retrieved_context": [],
  "heuristic_risks": [],
  "token_budget": {
    "max_input_tokens": 12000,
    "max_output_tokens": 2500
  }
}
```

## 11.3 Output Schema

```json
{
  "change_summary": "string",
  "overall_risk": "low | medium | high | critical | unknown",
  "confidence": "low | medium | high",
  "deterministic_evidence": [
    {
      "type": "test_result | lint_result | typecheck_result | diff_fact | file_change",
      "summary": "string",
      "source": "string"
    }
  ],
  "risk_findings": [
    {
      "title": "string",
      "severity": "low | medium | high | critical",
      "category": "auth | database | api_contract | validation | security | dependency | testing | ui | unknown",
      "evidence": ["string"],
      "why_it_matters": "string",
      "suggested_action": "string"
    }
  ],
  "missing_tests": [
    {
      "test_name": "string",
      "test_type": "happy_path | edge_case | error_path | security | regression | integration | ui",
      "priority": "low | medium | high",
      "reason": "string"
    }
  ],
  "human_review_checklist": ["string"],
  "files_to_review": [
    {
      "file_path": "string",
      "reason": "string"
    }
  ],
  "final_recommendation": "safe_to_commit | run_more_checks | needs_review | do_not_commit_yet"
}
```

---

## 12. RAG and Context Retrieval Plan

## 12.1 Why RAG Matters

Without retrieval, the app either:

1. Sends too little context, causing shallow or wrong AI review.
2. Sends too much context, increasing cost and privacy risk.

RAG lets Staged retrieve only the code and documentation most relevant to the diff.

## 12.2 Retrieval Strategy

### Stage 1: Diff-Only Context

Use only:

- Changed files.
- Changed hunks.
- Nearby lines.
- Check outputs.

This is the MVP.

### Stage 2: Search-Based Retrieval

Use ripgrep or equivalent to find:

- Function names from diff.
- Imported symbols.
- API route names.
- Test references.
- Error messages.
- Config references.

Pros:

- Cheap.
- Local.
- Fast.
- Easy to implement.

Cons:

- Keyword search misses semantic relationships.

### Stage 3: Tree-sitter Symbol Retrieval

Parse changed files to identify:

- Changed functions.
- Changed classes.
- Changed exports.
- Changed tests.
- Changed route handlers.

Use symbols to retrieve precise context:

```text
Changed hunk is inside validateSession()
→ Send validateSession() function body
→ Find imports of validateSession
→ Find tests mentioning validateSession
```

### Stage 4: Vector Retrieval

Chunk repo content and embed chunks.

Chunking rules:

- Prefer function-level chunks.
- Fall back to class-level or file-section chunks.
- Avoid embedding build artifacts, lockfiles, generated files, node_modules, dist, and .next.
- Store chunk hash to avoid unnecessary re-embedding.

Retrieval score should combine:

```text
semantic similarity
+ changed file proximity
+ import/export relationship
+ test file proximity
+ risk category relevance
+ recent modification status
```

### Stage 5: Impact Graph Retrieval

Use structural relationships to retrieve:

- Callers.
- Callees.
- Importers.
- Tests.
- Related schema or config.

This is advanced and should come after the MVP.

---

## 13. Cost Optimization Plan

## 13.1 Cost Problem

AI code review can become expensive because naive systems send too much context, run multiple model calls, generate long outputs, or repeatedly review unchanged diffs.

Staged should make cost optimization a product feature, not an afterthought.

## 13.2 Cost-Saving Techniques

### 13.2.1 Deterministic Scan First

Before calling AI, run:

- Git diff parsing.
- Test command.
- Lint command.
- Typecheck command.
- Risk heuristics.
- Secret scan.
- Context retrieval.

If tests fail clearly, the app can report locally before AI review.

### 13.2.2 Token Budget Preview

Show:

- Estimated input tokens.
- Estimated output tokens.
- Estimated model cost within the Token Budget.
- Largest files or chunks by token count.
- Whether the payload exceeds budget.

### 13.2.3 Context Compression

Compression strategies:

- Include changed hunks instead of whole files.
- Include function bodies instead of files.
- Summarise long test output.
- Keep only relevant error lines.
- Limit context per file.
- Remove comments or whitespace in some modes.
- Exclude generated files.

### 13.2.4 Model Routing

Example model routing:

```text
No code change or docs-only → no model or cheap model
UI-only change → cheap model
Test-only change → cheap model
Auth/database/security/API change → stronger model
Stage Trials → selected fixed model
```

### 13.2.5 Prompt Caching

Prompt caching reduces cost and latency when stable prompt prefixes are reused. OpenAI documents prompt caching for reducing cost and latency on long prompts, and research on agentic prompt caching reports large cost reductions when cache strategy is designed carefully.[^openai-prompt-caching][^prompt-caching-research]

Design for caching:

- Keep system prompt stable.
- Keep JSON schema stable.
- Put stable policy and taxonomy before dynamic content.
- Put dynamic diff and command output later.
- Avoid randomizing prompt prefixes.

### 13.2.6 Diff Hash Caching

Cache AI result when:

- Diff hash is unchanged.
- Task goal is unchanged.
- Selected files are unchanged.
- Model and settings are unchanged.

### 13.2.7 Incremental Embeddings

Only re-embed chunks whose content hash changed.

### 13.2.8 Report Length Controls

Default report should be compact.

Use expandable details in UI:

```text
Default: concise Stage Report
Click: explain issue
Click: show evidence
Click: generate test draft
```

This prevents spending output tokens on details the user may not need.

## 13.3 Cost Metrics to Track

For every AI review:

- Input tokens.
- Output tokens.
- Estimated cost.
- Number of files changed.
- Number of files included in payload.
- Number of retrieved chunks.
- Cost per finding.
- Cost per useful finding, in Stage Trials.

---

## 14. Privacy and Security Plan

## 14.1 Privacy Principle

Default position:

> Nothing leaves the machine unless the user explicitly starts an AI review.

## 14.2 Local-Only Mode

Local-only mode includes:

- Git diff.
- Pre-Stage Screening.
- Risk heuristics.
- Secret scan.
- Markdown report.

No model call.

## 14.3 Staging Ground

Before any AI call:

- Show exact payload.
- Highlight files included.
- Highlight redactions.
- Show token estimate.
- Require user confirmation in privacy strict mode.

## 14.4 Safety Gate

Detect and redact:

- `.env` values.
- API keys.
- JWTs.
- Private keys.
- Access tokens.
- Database URLs.
- Cloud credentials.
- Webhook secrets.

Blocked file patterns by default:

```text
.env
.env.*
*.pem
*.key
id_rsa
id_ed25519
secrets.*
credentials.*
*.p12
*.pfx
```

## 14.5 Ignore Rules

Respect:

- `.gitignore`.
- `.stagedignore`.
- User-defined exclude patterns.

Example `.stagedignore`:

```text
.env*
secrets/**
private/**
*.pem
*.key
customer-data/**
```

## 14.6 Permission Model

Because Tauri uses a capabilities system to restrict frontend access to native APIs, the app should keep privileged operations in the Rust layer and expose only narrow commands to the UI.[^tauri-capabilities]

Rules:

- UI cannot directly read arbitrary files without backend approval.
- Backend validates repo path.
- Commands are limited to selected repo.
- Dangerous shell commands require confirmation.
- No cloud sync by default.

## 14.7 Audit Log

Local audit log should record:

- When AI review was run.
- Which files were included.
- Whether secrets were redacted.
- Model used.
- Token estimate.
- Report generated.

Do not store raw secrets.

---

## 15. Evaluation Plan

## 15.1 Why Evaluation Matters

Most AI apps look impressive in demos but are not measured. Staged should include evaluation to prove that it catches useful risks and does not simply generate generic warnings.

## 15.2 Stage Trials

Create small repos with known seeded changes.

Examples:

### Case 1: Missing Validation

Expected finding:

- New API endpoint accepts empty title.
- Missing negative test.

### Case 2: Broken Auth Guard

Expected finding:

- Protected route no longer checks session.
- High security risk.

### Case 3: Incorrect Date Logic

Expected finding:

- Uses local date incorrectly.
- Edge case around month boundary or timezone.

### Case 4: SQL Injection Risk

Expected finding:

- String interpolation in query.
- Security risk.

### Case 5: API Contract Break

Expected finding:

- Response shape changed but frontend consumer not updated.

### Case 6: Harmless UI Copy Change

Expected behavior:

- Low risk.
- Avoid over-warning.

## 15.3 Metrics

Track:

- True positives.
- False positives.
- False negatives.
- Risk classification accuracy.
- Missing test suggestion accuracy.
- Cost per scan.
- Cost per true positive.
- Average review time.
- Token usage per review.

## 15.4 Human Evaluation Rubric

For each finding, rate:

```text
0 = incorrect or useless
1 = somewhat relevant but vague
2 = correct and useful
3 = correct, specific, and actionable
```

## 15.5 Portfolio Evaluation Claim

Final case study should include honest metrics, for example:

```text
Staged detected 8 of 10 seeded high-risk changes in the Stage Trials suite.
It produced 2 false positives on harmless changes.
RAG mode reduced average input tokens by 62% compared with whole-file review.
Prompt caching and diff caching avoided repeated model calls on unchanged scans.
```

Do not invent these numbers. Measure them later.

---

## 16. UI and UX Plan

## 16.1 Main Screens

### Screen 1: Home and Repo Picker

Purpose:

- Select repo.
- Open recent repo.
- Create new scan.

### Screen 2: Repo Overview

Show:

- Repo name.
- Branch.
- Dirty state.
- Changed file count.
- Last scan.
- Configured commands.

### Screen 3: Diff Review

Show:

- Changed files sidebar.
- Diff viewer.
- File risk tags.
- Include/exclude toggles.

### Screen 4: Pre-Stage Screening

Show:

- Test command.
- Lint command.
- Typecheck command.
- Custom command.
- Output panel.
- Pass/fail status.

### Screen 5: Staging Ground

Show:

- Task goal.
- Included files.
- Retrieved context.
- Redacted secrets.
- Token estimate.
- Model selection.
- Token Budget.

### Screen 6: Stage Report

Show:

- Overall risk.
- Deterministic evidence.
- Risk findings.
- Missing tests.
- Human review checklist.
- Files to inspect.
- Final recommendation.

### Screen 7: Stage History

Show:

- Past scans.
- Diff hash.
- Risk level.
- Token Budget.
- Export link.

### Screen 8: Settings

Show:

- AI provider settings.
- Model routing.
- Privacy mode.
- Command profiles.
- Ignore rules.
- Token budgets.

### Screen 9: Stage Trials

Show:

- Stage Trials cases.
- Expected risks.
- Model performance.
- Cost-performance results.

## 16.2 UX Principle

The app should feel like a developer tool, not an AI toy.

Design style:

- Clean.
- Technical.
- Dense but readable.
- Evidence panels.
- Strong typography.
- Minimal marketing fluff.

---

## 17. Implementation Roadmap

## Phase 0: Project Setup

Goals:

- Initialize Tauri React app.
- Set up TypeScript, Tailwind, linting.
- Set up SQLite.
- Set up basic folder structure.

Deliverables:

- Running desktop app.
- Basic home screen.
- Repo picker mock.

## Phase 1: Local Repo Inspector

Goals:

- Select repo.
- Validate Git repo.
- Read branch and status.
- Show changed files.

Deliverables:

- Real repo picker.
- Git status view.
- Recent repos stored locally.

## Phase 2: Diff Viewer and Command Runner

Goals:

- Show Git diff.
- Run configured commands.
- Capture outputs.
- Store scan result.

Deliverables:

- Diff viewer.
- Checks screen.
- Local scan JSON.

## Phase 3: Basic Risk Engine

Goals:

- Classify changed files.
- Detect high-risk paths.
- Detect docs-only or UI-only changes.
- Build local evidence summary.

Deliverables:

- Risk tags on files.
- Local-only report.

## Phase 4: Stage Report

Goals:

- Add AI provider settings.
- Build Stage Payload.
- Estimate tokens.
- Open Staging Ground.
- Call model.
- Validate structured output.

Deliverables:

- Stage Report screen.
- Markdown export.

## Phase 5: Privacy and Cost Controls

Goals:

- Safety Gate.
- `.stagedignore`.
- Staging Ground improvements.
- Diff hash caching.
- Token Budget tracking.

Deliverables:

- Safety Gate strict mode.
- Cached scan reuse.
- Token Budget dashboard.

## Phase 6: Search-Based RAG

Goals:

- Extract symbols from diff text.
- Search references with ripgrep.
- Retrieve nearby tests.
- Include selected context in the Stage Payload.

Deliverables:

- RAG context panel.
- Comparison of diff-only versus retrieved-context review.

## Phase 7: Tree-sitter and Better Context

Goals:

- Parse TypeScript and Python files.
- Extract functions/imports/exports.
- Retrieve function-level chunks.
- Reduce context size.

Deliverables:

- Symbol-aware retrieval.
- Improved token efficiency.

## Phase 8: Stage Trials

Goals:

- Build seeded bug repos.
- Run Staged scans on Stage Trials cases.
- Track accuracy and cost.

Deliverables:

- Stage Trials dashboard.
- Portfolio metrics.

## Phase 9: Portfolio Polish

Goals:

- Write case study.
- Record demo video.
- Add screenshots.
- Publish GitHub repo.
- Prepare architecture diagram.

Deliverables:

- Portfolio page.
- README.
- Demo video.
- Research-backed case study.

---

## 18. MVP Scope Lock

The MVP should include:

```text
1. Repo picker
2. Git diff viewer
3. Test/lint/typecheck command runner
4. Task goal input
5. Basic risk classifier
6. Stage Payload builder
7. Token Budget
8. Staging Ground
9. Structured Stage Report
10. Markdown export
```

The MVP should not include:

```text
1. GitHub PR integration
2. Team collaboration
3. Cloud sync
4. Auto-fix
5. Multi-agent system
6. Full codebase graph
7. Full local model support
8. Marketplace plugins
9. Enterprise authentication
10. CI/CD platform integration
```

This is important. The project should be ambitious in architecture, but not bloated in first implementation.

---

## 19. Technical Risks and Mitigations

### Risk 1: Scope Creep

Problem:

The project can easily become too large.

Mitigation:

- Lock MVP.
- Build local scan before AI.
- Add RAG only after the Stage Report works.
- Add Stage Trials only after the core workflow works.

### Risk 2: Weak AI Output

Problem:

The model may produce vague or hallucinated review comments.

Mitigation:

- Use structured outputs.
- Require evidence fields.
- Reject reports that cite unknown files.
- Separate confidence from severity.
- Keep deterministic findings separate.

### Risk 3: Token Cost Gets High

Problem:

Code review can consume many tokens.

Mitigation:

- Token Budget preview.
- Payload size limit.
- RAG.
- Caching.
- Model routing.
- Compact output.

### Risk 4: Privacy Concerns

Problem:

Users may not want private code sent to AI providers.

Mitigation:

- Local-only mode.
- Staging Ground.
- Safety Gate.
- Ignore rules.
- Local storage.
- Optional local model support later.

### Risk 5: Command Runner Safety

Problem:

Running arbitrary commands can be dangerous.

Mitigation:

- Default to safe known commands.
- Require confirmation for dangerous commands.
- Show command before execution.
- Run in repo directory only.
- Do not support background hidden commands.

### Risk 6: Cross-Platform Differences

Problem:

Windows, macOS, and Linux command behavior differs.

Mitigation:

- Prioritize Windows first because that is the developer machine.
- Abstract process runner.
- Use shell carefully.
- Document supported platforms.

### Risk 7: RAG Quality

Problem:

Retrieved context may be irrelevant.

Mitigation:

- Start with transparent search results.
- Show retrieved context to user.
- Score context by path, symbol, and tests.
- Compare diff-only versus RAG review in Stage Trials.

---

## 20. Success Criteria

## 20.1 Product Success

Staged is successful as an MVP if:

- It can open a real repo.
- It can show current diffs.
- It can run Pre-Stage Screening.
- It can generate a structured Stage Report.
- It can identify missing tests in common cases.
- It can export Markdown.
- It tracks token usage and estimated cost.
- It does not send code without explicit user action.

## 20.2 Portfolio Success

Staged is successful as a portfolio project if the case study clearly explains:

- The real problem.
- Why existing AI review workflows are insufficient.
- The local-first architecture.
- The RAG pipeline.
- The privacy model.
- The cost optimization strategy.
- The Stage Trials evaluation.
- Honest results and limitations.

## 20.3 Technical Success

Technical success means:

- Clean architecture.
- Typed data models.
- Validated structured AI outputs.
- Reusable scanning engine.
- Local caching.
- Good error handling.
- Clear logging.
- No secret leakage in default behavior.

---

## 21. Portfolio Case Study Outline

Final case study sections:

1. Problem: AI-generated code is fast but not automatically trustworthy.
2. Market evidence: trust and verification gap.
3. Product thesis: local evidence before AI judgment.
4. Architecture: Tauri app, scanner, retriever, AI client, report engine.
5. RAG design: how context is selected and compressed.
6. Privacy design: Staging Ground and Safety Gate.
7. Cost design: token budgets, caching, routing.
8. Evaluation: Stage Trials seeded-bug suite.
9. Results: detection quality, false positives, token savings.
10. Lessons learned: what worked, what failed, what would come next.

---

## 22. Initial Build Order

Build in this exact order:

1. Tauri app shell.
2. Repo picker.
3. Git status.
4. Git diff viewer.
5. Command runner.
6. Local scan result object.
7. Basic risk classifier.
8. Stage Payload builder.
9. Token Budget estimator.
10. Staging Ground.
11. Structured Stage Report.
12. Markdown export.
13. Safety Gate.
14. Diff hash caching.
15. Search-based RAG.
16. Stage Trials.

Do not start with Tree-sitter or vector search. Those are valuable, but only after the base workflow works.

---

## 23. Definition of Done for MVP

MVP is done when:

- A user can select a repo.
- Staged shows changed files and diffs.
- The user can run at least one configured Pre-Stage Screening command.
- Staged builds a Stage Payload.
- Staged shows a Token Budget.
- The user can inspect the Staging Ground before any AI call.
- The app generates a structured Stage Report.
- The report separates deterministic evidence from AI judgment.
- The report suggests missing tests.
- The report exports to Markdown.
- The README explains privacy and limitations honestly.

---

## 24. Important Product Warnings

Do not overclaim.

Avoid saying:

```text
Staged guarantees safe code.
Staged replaces code review.
Staged detects all security issues.
Staged is better than CodeRabbit or Greptile.
```

Say instead:

```text
Staged helps developers verify AI-generated changes before commit.
Staged combines local evidence and structured AI reasoning.
Staged reduces blind trust by making risks, tests, and context visible.
Staged is designed to minimize unnecessary AI context and improve privacy.
```

---

## 25. Final Product Thesis

Staged should be built around this sentence:

> Staged is a local-first, cost-aware AI verification workbench that helps developers audit AI-generated code changes before commit by combining Git diff analysis, local checks, retrieval, privacy controls, token budgeting, and structured LLM risk reports.

This is the strongest version of the project.

---

## References

[^stackoverflow-ai-2025]: Stack Overflow, "AI | 2025 Developer Survey." https://survey.stackoverflow.co/2025/ai

[^sonar-verification-gap]: Sonar, "Sonar Data Reveals Critical Verification Gap in AI Coding," 8 January 2026. https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/

[^gartner-trends]: Gartner, "Top Strategic Technology Trends for 2026." https://www.gartner.com/en/articles/top-technology-trends-2026

[^ai-code-debt]: Liu et al., "Debt Behind the AI Boom: A Large-Scale Empirical Study of AI-Generated Code in the Wild," arXiv, 2026. https://arxiv.org/abs/2603.28592

[^codebase-memory]: Vogel et al., "Codebase-Memory: Tree-Sitter-Based Knowledge Graphs for LLM Code Exploration via MCP," arXiv, 2026. https://arxiv.org/abs/2603.27277

[^tauri-v2]: Tauri, "Tauri 2.0." https://v2.tauri.app/

[^tauri-capabilities]: Tauri, "Capabilities." https://v2.tauri.app/security/capabilities/

[^tree-sitter]: Tree-sitter, "Introduction." https://tree-sitter.github.io/

[^lancedb-quickstart]: LanceDB, "Quickstart." https://docs.lancedb.com/quickstart

[^openai-structured-outputs]: OpenAI, "Structured model outputs." https://developers.openai.com/api/docs/guides/structured-outputs

[^openai-prompt-caching]: OpenAI, "Prompt caching." https://developers.openai.com/api/docs/guides/prompt-caching

[^prompt-caching-research]: Lumer et al., "Don't Break the Cache: An Evaluation of Prompt Caching for Long-Horizon Agentic Tasks," arXiv, 2026. https://arxiv.org/abs/2601.06007

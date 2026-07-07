# Staged Research Paper

**Working title:** Staged: A Local-First AI Verification Workbench for Auditing AI-Generated Code Before Commit  
**Prepared by:** Rudy (with Gen AI formatting)   
**Date:** 25 June 2026  
**Status:** Research memo for project planning and portfolio use, not a peer-reviewed publication

---

## Abstract

AI-assisted coding has moved from novelty to normal workflow. Developers increasingly use tools such as GitHub Copilot, Claude Code, Cursor, Codex, and other coding agents to generate, refactor, explain, and test code. The central bottleneck is no longer whether AI can generate code. The bottleneck is whether developers can verify AI-generated code cheaply, quickly, and reliably before accepting it into a codebase.

This paper argues that a portfolio project named **Staged** is technically and strategically valid. Staged should not be positioned as another AI pull request reviewer, a generic AI code reviewer, or a GPT wrapper. That market already contains GitHub Copilot Code Review, CodeRabbit, Greptile, Qodo, PR-Agent, and similar tools. Instead, Staged should be positioned as a **local-first, cost-aware AI verification workbench** for developers using AI coding agents. Its job is to audit AI-generated code changes before commit by combining Git diff analysis, local checks, retrieval, privacy controls, token budgeting, and structured LLM risk reports.

The project is supported by market and research signals. Developer AI adoption is high, but trust remains weak. Stack Overflow's 2025 Developer Survey found that more developers distrust AI tool accuracy than trust it. Sonar's 2026 State of Code research reported a major verification gap: most developers do not fully trust AI-generated code, yet fewer than half always check AI-assisted code before committing. Empirical research on AI-generated code in the wild also suggests that AI-authored commits can introduce persistent maintenance issues, bugs, and security risks.

The project's strongest technical contribution is not “LLM reviews code.” The stronger contribution is a **cost-aware verification pipeline**: Pre-Stage Screening, incremental indexing, retrieval-augmented context selection, model routing, prompt caching, structured outputs, and evaluation using seeded bugs. This makes Staged more than a GPT wrapper and gives it a credible AI engineering portfolio story.

---

## 1. Research Questions

This memo addresses five questions:

1. **Does the market and research landscape support the need for AI-generated code verification?**
2. **How does Staged differ from existing AI code review tools?**
3. **How can Staged avoid becoming a simple GPT wrapper?**
4. **Can Staged reduce token usage compared with naive “send the repo to an LLM” workflows?**
5. **Is the project feasible and valuable as a student AI engineering portfolio project?**

---

## 2. Background: AI Coding Has an Adoption and Trust Gap

AI coding tools are now embedded in mainstream software development workflows. Google's 2025 DORA research reported that over 80% of respondents said AI enhanced productivity, while 59% reported a positive influence on code quality.[^dora-2025] GitHub's 2025 Octoverse report also frames AI, agents, and typed languages as major forces changing software development, noting that TypeScript became the most used language on GitHub in August 2025.[^octoverse-2025]

Adoption alone does not remove the need for verification. Stack Overflow's 2025 Developer Survey reported that more developers actively distrust the accuracy of AI tools than trust them, with 46% distrusting versus 33% trusting AI output.[^stackoverflow-2025-ai]

Sonar's 2026 State of Code research is even more directly aligned with Staged. Sonar reported that 96% of developers do not fully trust AI-generated code to be functionally correct, while only 48% always check AI-assisted code before committing it.[^sonar-verification-gap] The same report also states that AI helps developers code faster, but this speed creates a trust gap.[^sonar-report-pdf]

This suggests a clear product thesis:

> AI coding tools increase code generation speed, but verification practices have not caught up. Developers need a lightweight quality gate between AI-generated local changes and committed code.

---

## 3. Evidence That AI-Generated Code Needs Verification

### 3.1 AI-authored commits can introduce persistent issues

A 2026 large-scale empirical study, *Debt Behind the AI Boom*, analysed 304,362 verified AI-authored commits across 6,275 GitHub repositories. The study identified 484,606 distinct issues introduced by AI-authored commits and found that more than 15% of commits from every AI coding assistant studied introduced at least one issue. It also found that 24.2% of tracked AI-introduced issues survived until the latest repository revision.[^debt-ai-boom]

This matters because the risk is not just that AI code may contain mistakes. The larger risk is that mistakes can persist as technical debt after the code has been accepted.

### 3.2 Security remains a serious concern

A 2025 study on GitHub Copilot Code Review evaluated its ability to detect security vulnerabilities. The authors found that Copilot's code review frequently failed to detect critical vulnerabilities such as SQL injection, cross-site scripting, and insecure deserialization, while often focusing on lower-severity issues.[^copilot-security-review]

A separate 2025 paper on AI-generated code in public GitHub repositories used CodeQL static analysis and identified 4,241 CWE instances across 77 vulnerability types in files attributed to AI tools.[^ai-code-vulns]

These findings support a design requirement for Staged: it should not rely only on model judgement. It should combine model reasoning with deterministic tools such as static analysis, type checks, linting, tests, dependency scanning, and project-specific checks.

### 3.3 AI code review itself is imperfect

A 2026 study on human-AI synergy in agentic code review found that AI agent reviewers generated more code suggestions than human reviewers, but had lower adoption rates. More than half of unadopted AI suggestions were either factually incorrect or handled through developer-chosen alternatives.[^human-ai-review]

This supports another key principle: Staged should not pretend that AI review is a final authority. It should present an evidence-based Stage Report and keep the human in control.

### 3.4 Test review and validation are weak points

A 2026 replication study on test code review found that GitHub Actions adoption coincided with reduced test-centric review discussion in some projects, raising concerns about long-term software quality.[^test-code-review]

This supports a specific Staged feature: **missing test detection**. The app should flag when production code changes are not accompanied by relevant tests, and it should generate a concise test plan instead of only giving general code review comments.

---

## 4. Existing Tools and Competitive Landscape

The AI code review market is already active. Staged should not claim that “AI code review” is a new category.

### 4.1 GitHub Copilot Code Review

GitHub Copilot Code Review can review pull requests and provide feedback through GitHub's review workflow.[^github-copilot-review] This is a mature, platform-integrated experience.

### 4.2 CodeRabbit

CodeRabbit positions itself as an AI-powered platform for code review, planning, and development workflows. Its documentation describes pull request review on GitHub, implementation planning from Jira issues, Slack workflows, IDE feedback, and CLI feedback.[^coderabbit-docs]

### 4.3 Greptile

Greptile is especially close to the codebase-context angle. Its documentation describes graph-based codebase context and says it builds relationships between functions, dependencies, and patterns for smarter reviews.[^greptile-graph] Its product page describes graph indexing and agent swarms for reviewing pull requests.[^greptile-product]

### 4.4 Qodo

Qodo's documentation describes a code review experience with multi-agent review, rule enforcement, and context-aware feedback directly inside pull requests.[^qodo-docs]

### 4.5 PR-Agent

PR-Agent is an open-source AI-powered code review agent and a community-maintained legacy project of Qodo.[^pr-agent]

### 4.6 Implication for Staged

The crowded lane is:

```text
Pull request opened -> AI reviews PR -> AI posts comments -> developer responds -> merge
```

Staged should occupy a narrower lane:

```text
AI agent changes local repo -> developer has not committed yet -> Staged verifies changed files locally -> developer decides whether to commit
```

This repositioning matters. Staged is not trying to beat enterprise PR reviewers. It is a **pre-commit AI-code verification tool** for developers who are already using AI agents locally.

---

## 5. Proposed Product Positioning

### 5.1 One-sentence positioning

**Staged is a local-first, cost-aware AI verification workbench that helps developers audit AI-generated code changes before commit by combining Git diff analysis, local checks, retrieval, privacy controls, token budgeting, and structured LLM risk reports.**

### 5.2 What Staged is not

Staged should not be marketed as:

- A generic AI code reviewer
- A replacement for human review
- A security scanner
- A full IDE
- A coding agent
- A PR bot
- A magic bug detector
- A GPT wrapper that simply sends a diff to a model

### 5.3 What Staged is

Staged should be marketed as:

- A pre-commit verification layer for developers using AI coding agents
- A risk scanner for AI-generated code changes
- A Stage Payload and Stage Report generator
- A test-plan assistant
- A cost-aware code context retrieval and Token Budgeting system
- A portfolio-grade AI engineering system

### 5.4 Naming and Positioning

"Staged" connects naturally to Git's staging area. The product operates at the boundary between local AI-generated changes and the final commit: it inspects the working tree, runs Pre-Stage Screening, prepares a Stage Payload, applies the Safety Gate, and produces a Stage Report before the developer decides what to commit.

The name supports a developer-tool identity better than "DiffLens," which sounds more like a passive diff viewer. Staged should still use clear technical language internally. Product surfaces can use terms such as Stage Report, Staging Ground, Stage Payload, Stage History, Stage Trials, Token Budget, Pre-Stage Screening, and Safety Gate, while implementation details should keep explicit names such as `scan_id`, `diff_hash`, `repo_path`, `risk_level`, `payload_preview`, and `created_at`.

---

## 6. Differentiation From “Just Prompting an Agent”

A developer can already ask an AI agent to review code. That is not enough differentiation. Staged must turn an inconsistent prompt into a repeatable system.

### 6.1 Weak version

The weak version is:

```text
Send git diff to GPT -> receive generic review comments
```

This would be a GPT wrapper and should not be built.

### 6.2 Strong version

The strong version is:

```text
1. Detect changed files and hunks
2. Classify change type and risk category
3. Run Pre-Stage Screening
4. Retrieve only relevant code context
5. Build a compact Stage Payload
6. Ask the LLM for a structured Stage Report
7. Require file-specific evidence in the output
8. Suggest missing tests
9. Save the scan, Stage Report, and Token Budget
10. Evaluate the pipeline through Stage Trials
```

The LLM is not the app. The app is the pipeline around the LLM.

---

## 7. Technical Architecture

### 7.1 Recommended stack

- **Desktop shell:** Tauri v2, because it supports desktop apps using a web frontend and Rust application logic.[^tauri]
- **Frontend:** React and TypeScript
- **Local command execution:** Tauri Rust commands
- **Search:** ripgrep, because it recursively searches directories while respecting `.gitignore` rules.[^ripgrep]
- **Parsing:** Tree-sitter, because it can build concrete syntax trees for source files and update them efficiently.[^tree-sitter]
- **Local database:** SQLite
- **Retrieval:** Hybrid lexical search plus embeddings
- **Vector store:** LanceDB or another embedded vector store, because LanceDB supports local vector search and embedded AI workloads.[^lancedb]
- **AI API:** OpenAI or Anthropic, with model routing and caching

### 7.2 Main system modules

```text
Repo Scanner
  - detect branch
  - list changed files
  - read git diff
  - hash files
  - ignore binary, lock, build, and generated files

Command Runner
  - run tests
  - run lint
  - run typecheck
  - capture exit codes and logs

Code Context Retriever
  - find changed symbols
  - find imports and references
  - retrieve nearby tests
  - retrieve docs/configs relevant to the change

Evidence Builder
  - compact diff hunks
  - deterministic findings
  - relevant snippets
  - command outputs
  - task goal

Stage Report Generator
  - structured Stage Report JSON
  - risk categories
  - missing tests
  - file-specific reasoning
  - confidence and uncertainty

Evaluation Harness
  - seeded bugs
  - expected risk labels
  - precision/recall
  - cost per scan
```

---

## 8. Cost and Token-Efficiency Thesis

### 8.1 Why AI code review can become expensive

A naive AI review workflow can become expensive because it repeatedly sends large amounts of code context into high-end models. This is especially costly when the tool uses multiple agents, whole-codebase context, long outputs, or repeated review loops. Business Insider reported that Anthropic's Claude Code Review was criticised by some developers for estimated costs around $15 to $25 per review, depending on size and complexity.[^bi-claude-review-cost] TechRadar reported similar typical review cost estimates for Claude Code Review and described it as token-priced.[^techradar-claude-review-cost]

Raw API pricing also makes the cost issue visible. OpenAI's API pricing page lists different rates for input, cached input, and output tokens, with output tokens usually priced higher than input tokens.[^openai-pricing] Anthropic's pricing page similarly distinguishes input tokens, cache writes, cache hits, and output tokens.[^anthropic-pricing]

The point is not that every review is automatically expensive. A small one-shot review can be cheap. The problem is that serious AI code review workflows often grow into large-context, multi-call, multi-agent systems. Without context budgeting, cost can scale poorly.

### 8.2 Staged should treat token reduction as a product feature

Staged can differentiate by making token efficiency visible and deliberate.

Core principle:

> Do not send the whole repo to the model. Build the smallest useful evidence bundle.

### 8.3 Cost-control mechanisms

#### 1. Pre-Stage Screening before any LLM call

Run Pre-Stage Screening first:

```text
git diff
npm test
npm run lint
npm run typecheck
pytest
ruff
mypy
semgrep
```

If a deterministic check already fails, the LLM does not need the entire repo. It only needs the failing command, relevant diff, and nearby code.

#### 2. Change classification before retrieval

Classify each change using cheap deterministic signals:

```text
UI-only
Test-only
Config change
Database migration
Auth/session logic
API contract change
Data transformation
Dependency change
Security-sensitive change
```

Low-risk UI-only changes should get a smaller context budget than auth, database, or dependency changes.

#### 3. Hybrid retrieval instead of whole-repo context

Use lexical search and embeddings to retrieve only relevant snippets.

OpenAI's embeddings documentation describes embeddings as vectors where distance measures semantic relatedness.[^openai-embeddings] This supports semantic retrieval, but embeddings should not replace simple search. For code, a hybrid approach is better:

```text
Lexical search: exact function names, imports, routes, test names
AST search: changed symbols, definitions, references
Vector search: semantically related files and docs
```

#### 4. Incremental indexing

Hash each file and only re-index changed files.

```text
file_path + file_hash -> existing chunks still valid
changed file_hash -> re-parse and re-embed
```

This prevents paying repeatedly to embed or summarise unchanged code.

#### 5. Prompt caching

Prompt caching can reduce repeated prompt cost and latency when stable prompt prefixes are reused. OpenAI states that prompt caching can reduce latency by up to 80% and input token costs by up to 90%.[^openai-caching] Anthropic also documents prompt caching for repetitive tasks with consistent prompt elements.[^anthropic-caching]

Staged should use stable prompt sections:

```text
System instructions
Risk taxonomy
JSON schema
Output rules
Project review policy
```

Dynamic content such as diffs and command output should be placed after stable cached sections.

#### 6. Model routing

Use smaller or cheaper models for cheap tasks and stronger models only for high-risk analysis.

```text
Cheap model:
  - diff summary
  - change classification
  - report title
  - low-risk scan explanation

Stronger model:
  - auth/security/database risk analysis
  - failed test triage
  - ambiguous cross-file impact
```

This is more engineering-heavy than just using one frontier model for every step.

#### 7. Structured outputs

Ask for compact JSON first, then render the UI locally.

Instead of asking the model for a long essay, request:

```json
{
  "risk_level": "medium",
  "risk_categories": ["auth", "missing_tests"],
  "evidence": [
    {
      "file": "src/middleware.ts",
      "reason": "session expiry branch changed",
      "confidence": 0.78
    }
  ],
  "missing_tests": [
    "expired token redirects to login",
    "missing refresh token clears session"
  ]
}
```

The app can turn this into readable text without spending output tokens on verbose prose.

#### 8. Response caching

Cache reports by:

```text
repo id
commit base hash
working tree diff hash
settings hash
model version
prompt version
```

If the diff has not changed, the app should reuse the previous report instead of paying again.

#### 9. Token budget preview

Before calling the model, show:

```text
Estimated input tokens
Estimated output tokens
Estimated cost
Selected model
Reason for model choice
```

This turns cost-awareness into visible UX and strengthens the portfolio story.

### 8.4 Example comparison

A naive review may send:

```text
Full changed files
Large surrounding code
Unfiltered test logs
Full package files
Long instructions
Verbose output request
```

Staged should send a compact Stage Payload:

```text
Task goal
Diff hunks only
Failed command summaries
Relevant snippets only
Nearby tests only
Risk taxonomy
Compact JSON schema
```

The technical goal is not “zero tokens.” The goal is **evidence density per token**.

---

## 9. RAG Design for Code Review

### 9.1 Why RAG matters

The diff alone is often insufficient. A changed function may be called elsewhere, depend on hidden assumptions, or require tests in another file.

RAG lets Staged retrieve targeted context instead of sending the whole repository.

### 9.2 Suggested retrieval layers

```text
Layer 1: Git diff hunks
Layer 2: Changed file boundaries
Layer 3: Changed symbols via Tree-sitter
Layer 4: References via ripgrep
Layer 5: Nearby tests and test utilities
Layer 6: Project docs and config
Layer 7: Vector retrieval for semantically related code
```

### 9.3 Retrieval scoring

Each candidate snippet should receive a score:

```text
+ changed file
+ contains changed symbol
+ imports changed file
+ is imported by changed file
+ test file for changed module
+ recent failure mention in command output
+ semantic similarity to task goal
- generated file
- lock file
- minified file
- old snapshot file
```

The highest-scoring snippets form the evidence bundle.

---

## 10. Evaluation Plan

The strongest portfolio differentiator is evaluation. Most student AI projects stop after “the AI gives useful-looking answers.” Staged should measure whether its pipeline actually detects risk.

### 10.1 Stage Trials seeded-bug benchmark

Create small benchmark repos or branches with known issues:

```text
Bug 1: Missing input validation
Bug 2: Broken auth guard
Bug 3: Incorrect date boundary
Bug 4: SQL injection risk
Bug 5: Dependency/package hallucination
Bug 6: API response shape mismatch
Bug 7: Missing test for edge case
Bug 8: UI-only harmless change
Bug 9: Test-only harmless change
Bug 10: Refactor with no behavior change
```

### 10.2 Metrics

```text
Risk classification accuracy
Precision
Recall
False positive rate
False negative rate
Useful test suggestion rate
Evidence citation accuracy
Average input tokens per scan
Average output tokens per scan
Average cost per scan
Time per scan
```

### 10.3 Evaluation questions

```text
Did Staged flag the risky change?
Did it avoid overreacting to harmless changes?
Did it cite the right file?
Did the suggested test target the actual failure mode?
Did deterministic checks catch the issue before the LLM was needed?
Did RAG reduce token usage compared with sending all changed files?
```

This evaluation layer is what makes Staged look like AI engineering, not prompt engineering.

---

## 11. Feasibility Assessment

### 11.1 Feasible MVP

A strong MVP is feasible for a student solo project if the scope is controlled.

MVP features:

```text
1. Select local repo
2. Show changed files
3. Show Git diff
4. Configure test, lint, and typecheck commands
5. Run commands locally
6. Retrieve relevant files using ripgrep
7. Generate Stage Report
8. Suggest missing tests
9. Export Markdown report
10. Show Token Budget
```

Estimated feasibility: **7.5/10**

### 11.2 Not feasible for first version

Avoid these in the MVP:

```text
Full GitHub PR integration
Multi-user collaboration
Autonomous code fixes
Enterprise policy engine
Full security scanner
Deep multi-agent architecture
Whole-codebase graph at scale
IDE extension
Cloud sync
```

These are not bad features, but they will cause scope creep.

---

## 12. Risks and Mitigations

### Risk 1: It becomes a GPT wrapper

**Mitigation:** Make Pre-Stage Screening, retrieval, structured Stage Reports, Token Budgeting, and Stage Trials part of the core system.

### Risk 2: It competes too directly with CodeRabbit, Greptile, Qodo, and GitHub

**Mitigation:** Position Staged as local-first, pre-commit, solo-developer verification, not enterprise PR review.

### Risk 3: AI hallucination

**Mitigation:** Require file-specific evidence, separate deterministic findings from AI judgement, and show uncertainty.

### Risk 4: Token costs become high

**Mitigation:** Use change classification, hybrid retrieval, model routing, prompt caching, response caching, compact outputs, and Token Budgets.

### Risk 5: Weak demo

**Mitigation:** Create seeded bug cases and show before-and-after evidence.

---

## 13. Portfolio Value

Staged has strong portfolio value because it demonstrates:

```text
Desktop app engineering
Local file and repo access
Git integration
Command execution
Static analysis integration
RAG over code
Structured LLM outputs
Prompt caching and cost-aware design
Evaluation methodology
Human-in-the-loop AI safety
```

A strong portfolio tagline:

> Staged is a local-first, cost-aware AI verification workbench that helps developers audit AI-generated code changes before commit by combining Git diff analysis, local checks, retrieval, privacy controls, token budgeting, and structured LLM risk reports.

A strong case study angle:

> I built Staged because AI coding tools can generate code faster than developers can verify it. The project explores how to reduce blind trust in AI-generated code by combining deterministic software checks with retrieval-augmented LLM analysis and measurable evaluation.

---

## 14. Conclusion

The research supports the problem: AI-assisted coding is growing, developer trust is weak, and verification practices lag behind adoption. The market is already crowded with AI pull request reviewers, so Staged should not enter that lane directly.

The stronger and more defensible project is a **local-first pre-commit verification layer** for developers using AI coding agents. Its value comes from compressing and structuring evidence into a Stage Payload before asking the LLM to reason. This creates technical depth beyond a GPT wrapper and directly addresses the cost problem of naive AI code review.

For a student AI engineering portfolio, Staged is a strong project if built with discipline. The most important design rule is simple:

> Use AI after the system has already done as much deterministic, local, cheap work as possible.

---

## References

[^dora-2025]: Google. “How are developers using AI? Inside our 2025 DORA report.” 23 September 2025. https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/

[^octoverse-2025]: GitHub. “Octoverse: A new developer joins GitHub every second as AI leads TypeScript to #1.” 28 October 2025. https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/

[^stackoverflow-2025-ai]: Stack Overflow. “AI | 2025 Stack Overflow Developer Survey.” https://survey.stackoverflow.co/2025/ai

[^sonar-verification-gap]: Sonar. “Sonar Data Reveals Critical Verification Gap in AI Coding.” 8 January 2026. https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/

[^sonar-report-pdf]: Sonar. “State of Code Developer Survey Report 2026.” https://www.sonarsource.com/state-of-code-developer-survey-report.pdf

[^debt-ai-boom]: Liu, Yue, Ratnadira Widyasari, Yanjie Zhao, Ivana Clairine Irsan, and David Lo. “Debt Behind the AI Boom: A Large-Scale Empirical Study of AI-Generated Code in the Wild.” arXiv, 2026. https://arxiv.org/abs/2603.28592

[^copilot-security-review]: Amro, Amena, and Manar H. Alalfi. “GitHub's Copilot Code Review: Can AI Spot Security Flaws Before You Commit?” arXiv, 2025. https://arxiv.org/abs/2509.13650

[^ai-code-vulns]: Schreiber, Maximilian, and Pascal Tippe. “Security Vulnerabilities in AI-Generated Code: A Large-Scale Analysis of Public GitHub Repositories.” arXiv, 2025. https://arxiv.org/abs/2510.26103

[^human-ai-review]: “Human-AI Synergy in Agentic Code Review.” arXiv, 2026. https://arxiv.org/html/2603.15911v1

[^test-code-review]: Sun, Hui, Yinan Wu, Wesley K. G. Assunção, and Kathryn T. Stolee. “Test Code Review in the Era of GitHub Actions: A Replication Study.” arXiv, 2026. https://arxiv.org/abs/2603.15935

[^github-copilot-review]: GitHub Docs. “Using GitHub Copilot code review.” https://docs.github.com/copilot/using-github-copilot/code-review/using-copilot-code-review

[^coderabbit-docs]: CodeRabbit Docs. “AI Code Review.” https://docs.coderabbit.ai/

[^greptile-graph]: Greptile Docs. “Graph-based Codebase Context.” https://www.greptile.com/docs/how-greptile-works/graph-based-codebase-context

[^greptile-product]: Greptile. “AI Code Review.” https://www.greptile.com/

[^qodo-docs]: Qodo Docs. “The Qodo Code Review experience.” https://docs.qodo.ai/code-review

[^pr-agent]: GitHub. “The-PR-Agent/pr-agent.” https://github.com/The-PR-Agent/pr-agent

[^bi-claude-review-cost]: Business Insider. “Anthropic launched an AI code reviewer. Some developers say it's expensive and undermines senior engineers.” March 2026. https://www.businessinsider.com/anthropic-claude-code-review-token-costs-developers-backlash-engineers-2026-3

[^techradar-claude-review-cost]: TechRadar. “Anthropic launches a new code review tool to check AI-generated content, but it might cost you more than you'd hope.” March 2026. https://www.techradar.com/pro/anthropic-launches-a-new-code-review-tool-to-check-ai-generated-content-but-it-might-cost-you-more-than-youd-hope

[^openai-pricing]: OpenAI. “API Pricing.” https://openai.com/api/pricing/

[^anthropic-pricing]: Anthropic. “Pricing - Claude API Docs.” https://platform.claude.com/docs/en/about-claude/pricing

[^openai-embeddings]: OpenAI. “Vector embeddings.” https://developers.openai.com/api/docs/guides/embeddings

[^openai-caching]: OpenAI. “Prompt caching.” https://developers.openai.com/api/docs/guides/prompt-caching

[^anthropic-caching]: Anthropic. “Prompt caching - Claude API Docs.” https://platform.claude.com/docs/en/build-with-claude/prompt-caching

[^tauri]: Tauri. “Tauri 2.0.” https://v2.tauri.app/

[^ripgrep]: BurntSushi. “ripgrep.” GitHub. https://github.com/BurntSushi/ripgrep

[^tree-sitter]: Tree-sitter. “tree-sitter.” GitHub. https://github.com/tree-sitter/tree-sitter

[^lancedb]: LanceDB Docs. https://docs.lancedb.com/

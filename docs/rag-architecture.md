# RAG Architecture for Staged

## Purpose

This document defines what proper retrieval-augmented generation means for Staged, why it matters, and how it should be built after the MVP local verification spine is stable.

Staged is a local-first, cost-aware AI verification workbench. The MVP is intentionally focused on repo inspection, changed files, diff review, command evidence, Pre-Stage Screening, Stage Payload, Token Budget, Staging Ground, Safety Gate, and local Stage Report preview before real AI integration.

RAG must be treated as a real retrieval subsystem later, not a vague "add embeddings" feature.

Staged must not call a feature "RAG" just because it sends extra files to an LLM. Proper RAG must retrieve relevant local evidence with source metadata, scoring, citations, token budgeting, and evaluation. RAG should reduce what the AI needs to review. It must not mean sending whole repositories to an LLM. Retrieval must remain local-first.

## Definition of real RAG in Staged

Real RAG in Staged means the app selects relevant local evidence before building the final AI-ready payload, records why that evidence was selected, and lets the user inspect the retrieval sources before submission.

A retrieval item must include:

- `chunk_id`
- `file_path`
- `start_line`
- `end_line`
- `symbol_name` when available
- `retrieval_method`
- `retrieval_reason`
- `score`
- `content`

Conceptual shape:

```json
{
  "chunk_id": "abc123",
  "file_path": "src/auth/session.ts",
  "start_line": 18,
  "end_line": 74,
  "symbol_name": "validateSession",
  "retrieval_reason": "changed symbol referenced by modified middleware",
  "retrieval_method": "tree_sitter_symbol + ripgrep_reference",
  "score": 0.87,
  "content": "..."
}
```

## Pipeline

Intended pipeline:

```text
diff / task goal / failed checks
→ query builder
→ local repo index
→ hybrid retrieval
→ context scoring and ranking
→ Safety Gate redaction
→ Stage Payload with cited retrieved snippets
→ structured Stage Report
```

Retrieval happens before the final AI-ready payload is assembled. Safety Gate must inspect retrieved snippets before any future LLM submission.

The Stage Payload should contain only the approved, cited, budgeted retrieval context needed for the review. Omitted candidates should remain visible as metadata so the user can understand what was excluded and why.

## Level 1: Lexical retrieval

Current planned behavior:

- Use `ripgrep` first.
- Build retrieval queries from changed file paths.
- Build retrieval queries from changed symbol names.
- Build retrieval queries from imported and exported names.
- Build retrieval queries from route names.
- Build retrieval queries from API endpoint strings.
- Build retrieval queries from config keys.
- Build retrieval queries from test names.
- Build retrieval queries from failed command output.
- Build retrieval queries from error messages.
- Retrieve exact references and nearby tests.
- Attach file path and line ranges.

Why:

- Cheap.
- Local.
- Good for exact code references.
- Easy to inspect and evaluate.

Limitations:

- Weak for semantic similarity.
- Depends on good query terms.
- Can miss renamed or conceptually related code.

## Level 2: Symbol-aware retrieval

Current planned behavior:

- Use Tree-sitter later.
- Extract functions.
- Extract classes.
- Extract imports.
- Extract exports.
- Extract route handlers.
- Extract test blocks.
- Extract changed symbol boundaries.
- Retrieve function-level or symbol-level chunks instead of whole files.
- Link changed symbols to references and tests where possible.

Why:

- Better code-aware chunks.
- Better token efficiency.
- Stronger portfolio value.

Limitations:

- Requires language grammar handling.
- Requires careful fallback behavior.
- More implementation complexity.

## Level 3: Hybrid vector retrieval

Current planned behavior:

- Add vector retrieval only after lexical and symbol retrieval work.
- Chunk repository content with stable metadata.
- Cache embeddings by content hash.
- Store vectors locally.
- Combine vector similarity with lexical and symbol signals.

Why:

- Semantic fallback can find conceptually related code.
- Useful for larger repos and documentation.

Limitations:

- Vector retrieval without good chunking and metadata is weak.
- More expensive and complex.
- Must remain local-first where practical.

## Hybrid scoring

The final retrieval score may combine:

- Semantic similarity.
- Exact lexical match strength.
- Changed file proximity.
- Import/export relationship.
- Test file proximity.
- Risk category relevance.
- Recent modification status.
- Safety Gate status.
- Token budget pressure.

This scoring model can evolve. The important requirement is that scores are explainable enough for the user to understand why a snippet was included, excluded, promoted, or trimmed.

## Stage Payload integration

Future Stage Payload should include:

```ts
retrieved_context: Array<{
  chunk_id: string;
  file_path: string;
  start_line: number;
  end_line: number;
  symbol_name: string | null;
  retrieval_method: string;
  retrieval_reason: string;
  score: number;
  content: string;
}>;
```

It should also include:

- Omitted retrieval candidates.
- Retrieval budget.
- Retrieval warnings.
- Total retrieved-context token estimate.

The retrieved context should be cited, bounded, redacted where needed, and separate from deterministic local evidence and later AI judgment.

## Staging Ground integration

Staging Ground should show:

- Retrieved snippets.
- Why each snippet was included.
- Source path and line range.
- Score.
- Token contribution.
- Safety Gate status.
- Omitted context summary.

This keeps retrieval inspectable before any future LLM submission and reinforces the privacy and cost boundary.

## Stage Report integration

Future Stage Reports should cite retrieved evidence by:

- File path.
- Line range.
- Retrieval item ID.
- Finding relationship.

The report should not make claims unsupported by deterministic evidence or retrieved context. Deterministic evidence, retrieval evidence, and AI judgment should remain labeled separately.

## Evaluation

Future Stage Trials should evaluate RAG by:

- Comparing diff-only review against retrieval-augmented review.
- Tracking token usage.
- Tracking whether the system retrieved the correct file.
- Tracking whether the report cited the right evidence.
- Tracking whether seeded bugs were detected.
- Tracking false positives from irrelevant retrieval.
- Tracking cost and reliability tradeoffs.

Without evaluation, RAG claims are weak. Staged should be able to show that retrieval improves evidence quality, reduces unnecessary payload size, or improves review reliability before presenting RAG as a meaningful product capability.

## Non-goals

- Do not send the whole repo to an LLM by default.
- Do not start with vector DBs before lexical and symbol retrieval.
- Do not call manually selected files "RAG."
- Do not hide retrieval sources from the user.
- Do not mix deterministic evidence, retrieval evidence, and AI judgment without labels.
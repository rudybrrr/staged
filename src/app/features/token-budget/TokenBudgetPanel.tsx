import type { TokenBudget } from "../../lib/tokenBudget";

type TokenBudgetPanelProps = {
  budget: TokenBudget | null;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function warningStyles(level: TokenBudget["warnings"][number]["level"]) {
  if (level === "warning") {
    return "border-amber-900/70 bg-amber-950/30 text-amber-100";
  }

  return "border-zinc-800 bg-zinc-950 text-zinc-300";
}

export function TokenBudgetPanel({ budget }: TokenBudgetPanelProps) {
  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Token Budget</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Approximate local estimate only. No model pricing or exact tokenizer
            is included yet.
          </p>
        </div>

        {budget && (
          <span className="w-fit rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
            Read-only estimate
          </span>
        )}
      </div>

      {!budget && (
        <p className="mt-4 text-sm text-zinc-500">
          Select a valid Git repository to estimate the current Stage Payload
          size.
        </p>
      )}

      {budget && (
        <div className="mt-6 space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-zinc-500">Estimated tokens</dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-100">
                {formatNumber(budget.estimated_tokens)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Characters</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {formatNumber(budget.character_count)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Bytes</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {formatNumber(budget.byte_count)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-zinc-500">Estimator</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-100">
                {budget.estimator}
              </dd>
            </div>
          </dl>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Estimator note
            </h3>
            <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300">
              {budget.estimator_note} Section totals are estimated from
              individually serialized sections and may not exactly sum to the
              full payload size.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">
              Section contributions
            </h3>
            <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Section</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Tokens
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Characters
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Bytes</th>
                    <th className="px-3 py-2 text-right font-medium">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/60">
                  {budget.sections.map((section) => (
                    <tr key={section.name}>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-200">
                        {section.name}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-300">
                        {formatNumber(section.estimated_tokens)}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-300">
                        {formatNumber(section.character_count)}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-300">
                        {formatNumber(section.byte_count)}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-300">
                        {section.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-200">Warnings</h3>
            {budget.warnings.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {budget.warnings.map((warning) => (
                  <li
                    key={warning.id}
                    className={`rounded-lg border px-3 py-2 text-sm leading-6 ${warningStyles(
                      warning.level,
                    )}`}
                  >
                    <span className="font-medium capitalize">
                      {warning.level}
                    </span>
                    <span className="text-zinc-500"> · </span>
                    {warning.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No token budget warnings detected.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

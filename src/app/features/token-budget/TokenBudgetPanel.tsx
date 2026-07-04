import { Gauge } from "lucide-react";

import type { TokenBudget } from "../../lib/tokenBudget";
import { EmptyState, MetricPill, Panel, StatusBadge } from "../../ui";

type TokenBudgetPanelProps = {
  budget: TokenBudget | null;
  embedded?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function TokenBudgetPanel({ budget, embedded = false }: TokenBudgetPanelProps) {
  const hasWarnings = budget
    ? budget.warnings.some((warning) => warning.level === "warning")
    : false;

  return (
    <Panel
      title="Token Budget"
      icon={<Gauge className="h-5 w-5" />}
      description="Approximate local estimate only. No model pricing or exact tokenizer is included yet."
      status={
        budget
          ? hasWarnings
            ? { tone: "warning", label: "Warnings" }
            : { tone: "preview", label: "Read-only estimate" }
          : undefined
      }
      variant={embedded ? "inset" : "default"}
    >
      {!budget && (
        <EmptyState
          icon={<Gauge className="h-5 w-5" />}
          title="No Token Budget yet"
          description="Select a valid Git repository to estimate the current Stage Payload size."
        />
      )}

      {budget && (
        <>
          <div className="flex flex-wrap gap-2">
            <MetricPill
              label="Estimated tokens"
              value={formatNumber(budget.estimated_tokens)}
              tone={hasWarnings ? "warning" : "idle"}
            />
            <MetricPill label="Characters" value={formatNumber(budget.character_count)} />
            <MetricPill label="Bytes" value={formatNumber(budget.byte_count)} />
            <MetricPill label="Estimator" value={budget.estimator} />
          </div>

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
            <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-800">
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
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-300"
                  >
                    <StatusBadge tone={warning.level}>{warning.level}</StatusBadge>
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
        </>
      )}
    </Panel>
  );
}

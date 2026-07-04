import { StatusBadge, type StatusTone } from "./StatusBadge";

export interface PipelineStep {
  id: string;
  label: string;
  tone: StatusTone;
  detail: string;
}

export interface PipelineStripProps {
  steps: PipelineStep[];
  className?: string;
}

export function PipelineStrip({ steps, className = "" }: PipelineStripProps) {
  return (
    <div className={`flex items-center gap-3 px-6 py-2.5 whitespace-nowrap ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex shrink-0 items-center gap-3">
          {index > 0 ? (
            <span className="text-xs text-zinc-700" aria-hidden="true">
              →
            </span>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-300">{step.label}</span>
            <StatusBadge tone={step.tone} dot>
              {step.detail}
            </StatusBadge>
          </div>
        </div>
      ))}
    </div>
  );
}

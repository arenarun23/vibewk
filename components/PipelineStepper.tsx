import type { PipelineStep } from "@/lib/types";

const STAGES: { step: PipelineStep; label: string }[] = [
  { step: "created", label: "① 코드 준비" },
  { step: "github_pushed", label: "② GitHub 저장소" },
  { step: "deploying", label: "③ 배포" },
  { step: "live", label: "④ Live" },
];

function stageIndex(step: PipelineStep) {
  if (step === "failed") return -1;
  if (step === "security_gate") return 0;
  const idx = STAGES.findIndex((s) => s.step === step);
  return idx === -1 ? 0 : idx;
}

export default function PipelineStepper({ current }: { current: PipelineStep }) {
  const activeIdx = stageIndex(current);
  const failed = current === "failed";

  return (
    <div className="flex items-center gap-2">
      {STAGES.map((s, i) => {
        const done = !failed && i < activeIdx;
        const active = !failed && i === activeIdx;
        return (
          <div key={s.step} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-medium ${
                failed
                  ? "bg-red-50 text-red-400"
                  : done
                    ? "bg-green-100 text-green-700"
                    : active
                      ? "bg-blue-100 text-[var(--brand)]"
                      : "bg-gray-100 text-gray-400"
              }`}
            >
              {s.label}
            </div>
            {i < STAGES.length - 1 && <span className="text-gray-300">›</span>}
          </div>
        );
      })}
    </div>
  );
}

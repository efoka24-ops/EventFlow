import { CheckCircle2 } from "lucide-react";

const STEPS = [
  { key: "form", label: "Formulaire" },
  { key: "payment", label: "Paiement" },
  { key: "confirmation", label: "Confirmation" },
];

export default function RegistrationFlowHeader({ currentStep = "form" }) {
  const activeIndex = Math.max(0, STEPS.findIndex((s) => s.key === currentStep));

  return (
    <div className="w-full">
      <div className="flex items-center w-full">
        {STEPS.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              {/* Step bubble + label */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-muted border-border text-muted-foreground",
                  ].join(" ")}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span>{index + 1}</span>}
                </div>
                <span
                  className={[
                    "text-xs font-medium whitespace-nowrap",
                    isActive ? "text-primary" : isDone ? "text-emerald-600" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full transition-colors" style={{
                  background: index < activeIndex ? "hsl(var(--primary))" : "hsl(var(--border))",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Wrench className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Site en maintenance
        </h1>

        <p className="text-slate-400 text-base leading-relaxed mb-8">
          Nous effectuons des améliorations pour vous offrir une meilleure
          expérience. Le site sera de nouveau disponible très prochainement.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Retour imminent</span>
        </div>

       {/*  <p className="mt-10 text-xs text-slate-600">
          Vous êtes administrateur ?{" "}
          <a href="/admin" className="text-amber-400 hover:underline">
            Accéder au panneau admin
          </a>
        </p> */}
      </div>
    </div>
  );
}

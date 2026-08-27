import { useEffect, useState } from "react";
import type { ProjectSummary } from "../types";
import { listProjects } from "../lib/api";
import type { Route } from "../App";

export default function Dashboard({
  onNavigate,
  onOpenProject
}: {
  onNavigate: (r: Route) => void;
  onOpenProject: (id: string, type: "flowchart" | "orgchart") => void;
}) {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message));
  }, []);

  const flowCount = projects?.filter((p) => p.type === "flowchart").length ?? 0;
  const orgCount = projects?.filter((p) => p.type === "orgchart").length ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
      <p className="text-ash text-sm mt-1">Transforme relatos em fluxogramas e organogramas.</p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard label="Fluxogramas criados" value={flowCount} accent="#4F7CFF" />
        <StatCard label="Organogramas criados" value={orgCount} accent="#8DA3FF" />
        <StatCard label="Projetos totais" value={projects?.length ?? 0} accent="#3FAE83" />
      </div>

      <div className="mt-8">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ash mb-3">
          + Novo diagrama
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ActionCard
            title="Fluxograma com IA"
            desc="Descreva o processo em texto livre e deixe a IA estruturar."
            onClick={() => onNavigate("flowchart")}
          />
          <ActionCard
            title="Organograma com IA"
            desc="Informe a hierarquia em texto e gere a árvore automaticamente."
            onClick={() => onNavigate("orgchart")}
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ash">
            Últimos projetos
          </div>
          <button onClick={() => onNavigate("projects")} className="text-xs text-signal2 hover:underline">
            ver todos
          </button>
        </div>
        {error && <div className="text-coral text-sm">{error}</div>}
        {!projects && !error && <div className="text-ash text-sm">Carregando…</div>}
        {projects && projects.length === 0 && (
          <div className="text-ash text-sm border border-dashed border-line rounded-md p-6 text-center">
            Nenhum projeto ainda. Descreva um processo para gerar o primeiro fluxograma.
          </div>
        )}
        <div className="flex flex-col gap-2">
          {projects?.slice(0, 6).map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenProject(p.id, p.type)}
              className="flex items-center justify-between bg-panel border border-line rounded-md px-4 py-3 text-left hover:border-signal/60 transition-colors"
            >
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-[11px] text-ash font-mono mt-0.5">
                  {p.type === "flowchart" ? "Fluxograma" : "Organograma"} · v{p.version} · {p.author}
                </div>
              </div>
              <div className="text-[11px] text-ash">
                {new Date(p.updated_at).toLocaleDateString("pt-BR")}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-panel border border-line rounded-md p-4">
      <div className="font-display text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-xs text-ash mt-1">{label}</div>
    </div>
  );
}

function ActionCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-panel border border-line rounded-md p-5 hover:border-signal/60 transition-colors group"
    >
      <div className="font-display font-semibold text-sm group-hover:text-signal2 transition-colors">
        {title}
      </div>
      <div className="text-xs text-ash mt-1.5 leading-relaxed">{desc}</div>
    </button>
  );
}

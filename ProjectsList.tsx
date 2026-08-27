import { useEffect, useState } from "react";
import type { ProjectSummary } from "../types";
import { deleteProject, listProjects } from "../lib/api";

export default function ProjectsList({
  onOpenProject
}: {
  onOpenProject: (id: string, type: "flowchart" | "orgchart") => void;
}) {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listProjects().then(setProjects).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este projeto?")) return;
    await deleteProject(id);
    refresh();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-semibold">Meus projetos</h1>
      <p className="text-ash text-sm mt-1">Fluxogramas e organogramas salvos.</p>

      {error && (
        <div className="mt-6 text-coral text-sm bg-panel border border-line rounded p-4">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {projects?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-panel border border-line rounded-md px-4 py-3"
          >
            <button className="text-left flex-1" onClick={() => onOpenProject(p.id, p.type)}>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-[11px] text-ash font-mono mt-0.5">
                {p.type === "flowchart" ? "Fluxograma" : "Organograma"} · v{p.version} · {p.status} ·{" "}
                {new Date(p.updated_at).toLocaleString("pt-BR")}
              </div>
            </button>
            <button
              onClick={() => handleDelete(p.id)}
              className="text-[11px] text-coral hover:underline ml-3"
            >
              excluir
            </button>
          </div>
        ))}
        {projects && projects.length === 0 && (
          <div className="text-ash text-sm border border-dashed border-line rounded-md p-6 text-center">
            Nenhum projeto salvo ainda.
          </div>
        )}
      </div>
    </div>
  );
}

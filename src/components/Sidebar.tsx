import type { Route } from "../App";

const ITEMS: { route: Route; label: string; icon: string }[] = [
  { route: "dashboard", label: "Dashboard", icon: "◧" },
  { route: "flowchart", label: "Fluxogramas", icon: "⌁" },
  { route: "orgchart", label: "Organogramas", icon: "⌗" },
  { route: "projects", label: "Meus projetos", icon: "▤" }
];

export default function Sidebar({
  active,
  onNavigate
}: {
  active: Route;
  onNavigate: (r: Route) => void;
}) {
  return (
    <aside className="w-[220px] shrink-0 bg-panel border-r border-line flex flex-col">
      <div className="px-5 py-5 border-b border-line">
        <div className="font-display font-bold text-lg tracking-tight">
          Fluxo<span className="text-signal">IA</span>
        </div>
        <div className="font-mono text-[10px] text-ash mt-1 uppercase tracking-wider">
          Relatos → Diagramas
        </div>
      </div>
      <nav className="flex-1 py-3">
        {ITEMS.map((item) => (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
              active === item.route
                ? "bg-panel2 text-paper border-r-2 border-signal"
                : "text-ash hover:text-paper hover:bg-panel2/60"
            }`}
          >
            <span className="font-mono text-signal2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-line text-[11px] text-ash font-mono">
        v0.1 · MVP
      </div>
    </aside>
  );
}

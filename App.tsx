import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import DiagramEditor from "./components/DiagramEditor";
import ProjectsList from "./components/ProjectsList";

export type Route = "dashboard" | "flowchart" | "orgchart" | "projects";

export default function App() {
  const [route, setRoute] = useState<Route>("dashboard");
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  function navigate(r: Route) {
    if (r !== "flowchart" && r !== "orgchart") setOpenProjectId(null);
    setRoute(r);
  }

  function openProject(id: string, type: "flowchart" | "orgchart") {
    setOpenProjectId(id);
    setRoute(type);
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Sidebar active={route} onNavigate={navigate} />
      <main className="flex-1 overflow-hidden">
        {route === "dashboard" && <Dashboard onNavigate={navigate} onOpenProject={openProject} />}
        {route === "flowchart" && (
          <DiagramEditor kind="flowchart" projectId={openProjectId} onSaved={(id) => setOpenProjectId(id)} />
        )}
        {route === "orgchart" && (
          <DiagramEditor kind="orgchart" projectId={openProjectId} onSaved={(id) => setOpenProjectId(id)} />
        )}
        {route === "projects" && <ProjectsList onOpenProject={openProject} />}
      </main>
    </div>
  );
}

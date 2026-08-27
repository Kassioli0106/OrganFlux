import type { AIFlowResult, AIOrgResult, ProjectRecord, ProjectSummary } from "../types";

const BASE = "/.netlify/functions";

async function call<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha em ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

export function generateFlowchart(report: string): Promise<AIFlowResult> {
  return call("generate-flowchart", {
    method: "POST",
    body: JSON.stringify({ report })
  });
}

export function generateOrgchart(report: string): Promise<AIOrgResult> {
  return call("generate-orgchart", {
    method: "POST",
    body: JSON.stringify({ report })
  });
}

export function copilotEdit(command: string, currentGraph: { nodes: any[]; edges: any[] }, kind: "flowchart" | "orgchart") {
  return call<AIFlowResult | AIOrgResult>("copilot-edit", {
    method: "POST",
    body: JSON.stringify({ command, currentGraph, kind })
  });
}

export function analyzeProcess(currentGraph: { nodes: any[]; edges: any[] }) {
  return call<{ findings: { type: string; title: string; detail: string }[] }>("analyze-process", {
    method: "POST",
    body: JSON.stringify({ currentGraph })
  });
}

export function listProjects(): Promise<ProjectSummary[]> {
  return call("projects");
}

export function getProject(id: string): Promise<ProjectRecord> {
  return call(`projects?id=${encodeURIComponent(id)}`);
}

export function saveProject(project: {
  id?: string;
  name: string;
  type: "flowchart" | "orgchart";
  author: string;
  status: string;
  data: { nodes: any[]; edges: any[] };
}): Promise<ProjectRecord> {
  return call("projects", {
    method: "POST",
    body: JSON.stringify(project)
  });
}

export function deleteProject(id: string): Promise<{ ok: true }> {
  return call(`projects?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

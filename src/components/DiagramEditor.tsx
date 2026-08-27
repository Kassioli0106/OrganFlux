import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  MarkerType,
  ReactFlowInstance
} from "reactflow";
import { v4 as uuid } from "uuid";
import { toPng } from "html-to-image";
import FlowNode from "./FlowNode";
import OrgNode from "./OrgNode";
import { autoLayout } from "../lib/layout";
import {
  analyzeProcess,
  copilotEdit,
  generateFlowchart,
  generateOrgchart,
  getProject,
  saveProject
} from "../lib/api";
import type { AIFlowResult, AIOrgResult, FlowNodeData, OrgNodeData } from "../types";

type Kind = "flowchart" | "orgchart";

const nodeTypes = { flow: FlowNode, org: OrgNode };

export default function DiagramEditor({
  kind,
  projectId,
  onSaved
}: {
  kind: Kind;
  projectId: string | null;
  onSaved: (id: string) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copilotCmd, setCopilotCmd] = useState("");
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [findings, setFindings] = useState<{ type: string; title: string; detail: string }[] | null>(null);
  const [projectName, setProjectName] = useState(kind === "flowchart" ? "Novo fluxograma" : "Novo organograma");
  const [saving, setSaving] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(projectId);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfInstance = useRef<ReactFlowInstance | null>(null);

  const nodeType = kind === "flowchart" ? "flow" : "org";

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId).then((p) => {
      setProjectName(p.name);
      setCurrentId(p.id);
      setNodes(p.data.nodes || []);
      setEdges(p.data.edges || []);
    }).catch((e) => setError(e.message));
  }, [projectId]);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#4F7CFF" }, animated: false },
          eds
        )
      ),
    [setEdges]
  );

  function applyFlowResult(result: AIFlowResult) {
    const newNodes: Node<FlowNodeData>[] = result.nodes.map((n) => ({
      id: n.id,
      type: "flow",
      position: { x: 0, y: 0 },
      data: { kind: n.kind, title: n.title, responsible: n.responsible }
    }));
    const nodeById = new Map(newNodes.map((n) => [n.id, n]));
    const nodeIndex = new Map(newNodes.map((n, i) => [n.id, i]));
    const newEdges: Edge[] = result.edges.map((e) => {
      const label = (e.label || "").trim().toLowerCase();
      const isNo = label === "não" || label === "nao" || label === "no";
      const isYes = label === "sim" || label === "yes";
      const sourceIsDecision = nodeById.get(e.source)?.data?.kind === "decision";
      // Ramos de decisão saem pela lateral (evita cruzar por cima de outros nós ao voltar).
      const sourceHandle = sourceIsDecision ? (isNo ? "no" : isYes ? "yes" : undefined) : undefined;
      const isBackEdge = (nodeIndex.get(e.target) ?? 0) <= (nodeIndex.get(e.source) ?? 0);
      return {
        id: uuid(),
        source: e.source,
        target: e.target,
        sourceHandle,
        label: e.label,
        type: "smoothstep",
        pathOptions: { borderRadius: 12, offset: isBackEdge ? 40 : 16 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isNo ? "#E0644A" : isYes ? "#3FAE83" : "#4F7CFF" },
        style: isNo ? { stroke: "#E0644A" } : isYes ? { stroke: "#3FAE83" } : undefined,
        labelStyle: { fill: "#F6F4EE", fontSize: 11, fontWeight: 600 },
        labelBgStyle: { fill: "#1A1F27", fillOpacity: 0.9 }
      };
    });
    const laid = autoLayout(newNodes, newEdges, "TB");
    setNodes(laid.nodes);
    setEdges(laid.edges);
  }

  function applyOrgResult(result: AIOrgResult) {
    const newNodes: Node<OrgNodeData>[] = result.nodes.map((n) => ({
      id: n.id,
      type: "org",
      position: { x: 0, y: 0 },
      data: { name: n.name, role: n.role, department: n.department }
    }));
    const newEdges: Edge[] = result.edges.map((e) => ({
      id: uuid(),
      source: e.source,
      target: e.target,
      type: "smoothstep",
      pathOptions: { borderRadius: 12 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#4F7CFF" }
    }));
    const laid = autoLayout(newNodes, newEdges, "TB");
    setNodes(laid.nodes);
    setEdges(laid.edges);
  }

  async function handleGenerate() {
    if (!report.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (kind === "flowchart") {
        const result = await generateFlowchart(report);
        applyFlowResult(result);
      } else {
        const result = await generateOrgchart(report);
        applyOrgResult(result);
      }
    } catch (e: any) {
      setError(e.message || "Falha ao gerar diagrama.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopilot() {
    if (!copilotCmd.trim() || nodes.length === 0) return;
    setCopilotBusy(true);
    setError(null);
    try {
      const graph = { nodes: nodes.map((n) => ({ id: n.id, ...n.data })), edges: edges.map((e) => ({ source: e.source, target: e.target, label: e.label })) };
      const result = await copilotEdit(copilotCmd, graph, kind);
      if (kind === "flowchart") applyFlowResult(result as AIFlowResult);
      else applyOrgResult(result as AIOrgResult);
      setCopilotCmd("");
    } catch (e: any) {
      setError(e.message || "Falha ao aplicar comando.");
    } finally {
      setCopilotBusy(false);
    }
  }

  async function handleAnalyze() {
    setError(null);
    try {
      const graph = { nodes: nodes.map((n) => ({ id: n.id, ...n.data })), edges: edges.map((e) => ({ source: e.source, target: e.target, label: e.label })) };
      const result = await analyzeProcess(graph);
      setFindings(result.findings);
    } catch (e: any) {
      setError(e.message || "Falha na análise.");
    }
  }

  function handleAutoLayout() {
    const laid = autoLayout(nodes, edges, "TB");
    setNodes([...laid.nodes]);
  }

  function updateSelectedData(patch: Partial<FlowNodeData & OrgNodeData>) {
    if (!selectedId) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n))
    );
  }

  function addManualNode() {
    const id = uuid();
    const data = kind === "flowchart" ? { kind: "process", title: "Nova etapa" } : { name: "Novo cargo" };
    setNodes((nds) => [
      ...nds,
      { id, type: nodeType, position: { x: 120, y: 120 + nds.length * 20 }, data }
    ]);
  }

  function deleteSelected() {
    if (!selectedId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveProject({
        id: currentId || undefined,
        name: projectName,
        type: kind,
        author: "Usuário",
        status: "ativo",
        data: { nodes, edges }
      });
      setCurrentId(saved.id);
      onSaved(saved.id);
    } catch (e: any) {
      setError(e.message || "Falha ao salvar projeto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPng() {
    if (!wrapperRef.current) return;
    const dataUrl = await toPng(wrapperRef.current, { backgroundColor: "#12161C" });
    const link = document.createElement("a");
    link.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();
  }

  return (
    <div className="flex h-full">
      {/* Left panel: report input + copilot */}
      <div className="w-[300px] shrink-0 border-r border-line bg-panel flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-line">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full bg-panel2 border border-line rounded px-2.5 py-1.5 text-sm font-display font-semibold focus:outline-none focus:border-signal"
          />
        </div>

        <div className="p-4 border-b border-line">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ash mb-2">
            {kind === "flowchart" ? "Descrever processo" : "Descrever hierarquia"}
          </div>
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder={
              kind === "flowchart"
                ? "Descreva aqui como o processo funciona…"
                : "Ex: Diretor Geral. Abaixo dele, Gerente Administrativo e Gerente Industrial…"
            }
            className="w-full h-36 bg-panel2 border border-line rounded p-2.5 text-sm resize-none focus:outline-none focus:border-signal placeholder:text-ash"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !report.trim()}
            className="mt-2 w-full bg-signal hover:bg-signal2 disabled:opacity-40 disabled:cursor-not-allowed text-ink font-medium text-sm rounded py-2 transition-colors"
          >
            {loading ? "Gerando…" : "✨ Gerar diagrama"}
          </button>
        </div>

        {nodes.length > 0 && (
          <div className="p-4 border-b border-line">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ash mb-2">Copiloto</div>
            <div className="flex gap-1.5">
              <input
                value={copilotCmd}
                onChange={(e) => setCopilotCmd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCopilot()}
                placeholder="Ex: adicione aprovação do gerente"
                className="flex-1 bg-panel2 border border-line rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-signal placeholder:text-ash"
              />
              <button
                onClick={handleCopilot}
                disabled={copilotBusy || !copilotCmd.trim()}
                className="bg-panel2 border border-line hover:border-signal disabled:opacity-40 rounded px-2.5 text-xs"
              >
                {copilotBusy ? "…" : "↵"}
              </button>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-line flex flex-wrap gap-1.5">
          <ToolBtn onClick={addManualNode}>+ elemento</ToolBtn>
          <ToolBtn onClick={handleAutoLayout}>organizar</ToolBtn>
          {kind === "flowchart" && <ToolBtn onClick={handleAnalyze}>🧠 analisar</ToolBtn>}
          <ToolBtn onClick={handleExportPng}>exportar PNG</ToolBtn>
        </div>

        {selectedNode && (
          <div className="p-4 border-b border-line">
            <div className="flex items-center justify-between mb-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-ash">Propriedades</div>
              <button onClick={deleteSelected} className="text-[11px] text-coral hover:underline">
                excluir
              </button>
            </div>
            {kind === "flowchart" ? (
              <FlowProps data={selectedNode.data} onChange={updateSelectedData} />
            ) : (
              <OrgProps data={selectedNode.data} onChange={updateSelectedData} />
            )}
          </div>
        )}

        {findings && (
          <div className="p-4 border-b border-line">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ash mb-2">
              Análise inteligente
            </div>
            <div className="flex flex-col gap-2">
              {findings.map((f, i) => (
                <div key={i} className="bg-panel2 border border-line rounded p-2.5 text-xs">
                  <div className="font-medium mb-0.5" style={{ color: f.type === "gargalo" ? "#E0A526" : f.type === "risco" ? "#E0644A" : "#3FAE83" }}>
                    {f.type === "gargalo" ? "⚠️" : f.type === "risco" ? "🚨" : "💡"} {f.title}
                  </div>
                  <div className="text-ash leading-relaxed">{f.detail}</div>
                </div>
              ))}
              {findings.length === 0 && <div className="text-ash text-xs">Nenhum ponto crítico identificado.</div>}
            </div>
          </div>
        )}

        <div className="p-4 mt-auto">
          {error && <div className="text-coral text-xs mb-2">{error}</div>}
          <button
            onClick={handleSave}
            disabled={saving || nodes.length === 0}
            className="w-full bg-mint/90 hover:bg-mint disabled:opacity-40 text-ink font-medium text-sm rounded py-2 transition-colors"
          >
            {saving ? "Salvando…" : "Salvar projeto"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative" ref={wrapperRef}>
        {nodes.length === 0 ? (
          <EmptyState kind={kind} />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(inst) => (rfInstance.current = inst)}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#232A35" gap={20} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor="#2B3340" maskColor="rgba(18,22,28,0.7)" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] bg-panel2 border border-line hover:border-signal rounded px-2.5 py-1.5 text-ash hover:text-paper transition-colors"
    >
      {children}
    </button>
  );
}

const FLOW_KINDS = [
  "start", "end", "process", "subprocess", "decision", "document", "database",
  "input", "output", "manual", "automatic", "approval", "rejection", "comment", "timer", "event"
];

function FlowProps({ data, onChange }: { data: FlowNodeData; onChange: (p: Partial<FlowNodeData>) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Field label="Título">
        <input value={data.title} onChange={(e) => onChange({ title: e.target.value })} className="input" />
      </Field>
      <Field label="Tipo">
        <select value={data.kind} onChange={(e) => onChange({ kind: e.target.value as any })} className="input">
          {FLOW_KINDS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </Field>
      <Field label="Responsável">
        <input value={data.responsible || ""} onChange={(e) => onChange({ responsible: e.target.value })} className="input" />
      </Field>
      <Field label="Observações">
        <textarea value={data.notes || ""} onChange={(e) => onChange({ notes: e.target.value })} className="input h-16 resize-none" />
      </Field>
    </div>
  );
}

function OrgProps({ data, onChange }: { data: OrgNodeData; onChange: (p: Partial<OrgNodeData>) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Field label="Nome"><input value={data.name} onChange={(e) => onChange({ name: e.target.value })} className="input" /></Field>
      <Field label="Cargo"><input value={data.role || ""} onChange={(e) => onChange({ role: e.target.value })} className="input" /></Field>
      <Field label="Departamento"><input value={data.department || ""} onChange={(e) => onChange({ department: e.target.value })} className="input" /></Field>
      <Field label="E-mail"><input value={data.email || ""} onChange={(e) => onChange({ email: e.target.value })} className="input" /></Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] text-ash mb-0.5">{label}</div>
      {children}
    </label>
  );
}

function EmptyState({ kind }: { kind: Kind }) {
  return (
    <div className="h-full flex items-center justify-center flex-col gap-2 text-ash">
      <div className="text-3xl opacity-50">{kind === "flowchart" ? "⌁" : "⌗"}</div>
      <div className="text-sm">
        {kind === "flowchart"
          ? "Descreva um processo à esquerda ou clique em + elemento para começar do zero."
          : "Descreva a hierarquia à esquerda ou clique em + elemento para começar do zero."}
      </div>
    </div>
  );
}

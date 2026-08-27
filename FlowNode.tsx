import { Handle, Position, NodeProps } from "reactflow";
import type { FlowNodeData } from "../types";

const KIND_LABEL: Record<string, string> = {
  start: "Início",
  end: "Fim",
  process: "Processo",
  subprocess: "Subprocesso",
  decision: "Decisão",
  document: "Documento",
  database: "Base de dados",
  input: "Entrada",
  output: "Saída",
  manual: "Atividade manual",
  automatic: "Atividade automática",
  approval: "Aprovação",
  rejection: "Reprovação",
  comment: "Comentário",
  timer: "Temporizador",
  event: "Evento"
};

const KIND_COLOR: Record<string, string> = {
  start: "#3FAE83",
  end: "#E0644A",
  process: "#4F7CFF",
  subprocess: "#8DA3FF",
  decision: "#E0A526",
  document: "#8A93A3",
  database: "#8A93A3",
  input: "#3FAE83",
  output: "#E0644A",
  manual: "#4F7CFF",
  automatic: "#8DA3FF",
  approval: "#3FAE83",
  rejection: "#E0644A",
  comment: "#8A93A3",
  timer: "#E0A526",
  event: "#E0A526"
};

export default function FlowNode({ data, selected }: NodeProps<FlowNodeData>) {
  const color = KIND_COLOR[data.kind] || "#4F7CFF";
  const isDecision = data.kind === "decision";

  return (
    <div
      className="rf-node"
      style={{
        // @ts-ignore custom property
        "--corner-color": color,
        borderColor: selected ? color : undefined,
        borderRadius: isDecision ? 10 : 4
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div className="rf-node-label" style={{ color }}>
        {KIND_LABEL[data.kind] || data.kind}
      </div>
      <div className="rf-node-title">{data.title}</div>
      {data.responsible && <div className="rf-node-sub">👤 {data.responsible}</div>}
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      {isDecision && (
        <>
          <Handle type="source" position={Position.Right} id="yes" style={{ background: "#3FAE83", top: "50%" }} />
          <Handle type="source" position={Position.Left} id="no" style={{ background: "#E0644A", top: "50%" }} />
        </>
      )}
    </div>
  );
}

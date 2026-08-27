import { Handle, Position, NodeProps } from "reactflow";
import type { OrgNodeData } from "../types";

export default function OrgNode({ data, selected }: NodeProps<OrgNodeData>) {
  return (
    <div
      className="rf-node"
      style={{
        // @ts-ignore
        "--corner-color": "#4F7CFF",
        borderColor: selected ? "#4F7CFF" : undefined,
        minWidth: 200
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#4F7CFF" }} />
      <div className="rf-node-label" style={{ color: "#8DA3FF" }}>
        {data.department || "Cargo"}
      </div>
      <div className="rf-node-title">{data.name}</div>
      {data.role && <div className="rf-node-sub">{data.role}</div>}
      <Handle type="source" position={Position.Bottom} style={{ background: "#4F7CFF" }} />
    </div>
  );
}

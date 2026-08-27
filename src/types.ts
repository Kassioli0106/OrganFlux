import dagre from "dagre";
import type { Node, Edge } from "reactflow";

export function autoLayout(nodes: Node[], edges: Edge[], direction: "TB" | "LR" = "TB") {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 110, ranksep: 130, ranker: "tight-tree" });

  const width = 200;
  const height = 74;

  nodes.forEach((n) => g.setNode(n.id, { width, height }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const laidOut = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 }
    };
  });

  return { nodes: laidOut, edges };
}

import { askClaude, extractJson, jsonResponse } from "./_anthropic.js";

function buildSystem(kind) {
  if (kind === "flowchart") {
    return `Você edita fluxogramas de processos a partir de comandos em português.
Receberá o grafo atual (nodes/edges) e um comando do usuário (ex: "adicione uma etapa de aprovação do gerente", "remova essa etapa", "divida essa atividade em três etapas").
Aplique o comando e retorne o grafo COMPLETO resultante (não apenas a alteração), no mesmo formato de generate-flowchart:
{ "nodes": [{ "id", "kind", "title", "responsible" }], "edges": [{ "source", "target", "label" }] }
"kind" deve ser um destes: start, end, process, subprocess, decision, document, database, input, output, manual, automatic, approval, rejection, comment, timer, event.
Preserve ids existentes quando o elemento não for removido. Responda APENAS com o JSON.`;
  }
  return `Você edita organogramas a partir de comandos em português.
Receberá o grafo atual (nodes/edges) e um comando do usuário.
Aplique o comando e retorne o grafo COMPLETO resultante, no formato:
{ "nodes": [{ "id", "name", "role", "department" }], "edges": [{ "source", "target" }] }
Preserve ids existentes quando o elemento não for removido. Responda APENAS com o JSON.`;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Método não permitido" });

  try {
    const { command, currentGraph, kind } = JSON.parse(event.body || "{}");
    if (!command || !currentGraph) return jsonResponse(400, { error: "Parâmetros ausentes." });

    const text = await askClaude({
      system: buildSystem(kind),
      prompt: `Grafo atual:\n${JSON.stringify(currentGraph)}\n\nComando: ${command}`,
      maxTokens: 3000
    });

    const parsed = extractJson(text);
    return jsonResponse(200, parsed);
  } catch (err) {
    return jsonResponse(500, { error: err.message || "Erro ao aplicar comando." });
  }
};

import { askClaude, extractJson, jsonResponse } from "./_anthropic.js";

const SYSTEM = `Você é um analista de processos (BPM) sênior. Receberá um fluxograma (nodes/edges) e deve identificar:
- gargalos (etapas manuais únicas sem alternativa, esperas longas, aprovações concentradas)
- riscos (falta de responsável, falta de controle, dependência de uma única pessoa)
- oportunidades de automação ou simplificação

Responda APENAS com um JSON no formato:
{ "findings": [ { "type": "gargalo" | "risco" | "oportunidade", "title": "...", "detail": "..." } ] }

Gere entre 2 e 6 achados, específicos ao grafo recebido, em português, concisos (title curto, detail 1-2 frases). Se o fluxo for pequeno demais para achados relevantes, retorne uma lista vazia.`;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Método não permitido" });

  try {
    const { currentGraph } = JSON.parse(event.body || "{}");
    if (!currentGraph) return jsonResponse(400, { error: "Parâmetro 'currentGraph' ausente." });

    const text = await askClaude({
      system: SYSTEM,
      prompt: `Fluxograma:\n${JSON.stringify(currentGraph)}`,
      maxTokens: 1500
    });

    const parsed = extractJson(text);
    return jsonResponse(200, parsed);
  } catch (err) {
    return jsonResponse(500, { error: err.message || "Erro ao analisar processo." });
  }
};

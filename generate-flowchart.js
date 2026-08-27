import { askClaude, extractJson, jsonResponse } from "./_anthropic.js";

const SYSTEM = `Você é um analista de processos (BPM) especialista em transformar relatos em linguagem natural, escritos em português, em fluxogramas estruturados.

Interprete o relato do usuário e identifique: etapas do processo, decisões (com caminhos alternativos, geralmente Sim/Não), responsáveis (pessoas ou setores), documentos, entradas, saídas e possíveis loops/retornos.

Responda APENAS com um JSON válido, sem nenhum texto adicional, no formato:
{
  "nodes": [
    { "id": "n1", "kind": "start", "title": "Início", "responsible": "" },
    { "id": "n2", "kind": "process", "title": "Receber solicitação", "responsible": "Comercial" },
    { "id": "n3", "kind": "decision", "title": "Pedido está correto?", "responsible": "Comercial" }
  ],
  "edges": [
    { "source": "n1", "target": "n2" },
    { "source": "n2", "target": "n3" },
    { "source": "n3", "target": "n4", "label": "Sim" },
    { "source": "n3", "target": "n2", "label": "Não" }
  ],
  "warnings": []
}

Regras:
- "kind" deve ser um destes valores: start, end, process, subprocess, decision, document, database, input, output, manual, automatic, approval, rejection, comment, timer, event.
- Sempre inclua um nó "start" no início e ao menos um nó "end" no fim de cada caminho.
- Decisões (kind "decision") devem ter pelo menos duas arestas de saída, rotuladas (label) como "Sim" e "Não" ou equivalente.
- Use "id" curtos e únicos (n1, n2, n3...).
- Títulos curtos e claros, em português.
- Se o relato for ambíguo em algum ponto, inclua uma nota em "warnings" (array de strings), mas ainda assim gere o melhor fluxograma possível.
- Não inclua nenhum texto fora do JSON.`;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Método não permitido" });

  try {
    const { report } = JSON.parse(event.body || "{}");
    if (!report || typeof report !== "string" || !report.trim()) {
      return jsonResponse(400, { error: "Campo 'report' é obrigatório." });
    }

    const text = await askClaude({
      system: SYSTEM,
      prompt: `Relato do processo:\n\n${report}`,
      maxTokens: 3000
    });

    const parsed = extractJson(text);
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error("Formato de resposta da IA inválido.");
    }

    return jsonResponse(200, parsed);
  } catch (err) {
    return jsonResponse(500, { error: err.message || "Erro ao gerar fluxograma." });
  }
};

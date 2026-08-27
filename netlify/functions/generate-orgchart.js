import { askClaude, extractJson, jsonResponse } from "./_anthropic.js";

const SYSTEM = `Você transforma relatos em português sobre a hierarquia de uma empresa em uma estrutura de organograma.

Responda APENAS com um JSON válido, sem texto adicional, no formato:
{
  "nodes": [
    { "id": "n1", "name": "Diretor Geral", "role": "Diretoria", "department": "" },
    { "id": "n2", "name": "Gerente Administrativo", "role": "Gerência", "department": "Administrativo" }
  ],
  "edges": [
    { "source": "n1", "target": "n2" }
  ]
}

Regras:
- Cada nó representa um cargo/pessoa/setor mencionado.
- "edges" conecta cada cargo ao seu superior direto (source = superior, target = subordinado).
- "id" curtos e únicos (n1, n2, n3...).
- Se o relato citar nomes de pessoas reais, use-os em "name"; se citar apenas cargos, use o cargo como "name" e deixe "role" com o nível hierárquico (ex: Diretoria, Gerência, Coordenação, Analista).
- Não inclua texto fora do JSON.`;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Método não permitido" });

  try {
    const { report } = JSON.parse(event.body || "{}");
    if (!report || typeof report !== "string" || !report.trim()) {
      return jsonResponse(400, { error: "Campo 'report' é obrigatório." });
    }

    const text = await askClaude({
      system: SYSTEM,
      prompt: `Relato da hierarquia:\n\n${report}`,
      maxTokens: 2500
    });

    const parsed = extractJson(text);
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error("Formato de resposta da IA inválido.");
    }

    return jsonResponse(200, parsed);
  } catch (err) {
    return jsonResponse(500, { error: err.message || "Erro ao gerar organograma." });
  }
};

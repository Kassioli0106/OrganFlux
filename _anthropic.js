// Chamada centralizada à API da Anthropic, usada por todas as functions de IA.
// Requer a variável de ambiente ANTHROPIC_API_KEY configurada no Netlify.

export async function askClaude({ system, prompt, maxTokens = 2000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada nas variáveis de ambiente do Netlify.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Erro na API da Anthropic (${res.status}): ${text}`);
  }

  const data = await res.json();
  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("Resposta da IA sem conteúdo de texto.");
  return textBlock.text;
}

export function extractJson(text) {
  // Remove eventuais blocos de código ```json ... ``` e faz parse seguro.
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  let from = start;
  if (startArr !== -1 && (start === -1 || startArr < start)) from = startArr;
  const candidate = from >= 0 ? cleaned.slice(from) : cleaned;
  return JSON.parse(candidate);
}

export function jsonResponse(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

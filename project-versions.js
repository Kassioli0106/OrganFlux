import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";

const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

function jsonResponse(status, body) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  if (!connectionString) return jsonResponse(500, { error: "Banco de dados não configurado." });
  const sql = neon(connectionString);

  try {
    if (event.httpMethod === "GET") {
      const projectId = event.queryStringParameters?.projectId;
      if (!projectId) return jsonResponse(400, { error: "Parâmetro 'projectId' é obrigatório." });
      const rows = await sql`
        SELECT id, version, created_at FROM project_versions
        WHERE project_id = ${projectId} ORDER BY version DESC
      `;
      return jsonResponse(200, rows);
    }

    if (event.httpMethod === "POST") {
      // Restaura uma versão anterior: cria uma nova versão "top" com os dados daquela versão.
      const { projectId, version } = JSON.parse(event.body || "{}");
      if (!projectId || !version) return jsonResponse(400, { error: "projectId e version são obrigatórios." });

      const versionRows = await sql`
        SELECT data FROM project_versions WHERE project_id = ${projectId} AND version = ${version}
      `;
      if (versionRows.length === 0) return jsonResponse(404, { error: "Versão não encontrada." });

      const current = await sql`SELECT version FROM projects WHERE id = ${projectId}`;
      if (current.length === 0) return jsonResponse(404, { error: "Projeto não encontrado." });
      const newVersion = current[0].version + 1;
      const data = versionRows[0].data;

      await sql`
        UPDATE projects SET data = ${JSON.stringify(data)}::jsonb, version = ${newVersion}, updated_at = now()
        WHERE id = ${projectId}
      `;
      await sql`
        INSERT INTO project_versions (id, project_id, version, data)
        VALUES (${randomUUID()}, ${projectId}, ${newVersion}, ${JSON.stringify(data)}::jsonb)
      `;
      const rows = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
      return jsonResponse(200, rows[0]);
    }

    return jsonResponse(405, { error: "Método não permitido." });
  } catch (err) {
    return jsonResponse(500, { error: err.message || "Erro no banco de dados." });
  }
};

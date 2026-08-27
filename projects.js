import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";

// A Netlify DB (integração Neon) injeta automaticamente NETLIFY_DATABASE_URL
// quando você roda `netlify db init` ou ativa a integração no painel.
// DATABASE_URL serve como alternativa caso você conecte seu próprio Postgres.
const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

function jsonResponse(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('flowchart', 'orgchart')),
      author TEXT DEFAULT 'Usuário',
      status TEXT DEFAULT 'ativo',
      version INTEGER NOT NULL DEFAULT 1,
      data JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS project_versions (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export const handler = async (event) => {
  if (!connectionString) {
    return jsonResponse(500, {
      error:
        "Banco de dados não configurado. No painel do Netlify, ative Netlify DB (ou conecte seu Postgres) e defina NETLIFY_DATABASE_URL / DATABASE_URL."
    });
  }

  const sql = neon(connectionString);

  try {
    await ensureSchema(sql);

    if (event.httpMethod === "GET") {
      const id = event.queryStringParameters?.id;
      if (id) {
        const rows = await sql`SELECT * FROM projects WHERE id = ${id}`;
        if (rows.length === 0) return jsonResponse(404, { error: "Projeto não encontrado." });
        return jsonResponse(200, rows[0]);
      }
      const rows = await sql`SELECT id, name, type, author, status, version, created_at, updated_at FROM projects ORDER BY updated_at DESC`;
      return jsonResponse(200, rows);
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { id, name, type, author, status, data } = body;
      if (!name || !type || !data) return jsonResponse(400, { error: "Campos obrigatórios: name, type, data." });

      if (id) {
        const existing = await sql`SELECT version FROM projects WHERE id = ${id}`;
        if (existing.length === 0) return jsonResponse(404, { error: "Projeto não encontrado." });
        const newVersion = existing[0].version + 1;

        await sql`
          UPDATE projects
          SET name = ${name}, status = ${status || "ativo"}, data = ${JSON.stringify(data)}::jsonb,
              version = ${newVersion}, updated_at = now()
          WHERE id = ${id}
        `;
        await sql`
          INSERT INTO project_versions (id, project_id, version, data)
          VALUES (${randomUUID()}, ${id}, ${newVersion}, ${JSON.stringify(data)}::jsonb)
        `;
        const rows = await sql`SELECT * FROM projects WHERE id = ${id}`;
        return jsonResponse(200, rows[0]);
      }

      const newId = randomUUID();
      await sql`
        INSERT INTO projects (id, name, type, author, status, version, data)
        VALUES (${newId}, ${name}, ${type}, ${author || "Usuário"}, ${status || "ativo"}, 1, ${JSON.stringify(data)}::jsonb)
      `;
      await sql`
        INSERT INTO project_versions (id, project_id, version, data)
        VALUES (${randomUUID()}, ${newId}, 1, ${JSON.stringify(data)}::jsonb)
      `;
      const rows = await sql`SELECT * FROM projects WHERE id = ${newId}`;
      return jsonResponse(200, rows[0]);
    }

    if (event.httpMethod === "DELETE") {
      const id = event.queryStringParameters?.id;
      if (!id) return jsonResponse(400, { error: "Parâmetro 'id' é obrigatório." });
      await sql`DELETE FROM projects WHERE id = ${id}`;
      return jsonResponse(200, { ok: true });
    }

    return jsonResponse(405, { error: "Método não permitido." });
  } catch (err) {
    return jsonResponse(500, { error: err.message || "Erro no banco de dados." });
  }
};

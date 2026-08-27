# FluxoIA

App para transformar relatos de processos em fluxogramas e organogramas, com editor visual (React Flow), geração por IA (Claude) e persistência em banco de dados via Netlify DB (Postgres/Neon).

## O que está implementado

- Gerador de fluxograma a partir de texto livre (tela "Fluxogramas")
- Gerador de organograma a partir de texto livre (tela "Organogramas")
- Editor visual: arrastar, conectar, editar, excluir, adicionar elementos manualmente, organizar automaticamente (dagre)
- Painel de propriedades por elemento selecionado
- Copiloto de processos (comandos em linguagem natural editam o diagrama)
- Análise inteligente do processo (gargalos, riscos, oportunidades)
- Salvar/carregar projetos, com versionamento automático a cada save
- Restaurar versão anterior (function `project-versions`, endpoint pronto — ainda sem botão na UI)
- Exportar diagrama como PNG
- Dashboard com contadores e projetos recentes

## O que fica para você (ou para uma próxima etapa)

- Importação de PDF/DOCX/XLSX/CSV
- Exportação para PowerPoint/Excel/PDF em A3/A4
- Entrada por voz
- Autenticação multiusuário (hoje o campo "author" é fixo como "Usuário")
- Modo claro (hoje só há o tema escuro "schematic" implementado)
- Templates prontos (comercial, financeiro, RH etc.)
- Modo AS IS / TO BE e comparação de processos

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS + React Flow + dagre
- Backend: Netlify Functions (Node, ESM)
- IA: API da Anthropic (modelo `claude-sonnet-4-6`), chamada só do lado do servidor (a chave nunca vai para o navegador)
- Banco: Netlify DB (Postgres gerenciado via integração Neon)

## Passo a passo para colocar no ar

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o banco de dados (Netlify DB)

Com a Netlify CLI instalada e logada (`npx netlify login`), dentro da pasta do projeto:

```bash
npx netlify link        # conecta esta pasta a um site Netlify (crie um novo se pedir)
npx netlify db init     # provisiona um banco Postgres (Neon) e injeta NETLIFY_DATABASE_URL automaticamente
```

Isso cria o banco e já configura a variável `NETLIFY_DATABASE_URL` no site. As tabelas (`projects`, `project_versions`) são criadas sozinhas na primeira chamada às functions (`CREATE TABLE IF NOT EXISTS`) — não precisa rodar migração manual.

Alternativa: se preferir usar seu próprio Postgres (Supabase, Neon direto, RDS etc.), pule o `netlify db init` e defina a variável `DATABASE_URL` manualmente no painel do site (Site settings → Environment variables) com a connection string do seu banco.

### 3. Configurar a chave da Anthropic

No painel do site: **Site settings → Environment variables** → adicionar:

```
ANTHROPIC_API_KEY = sk-ant-...
```

(gere a chave em console.anthropic.com — sem ela, os botões "Gerar diagrama", "Copiloto" e "Analisar" retornam erro.)

### 4. Rodar localmente

```bash
npx netlify dev
```

Isso sobe o Vite e as Functions juntos em `http://localhost:8888`, já com acesso às variáveis de ambiente configuradas no Netlify (ou às do seu `.env` local, copiado de `.env.example`).

### 5. Deploy

```bash
npx netlify deploy --prod
```

Ou conecte o repositório Git ao Netlify pelo painel para deploy automático a cada push (build command `npm run build`, publish directory `dist`, já configurados no `netlify.toml`).

## Estrutura

```
src/
  components/       telas e componentes (Dashboard, DiagramEditor, Sidebar, nós customizados)
  lib/               cliente da API e layout automático (dagre)
  types.ts
netlify/functions/
  generate-flowchart.js   relato → fluxograma (IA)
  generate-orgchart.js    relato → organograma (IA)
  copilot-edit.js         comando em linguagem natural → edição do grafo (IA)
  analyze-process.js      análise de gargalos/riscos/oportunidades (IA)
  projects.js              CRUD de projetos (Postgres) + versionamento
  project-versions.js      listar/restaurar versões anteriores
```

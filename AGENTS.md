<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Application pages live under `src/routes/_authenticated/`; invention projects use owner-scoped RLS, while legacy drone operations retain their existing team access so existing records are preserved.
- Invention schemas, deterministic finance and readiness calculations live in `src/lib/lab/domain.ts` with adjacent rule tests so all assessment views use consistent numbers.
- Invention AI uses authenticated `analysis.functions.ts` and server-only gateway helpers; separate industry-only search requires explicit consent, and search-answer links never count as verified citations.
- Assessment sections share `ProjectView` and use distinct route files; the public demo reads only the narrowly public demo template, never private projects.
- Market documents and full-dimensional embeddings are owner-scoped in PostgreSQL; authenticated retrieval attaches source snapshots to assessments so reports remain traceable without exposing another user's library.
- New submissions derive a display name and legacy-compatible defaults from two validated fields; empty defaults are not evidence of development stage or financial readiness.

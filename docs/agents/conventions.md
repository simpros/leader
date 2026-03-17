# Conventions

- Use lower-kebab-case for new file names (for example: `lead-search-form.svelte`).
- Extract features into dedicated files (for example a form should always be in a dedicated `-form.svelte` file).
- Split remote-functions by domain (e.g. `leads.remote.ts`, `projects.remote.ts`).
- Keep all remote functions under `$lib/remote`.
- Do not create `actions.ts` wrappers for remote functions; place the logic directly in the corresponding `.remote.ts` file.
- Put all schemas into a dedicated `$lib/schemas` folder and group them by domain.

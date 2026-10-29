# Suspicious executable hooks — 29 October 2026

Commit `0fa3520df7744065a87eb9bddbb8a7f8cdc9ddaa` introduced:

- `node init &&` in npm dev/build/start, with an obfuscated `init` payload.
- Obfuscated code appended to `postcss.config.mjs`, plus `createRequire` scaffolding.
- A hidden `.vscode/tasks.json` task, `runOn: folderOpen`, executing JavaScript
  disguised as `fa-brand-400.orc` under the student journey's fonts directory.
- Automatic task permission in editor settings and removal of `.env*` from `.gitignore`.

Original hashes are recorded in `2026-10-29-build-hooks.json`; original bytes are
identifiable in Git history. No payload was executed or decoded by execution during
this review. Neutralized `init` and `.orc`, restored normal Tailwind PostCSS, removed
npm startup hooks, disabled automatic editor tasks and restored `.env*` exclusion.
Only `.env.example` was tracked when checked; secret values were not read or printed.

The previous turn reported successful npm builds with these hooks present. Prior
execution/exposure is possible. This review does not establish payload behavior,
exfiltration, machine cleanliness or hosted deployment status. The existing dev
server on port 3000 predates this review; clean production testing used port 3037.

The August incident recorded in build-progress.md does not establish that the
newly observed October change was remediated. Local file cleanup alone cannot
revoke repository access or rotate exposed credentials.

Before deployment, review GitHub security events, app/collaborator/PAT/SSH/deploy-key
access and branch protection. From a trusted machine, rotate credentials available
to affected editor/build processes; scan the workstation; rebuild dependencies and
artifacts in a clean environment; inspect and replace affected hosted deployments.
Do not paste secret values into chat or issues. These external actions were not performed.
A new repository alone would not resolve compromised account access or exposed keys.

# GitHub validation and Vercel connection

The CI workflow builds production assets, checks all workspace types, and runs
interaction/accessibility tests in Chromium. It runs from the repository root
on pull requests and main pushes. It needs no Vercel token or custom secrets.
PR and release check names are separate to avoid ambiguous check results.
The workflow is active only after it is pushed to GitHub.

## Connect the existing project

1. In Brave, use the personal jaskevs GitHub account and the personal Vercel team.
2. Open https://vercel.com/jaskevs-4920s-projects/bld8-ui/settings/git.
3. Select Connect Git Repository and choose jaskevs/bld8-ui. If the repository is
   missing, configure the existing Vercel GitHub app and add only bld8-ui to the
   selected repositories. Keep the existing repository selections.
4. Use main as the production branch. Keep the existing ui.bld8.dev domain.
5. Confirm the existing build settings:
   - Framework: Next.js; Node: 22.x.
   - Root directory: apps/docs, with source files outside the root enabled.
   - Install: npm ci --include=dev --workspaces --include-workspace-root.
   - Build: npm run build --workspace=@bld8/ui && npm run build --workspace=@bld8/docs.

This links GitHub and Vercel in their dashboards. It does not require changing
Windows Git credentials, the company account, remotes or global SSH settings.

## Require checks before release

After the workflow has been pushed and run once, go to the project's Deployment
Checks, choose Add Checks, select GitHub and require UI Release checks. Keep
production automatic aliasing enabled. Vercel can build while CI runs, but
holds promotion to ui.bld8.dev until the required check succeeds. Connecting
Git alone does not make browser tests a required release gate.

For pull requests, a GitHub main-branch ruleset can require UI PR checks before
merging. Use a pull request workflow once that rule is enabled. The repository's
08:00–17:00 Melbourne commit/push restriction still applies locally.

References: https://vercel.com/docs/git/vercel-for-github and
https://vercel.com/docs/deployment-checks.

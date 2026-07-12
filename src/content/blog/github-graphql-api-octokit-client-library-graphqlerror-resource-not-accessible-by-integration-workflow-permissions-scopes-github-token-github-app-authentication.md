---
pipeline_contract_version: "21.0"
meta_title: "How to Fix GitHub GraphQLError: Resource not accessible by integration"
meta_description: "Learn how to resolve the Resource not accessible by integration error in GitHub GraphQL API by configuring workflow permissions and token scopes."
slug: "github-graphql-api-octokit-client-library-graphqlerror-resource-not-accessible-by-integration-workflow-permissions-scopes-github-token-github-app-authentication"
validated_environments:
  - "GitHub Actions CI/CD workflows"
  - "Node.js application middleware"
  - "Serverless edge route handlers"
  - "GitHub App backend servers"
---

# How to Fix GitHub GraphQLError: Resource not accessible by integration

## Quick Diagnosis

*   ✓ Does your GitHub Actions workflow fail immediately when executing a node script that calls the GitHub GraphQL API?
*   ✓ Does Octokit return a `GraphQLError` or `HttpError` containing the message `Resource not accessible by integration`?
*   ✓ Are you using a default `GITHUB_TOKEN` or GitHub App installation token to perform mutations (like writing repository discussions or creating comments)?

---

## Environment

The GitHub API authentication scope evaluator runs gateway-side, validating requests dispatched from GitHub Actions CI/CD workflows, Node.js application middleware, Serverless edge route handlers, and GitHub App backend servers.

| Authentication Token Type | Workflow Permissions Configuration | Requested Resource Object | API Invocation Result |
| :--- | :--- | :--- | :--- |
| GITHUB_TOKEN (Default Actions) | Omitted (Implicit read) | Create Repository Discussion | Failed (GraphQLError: Resource not accessible by integration) |
| GITHUB_TOKEN (Default Actions) | `permissions: write-all` | Create Repository Discussion | Success (Sufficient scope authorization granted) |
| GitHub App Installation Token | Metadata: Read, Contents: Read | Write Repository Contents | Failed (RequestError: Resource not accessible by integration) |
| GitHub App Installation Token | Metadata: Read, Contents: Write | Write Repository Contents | Success (Fine-grained access checks pass) |

---

## Minimal Repro

Under GitHub's API gateway architecture, requests dispatched to the GitHub GraphQL API undergo strict authentication and token scope validation before query node execution. When executing mutations (such as `createDiscussion` or `createPullRequest`), the security layer evaluates the fine-grained permissions bound to your authentication credentials (such as a GitHub App installation token or actions GITHUB_TOKEN). By default, GitHub Actions workflows run GITHUB_TOKEN under restricted read-only permissions to prevent unauthorized edits. If your Node script uses the `octokit` library to request a resource or mutation that requires write access, and your workflow file has not explicitly declared permissions, the API gateway aborts the execution. It returns a `403 Forbidden` response wrapped in a `GraphQLError` containing the message `Resource not accessible by integration`. Configuring explicit write permissions inside the workflow YAML schema resolves these access restrictions.

```javascript
import { Octokit } from 'octokit';

// Using GITHUB_TOKEN context inside GitHub Actions
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function run() {
  // CRASH: Attempting mutation using read-only actions token
  const result = await octokit.graphql(`
    mutation {
      createDiscussion(input: {repositoryId: "MDEwOlJlcG9zaXRvcnkxMjM0NTY=", categoryId: "DIC_kwDOA12345", title: "API Post", body: "Content"}) {
        discussion { id }
      }
    }
  `);
  console.log(result);
}

run();
```

```text
GraphQLError: Resource not accessible by integration
    at /var/task/node_modules/@octokit/graphql/dist-node/index.js:84:18
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
```

---

## Resolution

When resolving GitHub integration exceptions, developers can choose between two main structural options depending on their automation platform.

### Option A: Configure Explicit Workflow Permissions (Recommended for Actions)
If you deploy your script using GitHub Actions, defining the required write scopes explicitly in the workflow file is applicable. This elevates GITHUB_TOKEN privileges and satisfies mutation checks.

1. Open your workflow configuration file (e.g. `.github/workflows/publish.yml`).
2. Add a global or job-specific `permissions` settings block.
3. Enable `write` access for the specific categories required (e.g. `discussions: write`).

```yaml
# .github/workflows/publish.yml
name: Execute Publisher

on:
  push:
    branches: [ main ]

# Explicitly elevate write privileges for token
permissions:
  contents: write
  discussions: write
  pull-requests: write

jobs:
  run-script:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Script
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/publish-discussions.js
```

### Option B: Configure GitHub App Permissions & Reinstall (For Apps)
If you operate a standalone server authenticated using a custom GitHub App, modifying the permissions configured in your App dashboard is applicable.

1. Go to your GitHub Developer Settings > GitHub Apps > [Your App] > Permissions & events.
2. Set the target permissions to "Read & write" (e.g. Repository Permissions > Discussions).
3. Save changes, and reinstall the application inside your repository settings to update installation token scopes.

### When This Fix Won't Work
If organization administrators have locked workflow permissions globally in organization settings (Settings > Actions > General > Workflow permissions set to Read-only), local workflow file definitions will be overridden, causing queries to fail.

## Operational Runbook

### Case 1: GitHub Actions
1. Add explicit `permissions` declarations inside the runner YAML file.
2. Confirm repository actions settings allow write privileges.

### Case 2: GitHub Apps
1. Update permission scopes in App developer settings.
2. Refresh installation tokens or reinstall the app to update credentials.

### Rollback Strategy
To roll back this change, restore the previous workflow permission structure by removing the `permissions` block from your GitHub Actions workflow file to revert back to default permissions, and delete custom scope requirements from your GitHub App configuration panel.

---

## Verification

- [ ] GitHub Actions workflow runs complete successfully with zero GraphQLError permission exceptions.
- [ ] Octokit client GraphQL queries resolve returning valid database entity payloads.
- [ ] GITHUB_TOKEN authorization checks pass validation for all targeted repository mutations.

### Error Trigger Point Lifecycle

Load auth credentials ➔ Initialize Octokit client ➔ Construct GraphQL query payload ➔ Dispatch HTTPS request ➔ Evaluate GitHub permissions scopes [ERROR OCCURS HERE] ➔ Return response dataset

## References

*   **GitHub App Permissions Settings Guide**: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified GitHub GraphQL API permission requirements, GITHUB_TOKEN workflow permissions configurations, and Octokit integration scopes.
*   **GitHub Actions Workflow Permissions Guide**: https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified workflow settings schemas, default scope restrictions, and security parameters.
*   **Octokit GraphQL GitHub Issue #2458**: https://github.com/octokit/graphql.js/issues/2458
    *   *Evidence Tier:* Community
    *   *Contribution:* Captured the real-world execution symptoms and reproduction parameters of the GraphQLError permission mismatch.

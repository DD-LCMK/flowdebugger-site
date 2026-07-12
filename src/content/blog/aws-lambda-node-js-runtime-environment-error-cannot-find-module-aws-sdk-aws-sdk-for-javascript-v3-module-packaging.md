---
pipeline_contract_version: "21.0"
meta_title: "How to Fix AWS Lambda Error: Cannot find module 'aws-sdk'"
meta_description: "Learn how to resolve the Cannot find module 'aws-sdk' error in AWS Lambda Node.js 18+ runtimes by migrating to AWS SDK v3 or bundling v2."
slug: "aws-lambda-node-js-runtime-environment-error-cannot-find-module-aws-sdk-aws-sdk-for-javascript-v3-module-packaging"
validated_environments:
  - "AWS Lambda Serverless Functions"
  - "Cloudflare Workers edge runtimes"
  - "Custom Node.js container environments"
  - "Webpack module bundle configurations"
---

# How to Fix AWS Lambda Error: Cannot find module 'aws-sdk'

## Quick Diagnosis

*   ✓ Did you recently upgrade your AWS Lambda function's runtime to Node.js 18.x or Node.js 20.x?
*   ✓ Does your function immediately fail at startup with a `Runtime.ImportModuleError`?
*   ✓ Is your Lambda handler using the legacy import syntax `const AWS = require('aws-sdk')`?

---

## Environment

The AWS SDK loader resolves dependencies serverless-side during container initialization, executing across environments including AWS Lambda Serverless Functions, Cloudflare Workers edge runtimes, Custom Node.js container environments, and Webpack module bundle configurations.

| Lambda Runtime Target | Bundled Dependencies Scope | Import Statement Path | Lambda Invocation Result |
| :--- | :--- | :--- | :--- |
| Node.js 16.x or older | None (Relies on pre-installed SDK) | `const AWS = require('aws-sdk')` | Success (Legacy SDK v2 pre-installed) |
| Node.js 18.x or 20.x | None (Relies on pre-installed SDK) | `const AWS = require('aws-sdk')` | Failed (Error: Cannot find module 'aws-sdk') |
| Node.js 18.x or 20.x | Bundled `aws-sdk` v2 (in zip package) | `const AWS = require('aws-sdk')` | Success (Resolves locally bundled legacy SDK) |
| Node.js 18.x or 20.x | None (Relies on pre-installed SDK) | `import { S3Client } from '@aws-sdk/client-s3'` | Success (Uses pre-installed SDK v3) |

---

## Minimal Repro

Under AWS Lambda's execution environment lifecycle, serverless containers are initialized using pre-packaged runtime image configurations. To reduce the default runtime container footprint and encourage modern coding practices, AWS runtimes beginning with Node.js 18.x removed the pre-installed monolithic AWS SDK for JavaScript v2 (`aws-sdk`). The runtime now bundles the modular AWS SDK for JavaScript v3 (`@aws-sdk/*`) by default. If your application codebase contains legacy import statements (`const AWS = require('aws-sdk')`) and you deploy to a Node.js 18+ runtime without bundling `node_modules` inside the deployment zip archive, the Node compiler fails to resolve the reference. The bootstrap process aborts immediately, throwing a `Runtime.ImportModuleError` containing the `Error: Cannot find module 'aws-sdk'` exception. Migrating imports to use the `@aws-sdk` client namespaces satisfies the runtime checker, or bundling the legacy package directly provides backwards compatibility.

```javascript
// CRASH: Importing legacy v2 SDK on Node.js 18+ runtime
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const data = await s3.listBuckets().promise();
  return data;
};
```

```text
{
  "errorType": "Runtime.ImportModuleError",
  "errorMessage": "Error: Cannot find module 'aws-sdk'\nRequire stack:\n/var/task/index.js",
  "trace": [
    "Runtime.ImportModuleError: Error: Cannot find module 'aws-sdk'",
    "Require stack:",
    "/var/task/index.js",
    "    at _loadUserApp (/var/runtime/UserFunction.js:221:12)",
    "    at Object.module.exports.load (/var/runtime/UserFunction.js:246:17)"
  ]
}
```

---

## Resolution

When resolving missing SDK module errors in AWS Lambda, developers can choose between two main structural options depending on whether they can refactor their application code.

### Option A: Migrate Code to AWS SDK v3 (Recommended)
If you are updating your application or creating new functions, refactoring to the pre-installed AWS SDK for JavaScript v3 is applicable. This configuration reduces deployment zip sizes and leverages pre-installed runtime dependencies.

1. Identify the modular package clients you require (e.g., `@aws-sdk/client-s3`).
2. Replace monolithic imports with modular import paths.
3. Instantiate specific clients directly (e.g., `S3Client`).
4. Execute commands using client `.send()` method structures.

```javascript
// Correct: Import modular client from pre-installed runtime dependencies
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

// Instantiate Client
const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  try {
    // Construct modular client commands
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ buckets: response.Buckets })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
```

### Option B: Bundle aws-sdk v2 Locally in the Deployment Package
If you manage large legacy codebases where refactoring the SDK calls is cost-prohibitive, bundling the `aws-sdk` library inside your deployment bundle is applicable. This restores legacy compatibility on Node 18+ runtimes.

1. Add the legacy package to your dependencies:
   ```bash
   npm install aws-sdk
   ```
2. Package the `node_modules` directory containing `aws-sdk` inside your deployment zip archive before uploading to AWS.

### When This Fix Won't Work
If you deploy using custom Lambda Layers that explicitly delete or intercept local `node_modules` folders, runtime import calls for bundled packages can still fail. Verify Layer configurations before bundling legacy files.

## Operational Runbook

### Case 1: Node.js 18+ Upgrades
1. Search codebase for instances of `require('aws-sdk')` or `import AWS from 'aws-sdk'`.
2. Replace references with modular v3 packages.

### Case 2: Legacy Deployments
1. Install `aws-sdk` using package managers.
2. Build zip packages including dependency files.

### Rollback Strategy
To roll back this change, restore the previous SDK import references by replacing modular client instantiations with monolithic `require('aws-sdk')` constructor definitions, add the `aws-sdk` v2 library back to your local `package.json` dependencies checklist, and ensure the deployment package compiler bundles the `node_modules` directory.

---

## Verification

- [ ] AWS Lambda handler invocations complete returning HTTP 200 responses containing expected API data.
- [ ] Serverless execution logs contain zero Runtime.ImportModuleError missing package messages.
- [ ] Modular client instance requests execute successfully returning valid query results.

### Error Trigger Point Lifecycle

Start Lambda container execution ➔ Load server handler file ➔ Evaluate require or import statements [ERROR OCCURS HERE] ➔ Initialize client resources ➔ Process client requests ➔ Return handler response

## References

*   **AWS SDK v3 Upgrade Announcement**: https://aws.amazon.com/blogs/developer/announcing-the-aws-sdk-for-javascript-v3/
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified AWS Lambda Node.js runtime pre-installed modules, SDK migration pathways, and serverless package bundling requirements.
*   **AWS SDK JS v3 Modular Client Guide**: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified client namespace specifications, module packaging boundaries, and dynamic environment mappings.
*   **AWS SDK Node.js Issues Log #4892**: https://github.com/aws/aws-sdk-js/issues/4892
    *   *Evidence Tier:* Community
    *   *Contribution:* Captured the real-world execution symptoms and reproduction parameters of the Runtime.ImportModuleError missing SDK exception.

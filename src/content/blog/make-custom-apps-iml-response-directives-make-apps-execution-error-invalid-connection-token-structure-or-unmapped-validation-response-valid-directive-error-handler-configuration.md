---
pipeline_contract_version: "21.0"
meta_title: "How to Fix Make.com Custom App False Successes and Validation Errors"
meta_description: "Learn how to use IML response directives to handle false successes and map HTTP validation errors in Make.com custom apps."
slug: "make-custom-apps-iml-response-directives-make-apps-execution-error-invalid-connection-token-structure-or-unmapped-validation-response-valid-directive-error-handler-configuration"
pubDate: "2026-07-14"
validated_environments:
  - "Express API Server contexts"
  - "Next.js dynamic Route Handlers"
  - "Standalone Node.js scripts"
  - "Serverless Vercel Functions runtime"
---

# How to Fix Make.com Custom App False Successes and Validation Errors

## Quick Diagnosis

*   ✓ Does your Make.com custom app module process API validation failures as successful scenario runs?
*   ✓ Are variables resolving to empty or null fields because your module ignores error bodies wrapped in HTTP 200 OK statuses?
*   ✓ Is your module failing to display descriptive error messages when endpoints return 400 Bad Request or 401 Unauthorized codes?

---

## Environment

The Make.com IML response compiler parses JSON configuration definitions, validating module responses received across Express API Server contexts, Next.js dynamic Route Handlers, Standalone Node.js scripts, and Serverless Vercel Functions runtimes.

| HTTP Status Code | Response Body Details | Make.com App Directives | Make.com Execution Outcome |
| :--- | :--- | :--- | :--- |
| 200 OK | `{ "error": "Invalid Token" }` | Omitted (No `valid` directive) | Success (Module continues execution but returns empty data) |
| 200 OK | `{ "error": "Invalid Token" }` | `"valid": "{{!body.error}}"` | Failed (Stops flow, logs validation message to builder console) |
| 400 Bad Request | `{ "message": "Format error" }` | `"error": { "400": { "type": "DataError" } }` | Failed (Halts scenario run, maps error type directly to DataError) |

---

## Minimal Repro

Under Make.com's custom app architecture, module executions rely on defined response conditions to parse API communication. When an API client receives a response, Make.com evaluates the status code. By default, any HTTP 200 OK status is registered as a successful execution. If the third-party API returns validation failures, error messages, or expired credentials within an HTTP 200 payload, Make.com ignores the error. It routes the output to subsequent modules as a false success. Declaring the `valid` directive using IML logical expressions enables the runtime parser to identify error parameters. Defining specific HTTP status code configurations in the `error` block maps technical responses to defined Make.com error types like ConnectionError or DataError, preventing silent integration drops.

```json
// CRASH: Module configuration that ignores API validation errors returned in 200 payloads
{
  "temp": {
    "response": {
      "output": "{{body}}"
      // CRASH: No "valid" condition configured to intercept API errors
    }
  }
}
```

```text
Make.com Execution Log:
  Module: Get Connection Status (Success)
  Output Bundle:
    body: {
      "status": "error",
      "message": "Invalid connection token structure",
      "error_code": "AUTH_FAILED"
    }
  [Downstream modules crash due to missing fields]
```

---

## Resolution

When resolving API validation failures in Make.com, developers can choose between two main structural options depending on whether they need to parse custom status mappings.

### Option A: Declare the `valid` Directive and Map Error Status Codes (Recommended)
If your app calls endpoints that return technical codes or embed validation status flags in JSON payloads, declaring IML condition boundaries is applicable. This forces the module to evaluate data correctness before outputting results.

1. Convert comma-separated string inputs to standard arrays of strings.
2. Set the `typecast` property option to `true` in the request parameters.
3. Execute write requests using the `base(tableName).create` method.

```json
{
  "temp": {
    "response": {
      "output": "{{body}}",
      // Correct: Ensure HTTP 200 responses are validated before returning success
      "valid": "{{!body.error && body.status !== 'invalid'}}",
      "error": {
        // Correct: Map API message properties to custom error types
        "message": "[{{statusCode}}] {{body.error.message || body.message}}",
        "type": "DataError",
        "400": {
          "type": "DataError",
          "message": "Invalid input formatting: {{body.error.details}}"
        },
        "401": {
          "type": "ConnectionError",
          "message": "Authentication failed. Invalid connection token structure: {{body.error}}"
        },
        "429": {
          "type": "RateLimitError",
          "message": "Rate limit exceeded. Retry after backoff."
        }
      }
    }
  }
}
```

### Option B: Build Connection Authentication Assertions
If you are developing a connection verification endpoint, evaluating precise authentication properties is applicable. If the target server responds with unsuccessful validation attributes, the connection must fail immediately.

1. Set the `valid` directive to check for positive authentication attributes.
2. Set the `error.type` parameter to `ConnectionError` to notify scenario builders of expired tokens.

```json
{
  "temp": {
    "response": {
      // Correct: Verify that authentication flag matches true strictly
      "valid": "{{body.authenticated === true}}",
      "error": {
        "type": "ConnectionError",
        "message": "Connection authentication failed: {{body.error_description || 'Unknown authentication issue'}}"
      }
    }
  }
}
```

### When This Fix Won't Work
If you place custom error mappings or validity validation logic directly inside the module `output` block, the parser will bypass validation rules entirely. Make.com compiles the output block only for successful executions, making it impossible to catch failures here.

## Operational Runbook

### Case 1: Validating IML Expressions
1. Ensure IML variables (like `{{body.error}}`) are typed correctly.
2. Confirm logical operators are supported in Make's custom apps environment.

### Case 2: Mapping Custom Error Statuses
1. Double-check API response JSON schemas for nested error keys.
2. Test connection responses using the local Make.com developer console tools.

### Rollback Strategy
To roll back this change, remove the `valid` directive and detailed code configurations from the module's `response` object schema, map only the raw `body` variable directly to outputs, and configure manual filters in downstream scenario runs to handle API errors.

---

## Verification

- [ ] Make.com custom modules halt scenario execution and throw visible exceptions on validation failures.
- [ ] The IML parser correctly flags HTTP 200 error responses as invalid runs.
- [ ] API error codes map cleanly to respective Make.com error types inside the execution inspector.

### Error Trigger Point Lifecycle

Define module communication ➔ Specify connection parameters ➔ Receive server response ➔ Evaluate valid condition [ERROR OCCURS HERE] ➔ Parse error mapping blocks ➔ Expose user friendly diagnostic message

## References

*   **Make.com Custom Apps Response Handling Guide**: https://docs.make.com/apps/response-handling
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified Make.com custom app response schema definitions, IML syntax validation rules, error handling structures, and status mapping directives.
*   **Make.com Apps Developer SDK Reference**: https://docs.make.com/apps/api
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified connection properties, response properties, and output mapping constraints.
*   **Make.com Community Discussions thread #10429**: https://community.make.com/t/custom-app-module-returns-success-on-error/10429
    *   *Evidence Tier:* Community
    *   *Contribution:* Captured the real-world symptoms and reproduction parameters of modules returning success status on API validation failures.

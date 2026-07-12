---
pipeline_contract_version: "21.0"
meta_title: "How to Fix Auth0Error: auth0-custom-domain header missing in Management API"
meta_description: "Learn how to resolve the auth0-custom-domain header missing error in Auth0 ManagementClient when using Multiple Custom Domains."
slug: "auth0-integration-gateway-managementclient-node-sdk-v5-auth0error-auth0-custom-domain-header-missing-multiple-custom-domains-ticket-branding-configuration"
validated_environments:
  - "Express API Server contexts"
  - "Next.js dynamic Route Handlers"
  - "Standalone Node.js scripts"
  - "Serverless Vercel Functions runtime"
---

# How to Fix Auth0Error: auth0-custom-domain header missing in Management API

## Quick Diagnosis

*   ✓ Are your Auth0 Management API ticket requests failing with a `400 Bad Request` or a missing header error?
*   ✓ Is your Auth0 tenant configured to support Multiple Custom Domains?
*   ✓ Are you calling `management.tickets.changePassword()` or similar ticket functions without specifying a custom domain header?

---

## Environment

The Auth0 ticket branding context processor evaluates custom domains gateway-side, running across configurations including Express API Server contexts, Next.js dynamic Route Handlers, Standalone Node.js scripts, and Serverless Vercel Functions runtimes.

| Tenant Custom Domains Status | ManagementClient Headers Spec | Ticket Endpoint Request Call | Management API Response Status |
| :--- | :--- | :--- | :--- |
| Multiple active custom domains | Omitted (Empty headers) | `management.tickets.changePassword()` | Failed (Auth0Error: auth0-custom-domain header missing) |
| Multiple active custom domains | `headers: { 'auth0-custom-domain': 'login.custom.com' }` | `management.tickets.changePassword()` | Success (Returns password ticket with branded domain URL) |
| Single custom domain (default) | Omitted (Empty headers) | `management.tickets.changePassword()` | Success (Automatically falls back to default domain) |

---

## Minimal Repro

Under Auth0's identity engine, user ticket operations (such as password reset links or email verification tickets) generate dynamic redirection URLs sent directly to users. In standard single-domain configurations, Auth0 resolves these domains automatically. However, when a tenant is configured with Multiple Custom Domains, the server-side branding processor must determine which custom domain context and brand formatting to apply to the generated ticket URL. If your application uses the `auth0` ManagementClient to execute a ticket request without declaring the `auth0-custom-domain` header, the API gateway is unable to determine the target domain. The server rejects the request, throwing an `Auth0Error` with a `400 Bad Request` status and indicating that the custom domain header is missing. Adding the `auth0-custom-domain` header to your request headers resolves this branding mismatch.

```javascript
const { ManagementClient } = require('auth0');

// Initialize management client under Multiple Custom Domains setup
const management = new ManagementClient({
  domain: process.env.AUTH0_TENANT_DOMAIN,
  clientId: process.env.AUTH0_M2M_CLIENT_ID,
  clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET
  // CRASH: headers config is empty
});

async function runRepro() {
  try {
    // CRASH: API rejects request due to undetermined branding domain context
    const ticket = await management.tickets.changePassword({
      user_id: 'auth0|1234567890',
      result_url: 'https://errorledger.com/login'
    });
    console.log(ticket.ticket);
  } catch (error) {
    console.error(error); // Throws Auth0Error
  }
}

runRepro();
```

```text
Auth0Error: auth0-custom-domain header missing
    at ManagementClient.changePassword (node_modules/auth0/dist/cjs/management/tickets.js:42:19)
    at runRepro (repro.js:13:28)
```

---

## Resolution

When resolving Auth0 custom domain branding exceptions, developers can choose between two main structural options depending on whether they require static or dynamic tenant routing.

### Option A: Configure the auth0-custom-domain Header Globally (Recommended)
If your application runs under a single primary custom domain, passing the `auth0-custom-domain` property during the initialization phase of your `ManagementClient` is applicable. This ensures all subsequent requests automatically carry the required context.

1. Add a `headers` object configuration block to your client constructor options.
2. Define the `'auth0-custom-domain'` property with your verified custom domain hostname.

```javascript
import { ManagementClient } from 'auth0';

// Configure custom domain globally during initialization
const management = new ManagementClient({
  domain: process.env.AUTH0_TENANT_DOMAIN,
  clientId: process.env.AUTH0_M2M_CLIENT_ID,
  clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
  headers: {
    'auth0-custom-domain': 'login.errorledger.com'
  }
});

export async function generatePasswordResetLink(userId) {
  // Returns ticket URL branded with login.errorledger.com
  const ticket = await management.tickets.changePassword({
    user_id: userId,
    result_url: 'https://errorledger.com/dashboard'
  });
  return ticket.ticket;
}
```

### Option B: Override the Custom Domain Header per Request
If you operate a multi-tenant platform where different users require ticket branding matching their specific brand subdomains, passing the custom domain option dynamically inside individual request configurations is applicable.

1. Initialize your client without global headers.
2. Construct a request configuration object containing the custom domain headers.
3. Pass the configuration block as the second parameter to your ticket query.

```javascript
import { ManagementClient } from 'auth0';

const management = new ManagementClient({
  domain: process.env.AUTH0_TENANT_DOMAIN,
  clientId: process.env.AUTH0_M2M_CLIENT_ID,
  clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET
});

export async function generateDynamicBrandedTicket(userId, brandDomain) {
  // Define header overrides for this specific call
  const requestOptions = {
    headers: {
      'auth0-custom-domain': brandDomain
    }
  };

  const ticket = await management.tickets.changePassword({
    user_id: userId,
    result_url: `https://${brandDomain}/dashboard`
  }, requestOptions);

  return ticket.ticket;
}
```

### When This Fix Won't Work
If you pass the `auth0-custom-domain` header but specify a domain hostname that is not verified and active in your Auth0 custom domains console dashboard, request operations will fail with a `400 Bad Request` or branding conflict error.

## Operational Runbook

### Case 1: Client Setup
1. Configure `ManagementClient` using M2M client credentials.
2. Set `auth0-custom-domain` header matching your default brand domain.

### Case 2: Multi-Tenant Setup
1. Expose brand domain parameters in ticket creation calls.
2. Wrap request settings in request override handlers.

### Rollback Strategy
To roll back this change, replace custom brand domain variables with the default tenant domain context in the tickets configuration parameters, remove the `auth0-custom-domain` key-value pairs from your ManagementClient instantiation options, and configure a single default custom domain in your Auth0 dashboard settings.

---

## Verification

- [ ] Ticket API change password requests return successful branded redirect link objects.
- [ ] ManagementClient network calls include the auth0-custom-domain header in payload audits.
- [ ] Integration tests confirm correct multi-tenant brand URLs are resolved in generated tickets.

### Error Trigger Point Lifecycle

Load tenant credentials ➔ Initialize ManagementClient context ➔ Define custom headers ➔ Dispatch ticket generation call [ERROR OCCURS HERE] ➔ Evaluate tenant domains count ➔ Return branded ticket payload

## References

*   **Auth0 Multiple Custom Domains Documentation**: https://auth0.com/docs/customize/custom-domains/multiple-custom-domains
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified Auth0 Management API Multiple Custom Domains request parameters, custom header configurations, and ticket URL branding handshakes.
*   **Auth0 Management SDK Client Reference**: https://github.com/auth0/node-auth0/blob/master/README.md
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified client configuration structures, custom headers parameters, and ticket API methods.
*   **Auth0 Community Forums Thread #84992**: https://community.auth0.com/t/multiple-custom-domains-management-api/84992
    *   *Evidence Tier:* Community
    *   *Contribution:* Captured the real-world execution symptoms and reproduction parameters of the ticket generation branding failure.

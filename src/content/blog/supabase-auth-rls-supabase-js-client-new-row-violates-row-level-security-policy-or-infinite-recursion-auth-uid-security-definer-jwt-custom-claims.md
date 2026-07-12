---
pipeline_contract_version: "21.0"
meta_title: "How to Fix Supabase RLS violating policy or infinite recursion errors"
meta_description: "Learn how to resolve PostgreSQL row level security policy violations and infinite recursion deadlocks in Supabase Auth."
slug: "supabase-auth-rls-supabase-js-client-new-row-violates-row-level-security-policy-or-infinite-recursion-auth-uid-security-definer-jwt-custom-claims"
validated_environments:
  - "supabase-js Web SDK"
  - "Next.js Route Handlers client contexts"
  - "PostgreSQL database policies schema"
  - "Serverless Edge Functions environment"
---

# How to Fix Supabase RLS violating policy or infinite recursion errors

## Quick Diagnosis

*   ✓ Are your `insert` or `update` queries throwing a `42501` exception indicating that the "new row violates row-level security policy"?
*   ✓ Does your console output display `42P17: infinite recursion detected in policy` when performing database operations?
*   ✓ Did you recently enable Row-Level Security (RLS) on a table without creating matching write and read permissions?

---

## Environment

The Supabase database policies execute directly inside the PostgreSQL instance, affecting queries sent from the `supabase-js` Web SDK, Next.js Route Handlers, and Serverless Edge Functions.

| Database Write Strategy | Active Policies Configuration | SDK Invocation Syntax | Database Execution Outcome |
| :--- | :--- | :--- | :--- |
| Insert client-side payload | `INSERT` policy defined, `SELECT` policy missing | `supabase.from('tasks').insert(...)` | Failed (PostgREST attempts implicit SELECT returning new row, violates read privileges) |
| Insert client-side payload | `INSERT` policy defined, `SELECT` policy missing | `supabase.from('tasks').insert(...).select()` | Failed (Explicit select triggers RLS policy violation exception) |
| Insert client-side payload | `INSERT` policy defined, `SELECT` policy missing | `supabase.from('tasks').insert(...).select().single()` | Failed (Returns new row violates RLS error) |
| Insert client-side payload | `INSERT` policy defined, `SELECT` policy missing | `supabase.from('tasks').insert(...).select()` with `SELECT` policy added | Success (Satisfies read and write verification filters) |

---

## Minimal Repro

Row-Level Security (RLS) acts as a firewall directly on the PostgreSQL storage engine level. When RLS is active (`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`), PostgreSQL denies all read, write, update, and delete access by default unless specific authorization policies allow them. When invoking an `insert` statement via the `supabase-js` client, PostgREST (the HTTP API layer for PostgreSQL) automatically compiles a query containing a `SELECT` returning clause to fetch and return the newly created records to the client wrapper. If your database has an `INSERT` policy active but lacks a matching `SELECT` policy for the authenticated user, PostgreSQL successfully writes the database row but aborts the entire transaction when compiling the returning record. The API client intercepts this read-permission failure and returns a `42501` database error with the `new row violates row-level security policy` exception. Separately, creating policy checks that query the current table within the check clause triggers circular dependency loops (`42P17` infinite recursion), which can be resolved by deploying `SECURITY DEFINER` function wrappers.

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export async function createNewTask(title, userId) {
  // CRASH: PostgreSQL writes row but PostgREST fails to return it
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, user_id: userId });
    
  if (error) throw error;
  return data;
}
```

```text
PostgrestError: new row violates row-level security policy for table "tasks" (Status Code: 42501)
```

---

## Resolution

When resolving Row-Level Security exceptions, developers can choose between two main structural options depending on whether they are solving read violations or infinite recursion loops.

### Option A: Create Matching SELECT and INSERT Policies (For Write Violations)
If you configure client-side writes, ensuring that users have both write (`INSERT`) and read (`SELECT`) permissions is applicable. This configuration allows PostgREST returning clauses to resolve successfully.

1. Log into your Supabase SQL editor or migration files.
2. Enable RLS on the target table using `ALTER TABLE`.
3. Define the `INSERT` policy with `WITH CHECK` conditions matching user IDs.
4. Define the corresponding `SELECT` policy to permit user reads.

```sql
-- 1. Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. Define insert privileges
CREATE POLICY "Allow authenticated inserts"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Define select privileges to satisfy post-insert SELECT checks
CREATE POLICY "Allow users to view own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Option B: Use SECURITY DEFINER Functions (For Infinite Recursion)
If you create checks that verify relationships by querying tables protected by the same policy rule, using a `SECURITY DEFINER` helper function is applicable. This prevents circular recursion deadlocks.

1. Create a PostgreSQL function matching the check conditions.
2. Declare the function with `SECURITY DEFINER` so it executes with bypass privileges.
3. Call the function inside the policy `USING` expression.

```sql
-- Create database helper function executing as creator role
CREATE OR REPLACE FUNCTION public.check_user_is_team_member(team_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Bypasses Team table RLS checks during validation query run
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = check_user_is_team_member.team_id
      AND team_members.user_id = check_user_is_team_member.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind policy checking teams without recursion
CREATE POLICY "Allow members view teams"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (check_user_is_team_member(id, auth.uid()));
```

### When This Fix Won't Work
If you utilize `supabase-js` service keys (`service_role`) inside backend APIs, RLS policies are bypassed entirely. Ensure your client handles credentials contexts correctly before applying RLS rules.

## Operational Runbook

### Case 1: Write Violations
1. Verify `SELECT` policy exists on the table.
2. Confirm the target user's UUID matches the token `auth.uid()`.

### Case 2: Circular Dependency Deadlocks
1. Wrap relationship check queries inside helper SQL functions.
2. Apply `SECURITY DEFINER` attributes.

### Rollback Strategy
To roll back these changes, execute sql commands to disable Row-Level Security on the target tables using the `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY` declaration, drop the database policies using `DROP POLICY` statements, and remove custom check functions from the database schema footprint.

---

## Verification

- [ ] Client application database queries execute successfully returning HTTP status codes of 201 Created.
- [ ] Client-side API payload response lists contain the newly populated data records.
- [ ] PostgreSQL runtime console logs contain zero 42501 policy violations or 42P17 recursion deadlock aborts.

### Error Trigger Point Lifecycle

Initialize client context ➔ Execute insert or update query ➔ Evaluate RLS policy check filters [ERROR OCCURS HERE] ➔ PostgreSQL verification scan ➔ Resolve query returning parameters ➔ Return client promise results

## References

*   **Supabase Row-Level Security Reference**: https://supabase.com/docs/guides/auth/row-level-security
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified the Supabase RLS row-level security mechanisms, PostgREST SELECT return behaviors, and PostgreSQL SECURITY DEFINER functions.
*   **PostgreSQL Security Definer Documentation**: https://www.postgresql.org/docs/current/sql-createfunction.html
    *   *Evidence Tier:* Official
    *   *Contribution:* Verified the SECURITY DEFINER execution scopes, schema privileges bindings, and circular dependency checks.
*   **Supabase Core Repo GitHub Issue #8754**: https://github.com/supabase/supabase/issues/8754
    *   *Evidence Tier:* Community
    *   *Contribution:* Captured the real-world execution symptoms and reproduction parameters of the RLS recursion and write violation exceptions.

---
name: OpenAPI integer fields with workspace Zod
description: A generator/runtime compatibility constraint for future API contract changes.
---

When adding numeric request or response fields to this workspace's OpenAPI contract, prefer `type: number` with numeric bounds over `type: integer` unless the Zod generator/runtime has been upgraded together.

**Why:** The current generated Zod runtime does not expose `z.int()`, so OpenAPI integer fields make codegen pass but fail the shared library typecheck.

**How to apply:** After any OpenAPI edit, run codegen and the library typecheck before using the generated hooks or schemas.
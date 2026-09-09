---
name: Order source alignment
description: De•Bite currently has customer orders in the workspace store and legacy records in Supabase.
---

Customer-facing order lookup and the kitchen dashboard must handle both the workspace order store and the legacy Supabase order tables. Supabase’s `delivered` status maps to the customer API’s `completed` status.

**Why:** The two stores evolved separately; otherwise new customer orders disappear from the admin queue or older dashboard orders cannot be tracked by customers.

**How to apply:** When changing order creation, tracking, or kitchen operations, preserve both-source compatibility until the data stores are intentionally migrated.
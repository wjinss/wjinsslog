# AGENTS.md

This file defines rules and context for AI agents working on this repository.

Agents must follow these guidelines to keep the project consistent, maintainable, and safe.

---

# 1. Project Overview

This project is a personal developer blog called `wjinss.log`.

The blog is designed as a single-author developer blog.

Main characteristics:

- Public users can read published posts.
- Logged-in users can like posts and write comments.
- Only the admin can create, edit, and delete posts.
- Posts are written in Markdown.
- Tags are used to organize posts.
- Comments support replies, but nesting is limited.
- The project prioritizes readability, maintainability, and incremental development.

---

# 2. Tech Stack

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:

- Supabase
  - Auth
  - PostgreSQL
  - RLS

State / Client Interaction:

- TanStack Query, only where necessary
- Zustand, only where already used and justified

Deployment:

- Vercel

Package Manager:

- pnpm

---

# 3. Project Structure

Use the existing folder structure.

```txt
src/
├── app/
│   ├── (admin)/
│   ├── (auth)/
│   ├── (public)/
│   ├── api/
│   ├── auth/
│   ├── edit/
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   ├── providers/
│   └── ui/
│
├── constants/
│   ├── routes.ts
│   └── site.ts
│
├── features/
│   ├── auth/
│   ├── comments/
│   │   ├── actions/
│   │   ├── components/
│   │   └── lib/
│   └── posts/
│       ├── actions/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── stores/
│       └── types/
│
├── hooks/
├── lib/
├── styles/
├── types/
└── utils/
```

Folder rules:

- `app/` contains routes, layouts, pages, and route handlers.
- `components/ui/` contains reusable UI primitives.
- `components/layout/` contains layout-related components.
- `components/providers/` contains app-level providers.
- `features/*` contains domain-specific logic.
- `features/posts` contains post-related UI, actions, hooks, stores, types, and data access logic.
- `features/comments` contains comment-related UI, actions, and data access logic.
- `lib/` contains shared external service clients and low-level helpers.
- `utils/` contains shared utility functions.

Do not create random top-level folders unless clearly necessary.

---

# 4. Development Workflow Rules

Agents must work incrementally.

Preferred workflow:

1. Analyze the current code.
2. Explain the current structure.
3. List files that will be changed.
4. Explain the implementation approach.
5. Make the smallest safe change.
6. Explain what changed.
7. Provide manual test steps.

Avoid large refactors unless explicitly requested.

When a task is large, split it into smaller steps.

Examples:

- Analysis only
- UI only
- Server logic only
- Data fetching only
- Integration
- Final verification

---

# 5. Response Format Rules

After every task, agents must explain the work clearly.

The response should include:

1. What was changed
2. Why it was changed
3. Which files were created or modified
4. How the feature or refactor works
5. What the user should test next

Use beginner-friendly explanations.

Do not give vague summaries.

---

# 6. File Modification Rules

When editing files:

- Modify only files related to the requested task.
- Do not rewrite entire files unless necessary.
- Do not rename folders or files without clear reason.
- Preserve existing project structure.
- Preserve existing feature behavior.
- Do not change unrelated UI, data fetching, auth, or database logic.

Before changing code, agents must first list:

- Files to change
- Reason for each change
- Expected impact

---

# 7. Code Style Rules

- Use TypeScript.
- Prefer functional components.
- Prefer Server Components when possible.
- Use Client Components only when interactivity is required.
- Avoid unnecessary `use client`.
- Avoid unnecessary state and effects.
- Keep code readable over clever.
- Avoid over-abstraction.
- Reuse existing components and utilities when appropriate.
- Do not add new libraries unless necessary.

If adding a dependency, explain:

- Why it is needed
- Why existing dependencies are insufficient
- What files are affected

---

# 8. Data Access Rules

Follow this general data flow:

```txt
UI → feature layer → data access/server action → Supabase
```

Avoid direct Supabase calls inside UI components unless the existing project pattern clearly does that.

Prefer data access functions inside feature folders.

Examples:

```txt
features/posts/lib/*
features/comments/lib/*
features/posts/actions/*
features/comments/actions/*
```

---

# 9. Supabase / Database Rules

Public post visibility must always respect:

```txt
posts.status = "published"
posts.deleted_at is null
```

This rule applies to:

- Main post list
- Search results
- Tag filters
- Tag counts
- Public post detail pages
- Related public queries

Soft-deleted posts must not appear in public UI.

Do not modify SQL, RLS, views, RPC functions, or database schema unless explicitly requested.

If SQL changes are needed:

1. Explain why.
2. Provide SQL separately.
3. Do not automatically apply it.
4. Prefer Supabase SQL Editor or documented DB management.
5. Document the SQL in `DB_SCHEMA.md` or a similar document if used.

---

# 10. Authentication / Authorization Rules

User roles:

```txt
guest
user
admin
```

Permissions:

Guest:

- Read published posts

User:

- Read published posts
- Like posts
- Write comments
- Write replies

Admin:

- Create posts
- Edit posts
- Delete posts

Admin is determined by the profile role:

```txt
profiles.role = "admin"
```

Never rely only on UI hiding for authorization.

Admin-only actions must be protected by:

1. UI visibility
2. Server-side checks
3. Supabase RLS or database-level rules where applicable

Do not remove server-side permission checks.

---

# 11. Post Rules

Posts use Markdown content.

Important fields may include:

- title
- slug
- excerpt
- content_md
- thumbnail_url
- status
- published_at
- views_count
- likes_count
- comments_count
- created_at
- updated_at
- deleted_at

Rules:

- Public pages must show only published and non-deleted posts.
- Soft delete should use `deleted_at`.
- Do not hard delete posts unless explicitly requested.
- Post slug behavior should remain stable.
- Editing a post should not unexpectedly change its URL unless explicitly requested.

---

# 12. Tag Rules

Tags are used for filtering posts.

Rules:

- Deleted posts must not affect public tag visibility.
- Draft/unpublished posts must not affect public tag visibility.
- Tag counts should represent published, non-deleted posts only.
- Existing tag filter URL behavior must be preserved unless explicitly requested.

Current URL behavior:

```txt
/?tag=tagName
```

Do not change tag URL behavior without explicit approval.

---

# 13. Comment Rules

Comments support replies.

Maximum nesting depth:

```txt
comment
└ reply
```

Rules:

- Replies cannot have further replies.
- Do not implement unlimited nested comments.
- Public users can read comments.
- Logged-in users can write comments and replies.
- Soft-deleted comments should be hidden or handled consistently.

---

# 14. Like Rules

Post likes should support toggle behavior.

Rules:

- Logged-in users can like/unlike posts.
- Guests cannot like posts.
- Duplicate likes must be prevented.
- Keep API responses compatible with existing client hooks.
- Avoid unnecessary diagnostic queries or excessive logs in production routes.

---

# 15. Search Rules

Search is currently based on:

- Post title
- Tags

Do not add full-text search or body search unless explicitly requested.

Search results must respect:

```txt
posts.status = "published"
posts.deleted_at is null
```

Search results must not contain duplicate posts.

---

# 16. Theme Rules

The project supports dark mode.

Rules:

- Keep dark mode behavior stable.
- Avoid hydration mismatch.
- Theme toggle should remain accessible.
- Do not change global theme behavior unless requested.

---

# 17. Performance Rules

Performance work must be done carefully.

Preferred performance workflow:

1. Diagnose first.
2. Do not change code during diagnosis.
3. Identify quick wins.
4. Apply small changes.
5. Run typecheck/build/lint.
6. Provide before/after reasoning.
7. Provide manual tests.

Performance priorities:

- Reduce unnecessary Supabase requests.
- Avoid duplicated auth/session queries.
- Reduce unnecessary Client Component boundaries.
- Reduce hydration cost.
- Optimize LCP images.
- Avoid excessive server logs.
- Avoid fetching unused columns.
- Keep public data and user-specific data clearly separated.

Never cache user-specific data globally.

Do not force static rendering if auth/session state may become incorrect.

---

# 18. Testing / Verification Rules

After a change, agents should suggest relevant checks.

Common commands:

```bash
pnpm exec tsc --noEmit --incremental false
pnpm lint
pnpm build
```

Common manual tests:

- Login
- Logout
- Google/GitHub OAuth redirect
- Admin-only write/edit/delete
- Post list
- Post detail
- Tag filtering
- Search
- Like/unlike
- Comment/reply
- Dark mode
- Mobile responsive layout
- Soft delete visibility
- Build without TypeScript errors

---

# 19. OAuth Redirect Rules

OAuth redirect behavior must work in both environments.

Development:

```txt
http://localhost:3000/auth/callback
```

Production:

```txt
https://<production-domain>/auth/callback
```

Do not hardcode localhost in OAuth redirects.

Use current origin when appropriate.

---

# 20. Important Principles

Agents must prioritize:

- Correctness
- Security
- Maintainability
- Performance
- Small incremental changes
- Beginner-friendly explanations

Avoid:

- Broad rewrites
- Unrequested DB changes
- Unrequested dependency additions
- Unrequested UI redesigns
- Removing security checks
- Changing feature behavior during performance refactors

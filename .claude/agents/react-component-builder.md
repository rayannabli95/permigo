---
name: react-component-builder
description: Crée des composants React 19 + Tailwind + shadcn idiomatic
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---
- Functional + hooks (jamais class component)
- Props typées, jamais `any`
- Data serveur → react-query (useQuery, useMutation)
- État local minimal, derived state
- shadcn primitives depuis `src/components/ui/`
- État complexe → Zustand store
- Accessibility : labels, aria-*, focus ring
- Mobile-first
- Test Vitest minimum : render + 1 interaction

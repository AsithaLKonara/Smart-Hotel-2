# Senior Fullstack Engineering Rules

## Core Principles
- **Verify Every Change**: Never assume a fix works until it's verified in the browser or via tests.
- **Root Cause Analysis**: Don't just patch symptoms (like hydration errors). Find why they happen (e.g., mismatch in server/client state).
- **Clean Architecture**: Maintain strict separation between UI (components), Logic (hooks/utils), and Data (API/Prisma).
- **ESM/CJS Awareness**: Be extremely careful with ESM-only packages in Next.js. Prefer dynamic imports with `ssr: false` for problematic client-side libraries.
- **Next.js 15+ Standards**: 
    - Use `"use client"` only where necessary.
    - Leverage Server Components for data fetching.
    - Handle async `params` and `searchParams` in Page components correctly.

## Debugging Workflow
1. **Analyze Stack Traces**: Don't just read the error message; look at the file and line number in the bundle.
2. **Isolate Components**: Comment out sections of code to find the exact line causing the crash.
3. **Environment Parity**: Ensure `npm install` is run after dependency changes. Clear `.next` cache for mysterious bundling issues.

## Component Design
- **Hydration Safety**: Use `isMounted` patterns to gate client-only rendering.
- **Type Safety**: Prefer strict TypeScript types. Avoid `any` unless absolutely necessary (e.g., complex 3rd party props).
- **Premium UI**: Use HSL colors, smooth transitions, and glassmorphism as per the project design system.

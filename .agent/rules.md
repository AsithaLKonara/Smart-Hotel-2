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
- **Premium UI**: Use HSL colors, smooth transitions, and glassmorphic elements in accordance with the project's brand design system.

## Terminal Execution & Resource Optimization
- **Always run synchronously**: When running commands, avoid running them asynchronously in the background. Use large `WaitMsBeforeAsync` limits to execute commands directly on the terminal tab, preventing background process leaks and resource exhaustion.
- **Do not run background processes**: Kill unnecessary terminals immediately, keeping only localhost:3000 active for dev servers.

## Current Project Phase
- **Phase 2: Full Business E2E**: 
  - DO NOT TEST ISOLATED FEATURES.
  - Test Complete Business Journeys from start to finish.
  - Key Journeys: Guest Journey, Reception Journey, Housekeeping, Finance.


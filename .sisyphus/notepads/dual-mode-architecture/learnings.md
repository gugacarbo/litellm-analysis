# Task 9 Implementation Learnings

## Sidebar Mode Badge and Conditional Navigation

### Changes Made:
- Modified `apps/web/src/components/layout/sidebar.tsx` to import and use `useServerMode` hook
- Added a mode badge showing either "🟢 Full Access" (database mode) or "🟡 API Mode" with appropriate styling
- Added conditional rendering for the "Errors" navigation item based on `capabilities.errorLogs`
- Wrapped the entire App with `ServerModeProvider` to make the context available throughout the application
- Used spread operator with conditional arrays to conditionally include navigation items

### Key Implementation Details:
- Used shadcn/ui Badge component for the mode indicator
- Used conditional rendering with ternary operator for the badge content
- Leveraged destructuring to extract mode and capabilities from the hook
- Applied conditional array spreading `[...(condition ? [item] : [])]` for dynamic navigation items
- Added loading state handling to prevent UI flickering

### Technical Approach:
- Imported necessary dependencies: `useServerMode` hook and `Badge` component
- Retrieved server mode and capabilities using the hook
- Constructed navigation items array conditionally based on capabilities
- Implemented proper loading state handling
- Ensured proper TypeScript typing through existing interfaces## Task 11: Refactor api-client.ts for mode-aware requests

Date: 2026-04-22

### Changes Made
- Added type definitions: `ApiError`, `ApiResponse<T>`
- Created custom `FeatureUnavailableError` class for 501 responses
- Modified `fetchApi` to handle 501 status codes and throw `FeatureUnavailableError`
- Exported `isFeatureUnavailable(error: unknown): boolean` helper function

### Key Implementation Details
1. **501 Handling**: When server returns 501, we parse the JSON error response and throw a `FeatureUnavailableError` with the server message
2. **Type Safety**: Added proper TypeScript types for error responses
3. **Backward Compatibility**: All existing API function signatures remain unchanged
4. **Error Detection**: `isFeatureUnavailable` checks both the custom error class and message content for robust detection

### Endpoints That May Return 501 (API-only mode)
- GET /errors (errorLogs unavailable)
- POST /models/merge (logMerge unavailable)  
- DELETE /models/logs/:model (logMerge unavailable)

### Pattern for Future Reference
```typescript
// Usage example for components
try {
  const data = await getErrorLogs();
} catch (error) {
  if (isFeatureUnavailable(error)) {
    // Show "feature not available" UI
  } else {
    // Handle other errors
  }
}
```


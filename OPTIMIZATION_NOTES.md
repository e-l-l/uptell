# API Optimization Changes

## Overview

This document outlines the optimizations made to reduce redundant API calls and improve frontend performance.

## Problems Identified

### 1. **Excessive API Calls**

- `useApplications` was called in 6+ different components across the app
- Each `AppHistory` component made individual API calls to `/applications/{id}/history`
- Analytics components (`MttrChart`, `StageDurations`) were making separate calls for incident logs
- No proper caching strategy was in place

### 2. **No Caching Configuration**

- QueryClient was using default settings with no staleTime
- Data was being refetched unnecessarily on component re-mounts
- No background refetch optimization

## Solutions Implemented

### 1. **Enhanced Query Client Configuration** (`frontend/src/app/providers.tsx`)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      retry: 1, // Less aggressive retries
    },
  },
});
```

### 2. **Bulk Data Fetching Services**

#### Applications Service (`frontend/src/app/(protected)/applications/services.ts`)

- Added `useApplicationsHistory()` for bulk application history fetching
- Added `useApplicationHistory()` for individual app history with proper caching
- Increased staleTime for applications to 10 minutes (they don't change frequently)

#### Incidents Service (`frontend/src/app/(protected)/incidents/services.ts`)

- Added `useBulkIncidentLogs()` for fetching logs of multiple incidents in parallel
- Configured different staleTime values based on data volatility:
  - Incidents: 2 minutes
  - Individual incidents: 1 minute
  - Incident logs: 30 seconds (more real-time)

#### Maintenance Service (`frontend/src/app/(protected)/maintenance/services.ts`)

- Added proper caching with 5-minute staleTime
- Maintenance data is relatively stable

### 3. **Component Optimizations**

#### AppHistory Component (`frontend/src/components/dashboard/app-history.tsx`)

- **Before**: Made individual API calls via `apiClient.get()`
- **After**: Uses `useApplicationHistory()` hook with proper caching
- Added `useMemo` for expensive calculations
- Optimized date range calculations

#### Analytics Components

**MttrChart** (`frontend/src/components/dashboard/mttr-chart.tsx`):

- **Before**: Individual API calls for each incident's logs
- **After**: Uses `useBulkIncidentLogs()` to fetch all logs in parallel
- Reduced from N API calls to 1 bulk call

**StageDurations** (`frontend/src/components/dashboard/stage-durations.tsx`):

- **Before**: Individual API calls for incident logs
- **After**: Uses `useBulkIncidentLogs()` service
- Same N-to-1 reduction in API calls

#### Dashboard Page (`frontend/src/app/(protected)/dashboard/page.tsx`)

- Added `React.useMemo` for expensive calculations
- Memoized metrics calculations to prevent unnecessary re-computations
- Optimized analytics grid rendering

## Performance Impact

### Before Optimization:

- **Dashboard load**: 20+ API calls
  - 3 main data calls (applications, incidents, maintenance)
  - N calls for application history (where N = number of applications)
  - 2N calls for incident logs (MTTR + StageDurations components)
  - Multiple duplicate calls due to no caching

### After Optimization:

- **Dashboard load**: 6 API calls maximum
  - 3 main data calls (cached for 5+ minutes)
  - 1 bulk incident logs call (shared between analytics components)
  - Potentially 1 application history call (cached for 3 minutes)
  - 1 bulk applications history call (if using the bulk endpoint)

### Estimated Reduction:

- **API calls reduced by ~70-80%**
- **Faster page loads** due to caching
- **Reduced backend load** significantly
- **Better user experience** with cached data

## Cache Strategy

| Data Type            | StaleTime  | Reasoning                      |
| -------------------- | ---------- | ------------------------------ |
| Applications         | 10 minutes | Rarely change                  |
| Incidents            | 2 minutes  | Change frequently              |
| Individual Incidents | 1 minute   | Need freshish data             |
| Incident Logs        | 30 seconds | Most real-time data            |
| Maintenance          | 5 minutes  | Change moderately              |
| App History          | 3 minutes  | Historical data, less volatile |

## Best Practices Applied

1. **Bulk Fetching**: Fetch related data in parallel rather than sequentially
2. **Smart Caching**: Different cache times based on data volatility
3. **Memoization**: Prevent unnecessary re-computations in components
4. **Single Source of Truth**: Reuse cached data across components
5. **Optimistic Updates**: Cache invalidation on mutations

## Monitoring Recommendations

1. **Monitor API call frequency** in production
2. **Track cache hit/miss ratios**
3. **Monitor page load times** before/after
4. **Watch for stale data issues** and adjust staleTime if needed
5. **Track memory usage** to ensure caching doesn't cause memory leaks

## Future Improvements

1. **Implement pagination** for large datasets
2. **Add service workers** for offline caching
3. **Implement real-time updates** via WebSocket for critical data
4. **Add request deduplication** for identical concurrent requests
5. **Consider GraphQL** for more efficient data fetching patterns

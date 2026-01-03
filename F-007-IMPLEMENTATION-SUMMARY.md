## Feature F-007 – Implementation Summary

### What was implemented
- Time window filtering service that matches Dart implementation exactly
- Interval overlap rule: `validFrom < windowEnd AND validTo > now`
- PERM NOTAM handling with `isPermanent` flag and far-future sentinel (now + 10 years)
- Visibility state computation: `active_now`, `future_in_window`, `future_outside_window`, `expired`
- CNL (Cancellation) NOTAM filtering (excluded from results)
- Support for time window options: 6h, 12h, 24h, All
- Expired NOTAMs hidden by default (can be included with `includeExpired` flag)

### Files changed
- `backend/src/services/timeFilteringService.ts` (new file)
- `backend/src/__tests__/timeFiltering.test.ts` (new file)
- `FEATURES.md` (updated status from "planned" to "doing")

### Tests
- Tests added: `backend/src/__tests__/timeFiltering.test.ts`
- 16 test cases covering:
  - CNL NOTAM filtering
  - Interval overlap rule validation
  - PERM NOTAM handling
  - Edge cases around window boundaries
  - Visibility state computation for all states
  - Missing date handling
  - Expired NOTAM inclusion/exclusion
  - Different time window options (6h, 12h, 24h, All)
- All tests passing
- Run tests with: `npm test -- timeFiltering.test.ts`

### Notes for reviewer
- Implementation matches Dart reference exactly: `lib/providers/flight_provider.dart filterNotamsByTimeAndAirport()`
- The service provides two main functions:
  - `filterNotamsByTimeWindow()`: Returns filtered NOTAMs with visibility states
  - `filterNotams()`: Convenience function that returns only NOTAMs (without states)
- Visibility states are computed separately and can be used for UI display logic
- PERM NOTAMs are handled correctly with the `isPermanent` flag and validTo sentinel value
- The service is ready to be integrated into the briefings API endpoint when needed
- No breaking changes to existing code


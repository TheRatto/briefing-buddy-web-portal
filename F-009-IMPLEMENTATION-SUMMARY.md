## Feature F-009 – Implementation Summary

### What was implemented
- Floating filter bar component with time window selector (6h, 12h, 24h, All) and expired NOTAMs toggle
- Time filtering utility that matches backend implementation for consistency
- Visual emphasis on NOTAM items using color-coded borders and background tints based on visibility state:
  - Active NOTAMs: Amber (#ffa502)
  - Future NOTAMs in window: Orange (#ff6348)
  - Expired NOTAMs: Red (#ff4757)
  - Future NOTAMs outside window: Gray (#747d8c)
  - Permanent NOTAMs: Purple (#6c5ce7) with "PERM" label
- Filtering logic that hides/shows NOTAMs based on time window and expired toggle without data loss
- Integration of filtering into GroupedNotamsDisplay component with state management
- Comprehensive test coverage for time filtering utility and filter combinations

### Files changed
- `frontend/src/utils/timeFiltering.ts` (new) - Time filtering utility with visibility state computation
- `frontend/src/components/FilterBar.tsx` (new) - Floating filter bar component
- `frontend/src/components/GroupedNotamsDisplay.tsx` (modified) - Integrated filtering and visual emphasis
- `frontend/src/__tests__/timeFiltering.test.ts` (new) - Tests for time filtering utility
- `frontend/src/__tests__/groupedNotamsDisplay.test.tsx` (modified) - Added filter combination tests
- `FEATURES.md` (modified) - Updated F-009 status from "planned" to "doing"

### Tests
- Time filtering utility tests: 15 test cases covering time window filtering, visibility state computation, expired NOTAM handling, PERM NOTAM handling, and color mapping
- Filter combination tests: 4 test cases covering time window changes, expired toggle, filter combinations, and empty state handling
- Basic display tests updated to use relative dates (based on current time) instead of hardcoded dates, ensuring tests pass regardless of execution time
- Filter tests use `vi.useFakeTimers()` and `vi.setSystemTime()` for consistent date mocking
- Tests can be run with: `npm test` in the frontend directory
- All tests follow existing patterns and use Vitest with React Testing Library
- All tests pass consistently (fixed after initial review feedback)

### Notes for reviewer
- Time filtering logic matches backend implementation (backend/src/services/timeFilteringService.ts) for consistency
- Filter bar uses sticky positioning to remain visible while scrolling
- Visual emphasis uses subtle background tints (15% opacity) with colored left borders for clear but non-intrusive indication
- PERM NOTAMs are handled with special purple color and "PERM" label as specified in feature notes
- Filter state is managed locally in GroupedNotamsDisplay component (timeWindow defaults to "24h", showExpired defaults to false)
- All NOTAMs remain in memory - filtering only affects display, ensuring no data loss
- Color palette matches feature specification: active (amber), future (orange), expired (red), PERM (purple)
- Tests use relative dates and proper Date mocking (`vi.useFakeTimers()`) to ensure consistent behavior across test runs regardless of execution time


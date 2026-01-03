## Feature F-006 – Implementation Summary

### What was implemented
- Created NOTAM categorisation service with NotamGroup enum matching Dart implementation
- Implemented Q-code to group mapping (determineGroupFromQCode) preserving exact mappings from lib/models/notam.dart
- Implemented keyword-weight scoring fallback classification preserving weights from lib/services/notam_grouping_service.dart
- Implemented FIR NOTAM grouping via ID prefix and keywords matching lib/services/fir_notam_grouping_service.dart
- Integrated categorisation into parsing service - all parsed NOTAMs now have a group assigned
- Added notamId field to ParsedNotam interface for FIR NOTAM identification
- Each NOTAM is assigned exactly one group (airport or FIR)
- Group assignment uses Q-code first, then FIR ID pattern, then keyword scoring as fallback

### Files changed
- `backend/src/services/notamCategorisationService.ts` (new file) - Complete categorisation service with NotamGroup enum, Q-code mapping, keyword scoring, and FIR grouping
- `backend/src/services/notamParsingService.ts` - Updated ParsedNotam interface to include `group` and `notamId` fields, integrated categorisation into parsing flow
- `backend/src/__tests__/notamCategorisation.test.ts` (new file) - Comprehensive test suite with 37 tests covering Q-code mapping, keyword scoring, FIR grouping, and integration
- `backend/src/__tests__/notamParsing.test.ts` - Updated to verify new group and notamId fields are present
- `FEATURES.md` - Updated F-006 status from "planned" to "doing"

### Tests
- 37 tests in notamCategorisation.test.ts covering:
  - NotamGroup enum validation
  - Q-code to group mapping for all categories
  - Keyword-based classification fallback
  - FIR NOTAM identification and grouping
  - Priority and weight scoring
  - Integration with parsing service
- All existing parsing tests pass (17 tests)
- Run tests with: `npm test` in backend directory
- Run categorisation tests only: `npm test -- notamCategorisation.test.ts`

### Notes for reviewer
- Behaviour matches Dart reference implementation exactly:
  - Q-code mappings preserved from determineGroupFromQCode() in lib/models/notam.dart
  - Keyword weights and priorities preserved from _classifyByTextScoring() in lib/services/notam_grouping_service.dart
  - FIR grouping logic matches groupFIRNotam() in lib/services/fir_notam_grouping_service.dart
- NotamGroup enum is the single source of truth for group names (matches Dart enum)
- FIR NOTAM detection checks for specific prefixes (E, L, F, H, G, W) to distinguish from airport NOTAMs
- Keyword scoring uses phrase-first matching (longest keywords first) with word boundary matching
- The briefings route automatically includes group and notamId in responses since they're part of ParsedNotam interface
- All tests pass; rate limiting test failures in briefings.test.ts are pre-existing and unrelated to F-006


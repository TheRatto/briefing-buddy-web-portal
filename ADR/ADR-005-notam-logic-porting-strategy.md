# ADR-005: NOTAM Logic Porting Strategy

## Title
Port Dart NOTAM logic to TypeScript using test-driven approach with golden fixtures

## Status
Accepted

## Context

The BriefingBuddy Web Portal must match the behavior of existing Dart code in `lib/` exactly. FEATURES.md specifies:

- NOTAM parsing must match Dart implementation (F-005)
- NOTAM categorization must match Dart logic exactly, including:
  - Q-code to NotamGroup mapping from `lib/models/notam.dart` `determineGroupFromQCode()`
  - Keyword-based fallback classification from `lib/services/notam_grouping_service.dart` `_classifyByTextScoring()`
  - FIR NOTAM grouping from `lib/services/fir_notam_grouping_service.dart`
- Time window filtering must match `lib/providers/flight_provider.dart` `filterNotamsByTimeAndAirport()` exactly
- NotamGroup enum is the single source of truth for group names

The Dart code contains:
- Complex Q-code mapping logic
- Weighted keyword scoring algorithms
- Time interval overlap calculations
- PERM NOTAM handling (isPermanent flag + far-future sentinel)
- FIR prefix mappings and categorization rules

The project also contains JSON schema files in `rules/` directory:
- `qcode_mapping.schema.json`
- `keyword_weights.schema.json`
- `fir_prefix_mapping.schema.json`
- `time_window.schema.json`

These schemas suggest potential future extraction of rules, but the Dart code remains the authoritative source.

## Decision

We will port Dart NOTAM logic to TypeScript using a **test-driven approach with golden file comparisons**:

1. **Extract test fixtures from Dart code**: Create comprehensive test cases using real NOTAM examples and expected outputs from the Dart implementation.

2. **Port logic module-by-module**: Port each logical unit (Q-code mapping, keyword scoring, time filtering) as separate, testable modules.

3. **Golden file testing**: For each ported module, create golden test fixtures that:
   - Input: NOTAM data (raw text, parsed fields, etc.)
   - Expected output: Categorization results, filtered lists, etc.
   - Source: Generated from Dart code execution or manually verified against Dart output

4. **Behavioral equivalence verification**: Run TypeScript implementation against golden fixtures and verify exact match (same group assignments, same filtering results, same error handling).

5. **Code organization**: Organize ported logic as:
   - `src/services/notam/parser.ts` - ICAO field parsing
   - `src/services/notam/categorizer.ts` - Q-code and keyword-based categorization
   - `src/services/notam/fir-grouping.ts` - FIR NOTAM grouping
   - `src/services/notam/time-filter.ts` - Time window filtering
   - `src/models/notam.ts` - TypeScript types matching Dart model structure

6. **Type definitions**: Create TypeScript types that match Dart model structure (Notam, NotamGroup enum, etc.) to ensure structural compatibility.

7. **Rule extraction (future consideration)**: Consider extracting business rules to JSON configuration files (using existing schemas) after porting is complete, but only if it improves maintainability without changing behavior.

## Consequences

### Positive Consequences

1. **Behavioral guarantee**: Test fixtures ensure TypeScript implementation matches Dart exactly, catching regressions.

2. **Incremental porting**: Module-by-module approach allows porting and testing in isolation, reducing complexity.

3. **Documentation value**: Test fixtures serve as behavioral documentation, showing how the system handles various NOTAM inputs.

4. **Regression prevention**: Golden files prevent accidental behavioral changes during refactoring or optimization.

5. **Clear porting target**: Having explicit test cases makes the porting task unambiguous (clear success criteria).

6. **Maintainability**: Ported TypeScript code will be easier to maintain than Dart code for web developers.

### Negative Consequences

1. **Fixture creation overhead**: Creating comprehensive test fixtures requires time and effort to generate and verify.

2. **Ongoing synchronization risk**: If Dart code changes, fixtures may become outdated, requiring manual updates to both Dart tests and TypeScript fixtures.

3. **Translation errors**: Manual porting may introduce subtle bugs that pass tests but fail in edge cases not covered by fixtures.

4. **No automated verification**: Cannot automatically verify that TypeScript code matches Dart code without running both and comparing outputs (manual process).

5. **Duplicate maintenance**: Business logic exists in two languages; changes may require updates in both places.

### Trade-offs Accepted

1. **Manual porting over automated translation**: Accepting manual translation work for better control and understanding of the code, rather than attempting automated Dart-to-TypeScript conversion.

2. **Test fixtures over code comparison**: Using test-based verification rather than attempting to prove code equivalence mathematically.

3. **Behavioral matching over code structure matching**: Focusing on matching outputs rather than matching code structure, allowing optimization and refactoring in TypeScript.

4. **Fixed fixtures over dynamic comparison**: Using static test fixtures rather than running both Dart and TypeScript codebases in parallel for comparison (simpler but less dynamic).

## Alternatives Considered

### Alternative 1: Automated Dart-to-TypeScript Translation

**Description**: Use automated tooling to translate Dart code to TypeScript.

**Reasons for rejection**:
- No mature, reliable Dart-to-TypeScript translation tools
- Automated translation may produce unidiomatic TypeScript
- Complex logic (regex, string manipulation) may translate incorrectly
- Still requires extensive testing to verify correctness
- Less understanding of ported code

### Alternative 2: Execute Dart Code via Runtime (Deno, Node.js Dart runtime)

**Description**: Run Dart code directly from Node.js/TypeScript application.

**Reasons for rejection**:
- No mature Dart runtime for Node.js
- Adds runtime dependency on Dart
- Deployment complexity (requires Dart runtime environment)
- Performance overhead of cross-language calls
- Defeats purpose of using TypeScript for web portal

### Alternative 3: Extract Rules to JSON, Implement Logic in TypeScript

**Description**: Extract all business rules (Q-code mappings, keywords, weights) to JSON files, implement generic logic in TypeScript.

**Reasons for rejection**:
- Significant upfront work to extract rules from Dart code
- Risk of missing implicit logic embedded in code
- JSON schemas exist but are not populated with actual rules yet
- May change behavior if extraction is incomplete
- Can be done after porting as a refactoring step

### Alternative 4: Rewrite Logic from Scratch in TypeScript

**Description**: Reimplement NOTAM logic from specifications/documentation rather than porting from Dart.

**Reasons for rejection**:
- High risk of behavioral differences
- FEATURES.md explicitly requires matching Dart implementation
- Specifications may be incomplete or ambiguous
- Dart code is the reference implementation
- Would require extensive testing against Dart anyway

## Notes

- Test framework: Jest or Vitest for TypeScript unit tests
- Fixture format: JSON files in `tests/fixtures/notam/` directory
- Golden file naming: `{module}-{test-case}.golden.json`
- Porting order:
  1. Models and types (Notam, NotamGroup enum)
  2. Q-code mapping logic
  3. Keyword scoring logic
  4. FIR grouping logic
  5. Time filtering logic
  6. Integration tests for end-to-end parsing and categorization
- Verification process: TypeScript tests must pass 100% of golden fixtures before considering porting complete
- Documentation: Ported code should include comments referencing source Dart files for traceability
- Future rule extraction: After porting is verified, consider extracting rules to JSON configuration files to reduce code duplication
- Reference documentation: `BriefingBuddy_NOTAM_Logic_Agent_Digest.md` may contain additional context for NOTAM logic

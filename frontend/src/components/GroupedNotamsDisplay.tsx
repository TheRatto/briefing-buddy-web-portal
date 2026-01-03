import { useState } from "react";
import {
  ParsedNotam,
  NotamGroup,
} from "../types/notam";
import {
  groupNotamsByLocationAndCategory,
  getCategoryLabel,
  getSortedLocations,
  getSortedCategories,
} from "../utils/notamGrouping";
import {
  TimeWindow,
  filterNotamsByTimeWindow,
  FilteredNotamResult,
  getVisibilityColor,
  NotamVisibilityState,
} from "../utils/timeFiltering";
import FilterBar from "./FilterBar";

interface GroupedNotamsDisplayProps {
  notams: ParsedNotam[];
}

/**
 * Component to display NOTAMs grouped by location and category
 * 
 * Structure: Location -> Category -> NOTAMs
 * Each NOTAM displays its raw text in a readable, selectable format
 * React's default escaping prevents XSS attacks
 * Includes filtering by time window and visual emphasis by time state
 */
export default function GroupedNotamsDisplay({
  notams,
}: GroupedNotamsDisplayProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");
  const [showExpired, setShowExpired] = useState(false);

  if (notams.length === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#666",
        }}
      >
        No NOTAMs to display
      </div>
    );
  }

  // Filter NOTAMs by time window
  // Explicitly pass current time to ensure consistent behavior with date mocking in tests
  const filteredResults = filterNotamsByTimeWindow(
    notams,
    timeWindow,
    showExpired,
    new Date()
  );

  // Extract filtered NOTAMs
  const filteredNotams = filteredResults.map((result) => result.notam);

  // Create a map of NOTAM ID to visibility state for quick lookup
  const visibilityMap = new Map<string, FilteredNotamResult>();
  filteredResults.forEach((result) => {
    visibilityMap.set(result.notam.notamId, result);
  });

  if (filteredNotams.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "1.5rem",
        }}
      >
        <FilterBar
          timeWindow={timeWindow}
          onTimeWindowChange={setTimeWindow}
          showExpired={showExpired}
          onShowExpiredChange={setShowExpired}
        />
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#666",
            backgroundColor: "white",
            borderRadius: "8px",
          }}
        >
          No NOTAMs match the current filter settings
        </div>
      </div>
    );
  }

  const grouped = groupNotamsByLocationAndCategory(filteredNotams);
  const locations = getSortedLocations(grouped);

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        padding: "1.5rem",
      }}
    >
      <FilterBar
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        showExpired={showExpired}
        onShowExpiredChange={setShowExpired}
      />
      {locations.map((location) => (
        <LocationGroup
          key={location}
          location={location}
          locationCategories={grouped[location]}
          visibilityMap={visibilityMap}
        />
      ))}
    </div>
  );
}

interface LocationGroupProps {
  location: string;
  locationCategories: Partial<Record<NotamGroup, ParsedNotam[]>>;
  visibilityMap: Map<string, FilteredNotamResult>;
}

/**
 * Component to display NOTAMs for a single location
 */
function LocationGroup({
  location,
  locationCategories,
  visibilityMap,
}: LocationGroupProps) {
  const categories = getSortedCategories(locationCategories);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        marginBottom: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      {/* Location Header */}
      <div
        style={{
          padding: "1rem 1.5rem",
          backgroundColor: "#f8f9fa",
          borderBottom: "2px solid #dee2e6",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#212529",
          }}
        >
          {location}
        </h2>
      </div>

      {/* Categories */}
      <div>
        {categories.map((category) => {
          const notamsInCategory = locationCategories[category]!;
          return (
            <CategoryGroup
              key={category}
              category={category}
              notams={notamsInCategory}
              visibilityMap={visibilityMap}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CategoryGroupProps {
  category: NotamGroup;
  notams: ParsedNotam[];
  visibilityMap: Map<string, FilteredNotamResult>;
}

/**
 * Component to display NOTAMs for a single category
 */
function CategoryGroup({
  category,
  notams,
  visibilityMap,
}: CategoryGroupProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid #e9ecef",
      }}
    >
      {/* Category Header */}
      <div
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
            color: "#495057",
          }}
        >
          {getCategoryLabel(category)}
          <span
            style={{
              marginLeft: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 400,
              color: "#6c757d",
            }}
          >
            ({notams.length})
          </span>
        </h3>
      </div>

      {/* NOTAMs */}
      <div>
        {notams.map((notam, index) => {
          const visibilityResult = visibilityMap.get(notam.notamId);
          return (
            <NotamItem
              key={`${notam.notamId}-${index}`}
              notam={notam}
              visibilityState={visibilityResult?.visibilityState}
            />
          );
        })}
      </div>
    </div>
  );
}

interface NotamItemProps {
  notam: ParsedNotam;
  visibilityState?: NotamVisibilityState;
}

/**
 * Component to display a single NOTAM
 * 
 * Displays raw text in a readable, selectable format.
 * React's default HTML escaping prevents XSS vulnerabilities.
 * Includes visual emphasis based on time state and category.
 */
function NotamItem({ notam, visibilityState }: NotamItemProps) {
  // Get color for visibility state
  const borderColor = visibilityState
    ? getVisibilityColor(visibilityState, notam.isPermanent)
    : "#dee2e6";

  // Use a subtle background tint for emphasis
  const backgroundColor = visibilityState
    ? getVisibilityColor(visibilityState, notam.isPermanent) + "15" // Add 15% opacity
    : "#f8f9fa";

  return (
    <div
      style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid #e9ecef",
        borderLeft: `4px solid ${borderColor}`,
        backgroundColor: backgroundColor,
      }}
    >
      {/* NOTAM ID and Metadata */}
      <div
        style={{
          marginBottom: "0.75rem",
          fontSize: "0.875rem",
          color: "#6c757d",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.25rem",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 600,
            }}
          >
            {notam.notamId}
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {notam.isPermanent && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#6c5ce7",
                  textTransform: "uppercase",
                }}
              >
                PERM
              </span>
            )}
            {notam.qCode && (
              <span
                style={{
                  fontFamily: "monospace",
                  color: "#495057",
                }}
              >
                {notam.qCode}
              </span>
            )}
          </div>
        </div>
        {notam.warnings.length > 0 && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "4px",
              fontSize: "0.8125rem",
            }}
          >
            <strong>Warnings:</strong> {notam.warnings.join(", ")}
          </div>
        )}
      </div>

      {/* Raw NOTAM Text */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "0.875rem",
          lineHeight: "1.6",
          color: "#212529",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          backgroundColor: "#ffffff",
          padding: "0.75rem",
          borderRadius: "4px",
          border: "1px solid #dee2e6",
        }}
      >
        {notam.rawText}
      </div>

      {/* Additional Fields (if available) */}
      {(notam.fieldE || notam.fieldF || notam.fieldG) && (
        <div
          style={{
            marginTop: "0.75rem",
            fontSize: "0.8125rem",
            color: "#6c757d",
          }}
        >
          {notam.fieldE && (
            <div style={{ marginBottom: "0.25rem" }}>
              <strong>Field E:</strong> {notam.fieldE}
            </div>
          )}
          {notam.fieldF && (
            <div style={{ marginBottom: "0.25rem" }}>
              <strong>Field F:</strong> {notam.fieldF}
            </div>
          )}
          {notam.fieldG && (
            <div>
              <strong>Field G:</strong> {notam.fieldG}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


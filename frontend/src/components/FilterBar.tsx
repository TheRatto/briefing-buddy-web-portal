import { TimeWindow } from "../utils/timeFiltering";

interface FilterBarProps {
  timeWindow: TimeWindow;
  onTimeWindowChange: (window: TimeWindow) => void;
  showExpired: boolean;
  onShowExpiredChange: (show: boolean) => void;
}

/**
 * Floating filter bar component
 * Provides time window selection and expired NOTAM toggle
 */
export default function FilterBar({
  timeWindow,
  onTimeWindowChange,
  showExpired,
  onShowExpiredChange,
}: FilterBarProps) {
  const timeWindowOptions: TimeWindow[] = ["6h", "12h", "24h", "All"];

  return (
    <div
      style={{
        position: "sticky",
        top: "1rem",
        zIndex: 100,
        backgroundColor: "white",
        padding: "1rem 1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "1.5rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Time Window Selector */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#495057",
            marginRight: "0.5rem",
          }}
        >
          Time Window:
        </label>
        {timeWindowOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onTimeWindowChange(option)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: timeWindow === option ? "#007bff" : "#f8f9fa",
              color: timeWindow === option ? "white" : "#495057",
              border: `1px solid ${timeWindow === option ? "#007bff" : "#dee2e6"}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: timeWindow === option ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {option === "All" ? "All" : `${option}`}
          </button>
        ))}
      </div>

      {/* Expired NOTAMs Toggle */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <label
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#495057",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <input
            type="checkbox"
            checked={showExpired}
            onChange={(e) => onShowExpiredChange(e.target.checked)}
            style={{
              width: "1.125rem",
              height: "1.125rem",
              cursor: "pointer",
            }}
          />
          Show Expired
        </label>
      </div>
    </div>
  );
}


import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ParsedNotam } from "../types/notam";
import GroupedNotamsDisplay from "../components/GroupedNotamsDisplay";

interface BriefingData {
  id: string;
  userId: string;
  rawText: string;
  pdfFileId: string | null;
  createdAt: string;
  updatedAt: string;
  notams: ParsedNotam[];
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    const fetchBriefing = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3005";
      try {
        const response = await fetch(`${apiBaseUrl}/api/share/${token}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to load briefing" }));
          throw new Error(errorData.error || "Failed to load briefing");
        }

        const data = await response.json();
        setBriefing(data.briefing);
        setExpiresAt(data.expiresAt);
      } catch (error) {
        console.error("Error loading shared briefing:", error);
        setError(error instanceof Error ? error.message : "Failed to load briefing");
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [token]);

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <p>Loading shared briefing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "2rem",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h1 style={{ color: "#dc3545", marginTop: 0 }}>Error</h1>
          <p>{error}</p>
          <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "1rem" }}>
            This share link may have expired or is invalid.
          </p>
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <p>Briefing not found</p>
      </div>
    );
  }

  // Convert database NOTAM format to frontend ParsedNotam format
  const parsedNotams: ParsedNotam[] = briefing.notams.map((notam: any) => ({
    qCode: notam.qCode,
    fieldA: notam.fieldA || "",
    fieldB: notam.fieldB || "",
    fieldC: notam.fieldC || "",
    fieldD: notam.fieldD || "",
    fieldE: notam.fieldE || "",
    fieldF: notam.fieldF || "",
    fieldG: notam.fieldG || "",
    validFrom: notam.validFrom ? new Date(notam.validFrom).toISOString() : "",
    validTo: notam.validTo ? new Date(notam.validTo).toISOString() : "",
    isPermanent: notam.isPermanent || false,
    rawText: notam.rawText,
    warnings: notam.warnings || [],
    group: notam.groupName as any,
    notamId: notam.notamId,
  }));

  return (
    <div
      style={{
        padding: "2rem",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 2rem",
          padding: "1.5rem",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Shared Briefing</h1>
        <p style={{ color: "#666", marginBottom: 0 }}>
          This briefing was shared with you.
          {expiresAt && (
            <> Link expires: {new Date(expiresAt).toLocaleString()}</>
          )}
        </p>
      </div>

      {/* Grouped NOTAMs Display */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <GroupedNotamsDisplay notams={parsedNotams} />
      </div>
    </div>
  );
}


import { useState, useRef } from "react";
import { useSession, signOut } from "../auth";
import { useNavigate } from "react-router-dom";
import { ParsedNotam } from "../types/notam";
import GroupedNotamsDisplay from "../components/GroupedNotamsDisplay";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type InputMode = "pdf" | "paste";

export default function HomePage() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [parseResult, setParseResult] = useState<{ notamsCount: number; warningsCount: number } | null>(null);
  const [parsedNotams, setParsedNotams] = useState<ParsedNotam[]>([]);
  const [briefingId, setBriefingId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<{ token: string; shareUrl: string; expiresAt: string } | null>(null);
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleModeToggle = () => {
    setInputMode(inputMode === "pdf" ? "paste" : "pdf");
    setSelectedFile(null);
    setPastedText("");
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`;
    }
    if (file.type !== "application/pdf") {
      return "Only PDF files are allowed";
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileError(null);
      return;
    }

    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (inputMode !== "pdf") return;

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = e.dataTransfer.files;
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidInput()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setParseResult(null);
    setParsedNotams([]);
    
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3005";
    
    try {
      if (inputMode === "pdf" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const response = await fetch(`${apiBaseUrl}/api/briefings/upload`, {
          method: "POST",
          credentials: "include", // Include cookies for authentication
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to upload PDF" }));
          throw new Error(errorData.error || "Failed to upload PDF");
        }
        
        const data = await response.json();
        console.log("PDF uploaded successfully:", data);
        setParseResult({
          notamsCount: data.notams?.length || 0,
          warningsCount: data.warnings?.length || 0,
        });
        // Store parsed NOTAMs for display
        if (data.notams && Array.isArray(data.notams)) {
          setParsedNotams(data.notams);
        }
        // Store briefing ID if available (authenticated users)
        if (data.briefingId) {
          setBriefingId(data.briefingId);
        }
        setSubmitSuccess(true);
      } else if (inputMode === "paste" && pastedText.trim()) {
        const response = await fetch(`${apiBaseUrl}/api/briefings/paste`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for authentication
          body: JSON.stringify({ text: pastedText }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to submit text" }));
          throw new Error(errorData.error || "Failed to submit text");
        }
        
        const data = await response.json();
        console.log("Text submitted successfully:", data);
        setParseResult({
          notamsCount: data.notams?.length || 0,
          warningsCount: data.warnings?.length || 0,
        });
        // Store parsed NOTAMs for display
        if (data.notams && Array.isArray(data.notams)) {
          setParsedNotams(data.notams);
        }
        // Store briefing ID if available (authenticated users)
        if (data.briefingId) {
          setBriefingId(data.briefingId);
        }
        setSubmitSuccess(true);
      }
    } catch (error) {
      console.error("Error submitting briefing:", error);
      setSubmitError(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidInput = (): boolean => {
    if (inputMode === "pdf") {
      return selectedFile !== null && fileError === null;
    } else {
      return pastedText.trim().length > 0;
    }
  };

  const handleExport = async (format: "raw" | "categorized" | "summary") => {
    if (!briefingId) {
      setSubmitError("Cannot export: Briefing not saved. Please sign in to save and export briefings.");
      return;
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3005";
    try {
      const response = await fetch(`${apiBaseUrl}/api/briefings/${briefingId}/export?format=${format}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to export briefing" }));
        throw new Error(errorData.error || "Failed to export briefing");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `briefing-${format}-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting briefing:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to export briefing");
    }
  };

  const handleGenerateShareLink = async () => {
    if (!briefingId) {
      setSubmitError("Cannot generate share link: Briefing not saved. Please sign in to save and share briefings.");
      return;
    }

    setIsGeneratingShareLink(true);
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3005";
    try {
      const response = await fetch(`${apiBaseUrl}/api/briefings/${briefingId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ expiresInDays: 7 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate share link" }));
        throw new Error(errorData.error || "Failed to generate share link");
      }

      const data = await response.json();
      const fullShareUrl = `${window.location.origin}${data.shareUrl}`;
      setShareLink({
        token: data.token,
        shareUrl: fullShareUrl,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      console.error("Error generating share link:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to generate share link");
    } finally {
      setIsGeneratingShareLink(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink.shareUrl).then(() => {
        // Show temporary success message
        const originalError = submitError;
        setSubmitError(null);
        setTimeout(() => {
          setSubmitError(originalError);
        }, 2000);
      });
    }
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>BriefingBuddy Web Portal</h1>
        <div>
          {session ? (
            <>
              <span style={{ marginRight: "1rem" }}>
                {session.user?.email}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <div>
              <span style={{ marginRight: "1rem" }}>Anonymous User</span>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "0.5rem",
                }}
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          Submit Briefing
        </h2>

        {/* Mode Toggle */}
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <button
            type="button"
            onClick={handleModeToggle}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: inputMode === "pdf" ? "#007bff" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "0.5rem",
            }}
          >
            PDF Upload
          </button>
          <button
            type="button"
            onClick={handleModeToggle}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: inputMode === "paste" ? "#007bff" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Paste Text
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* PDF Upload Mode */}
          {inputMode === "pdf" && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: fileError
                    ? "2px dashed #dc3545"
                    : selectedFile
                    ? "2px dashed #28a745"
                    : "2px dashed #ddd",
                  borderRadius: "8px",
                  padding: "3rem",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: fileError
                    ? "#fee"
                    : selectedFile
                    ? "#efe"
                    : "#f9f9f9",
                  transition: "all 0.2s",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                {selectedFile ? (
                  <div>
                    <p style={{ marginBottom: "0.5rem", color: "#28a745" }}>
                      ✓ {selectedFile.name}
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "#666" }}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                      Drag and drop a PDF file here
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "#666" }}>
                      or click to browse
                    </p>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#999",
                        marginTop: "0.5rem",
                      }}
                    >
                      Maximum file size: {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                )}
              </div>
              {fileError && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#fee",
                    color: "#c33",
                    borderRadius: "4px",
                  }}
                >
                  {fileError}
                </div>
              )}
            </div>
          )}

          {/* Paste Mode */}
          {inputMode === "paste" && (
            <div>
              <label
                htmlFor="notam-text"
                style={{ display: "block", marginBottom: "0.5rem" }}
              >
                Paste NOTAM Text
              </label>
              <textarea
                id="notam-text"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your ICAO NOTAM text here..."
                rows={15}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValidInput() || isSubmitting}
            style={{
              width: "100%",
              marginTop: "1.5rem",
              padding: "0.75rem",
              backgroundColor: isValidInput() ? "#007bff" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isValidInput() && !isSubmitting ? "pointer" : "not-allowed",
              opacity: isValidInput() && !isSubmitting ? 1 : 0.6,
              fontSize: "1rem",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Briefing"}
          </button>

          {/* Error Message */}
          {submitError && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#fee",
                color: "#c33",
                borderRadius: "4px",
              }}
            >
              {submitError}
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#efe",
                color: "#28a745",
                borderRadius: "4px",
              }}
            >
              <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
                Briefing submitted successfully! NOTAMs parsed.
              </div>
              {parseResult && (
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  {parseResult.notamsCount > 0 ? (
                    <>
                      Parsed {parseResult.notamsCount} NOTAM{parseResult.notamsCount !== 1 ? "s" : ""}
                      {parseResult.warningsCount > 0 && (
                        <> with {parseResult.warningsCount} warning{parseResult.warningsCount !== 1 ? "s" : ""}</>
                      )}
                    </>
                  ) : (
                    <>No NOTAMs found in the provided text.</>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Info Text */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.9rem",
            color: "#666",
            textAlign: "center",
          }}
        >
          {session
            ? "Your briefings will be saved to your account."
            : "Anonymous users can submit briefings but they will not be saved. Sign up to save your briefings."}
        </p>
      </div>

      {/* Export and Share Controls */}
      {submitSuccess && parsedNotams.length > 0 && (
        <div
          style={{
            maxWidth: "1200px",
            margin: "2rem auto 0",
            padding: "1rem",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Export & Share</h2>
          
          {/* Export Buttons */}
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Export Briefing</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => handleExport("raw")}
                disabled={!briefingId}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: briefingId ? "#007bff" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: briefingId ? "pointer" : "not-allowed",
                  opacity: briefingId ? 1 : 0.6,
                }}
              >
                Export Raw
              </button>
              <button
                onClick={() => handleExport("categorized")}
                disabled={!briefingId}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: briefingId ? "#007bff" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: briefingId ? "pointer" : "not-allowed",
                  opacity: briefingId ? 1 : 0.6,
                }}
              >
                Export Categorized
              </button>
              <button
                onClick={() => handleExport("summary")}
                disabled={!briefingId}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: briefingId ? "#007bff" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: briefingId ? "pointer" : "not-allowed",
                  opacity: briefingId ? 1 : 0.6,
                }}
              >
                Export Summary
              </button>
            </div>
            {!briefingId && (
              <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.5rem" }}>
                Sign in to save and export briefings.
              </p>
            )}
          </div>

          {/* Share Link Section */}
          {session && (
            <div>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Share Briefing</h3>
              {!shareLink ? (
                <button
                  onClick={handleGenerateShareLink}
                  disabled={!briefingId || isGeneratingShareLink}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: briefingId && !isGeneratingShareLink ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: briefingId && !isGeneratingShareLink ? "pointer" : "not-allowed",
                    opacity: briefingId && !isGeneratingShareLink ? 1 : 0.6,
                  }}
                >
                  {isGeneratingShareLink ? "Generating..." : "Generate Share Link"}
                </button>
              ) : (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <p style={{ marginTop: 0, marginBottom: "0.5rem", fontWeight: 600 }}>
                    Share Link (expires: {new Date(shareLink.expiresAt).toLocaleString()})
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      type="text"
                      value={shareLink.shareUrl}
                      readOnly
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                      }}
                    />
                    <button
                      onClick={handleCopyShareLink}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grouped NOTAMs Display */}
      {submitSuccess && parsedNotams.length > 0 && (
        <div
          style={{
            maxWidth: "1200px",
            margin: "2rem auto 0",
          }}
        >
          <GroupedNotamsDisplay notams={parsedNotams} />
        </div>
      )}
    </div>
  );
}

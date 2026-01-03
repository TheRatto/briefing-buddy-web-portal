import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";

// Mock auth module
vi.mock("../auth", () => ({
  useSession: vi.fn(() => ({ data: null })),
  signOut: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("HomePage - Briefing Input", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PDF Upload Mode", () => {
    it("should render PDF upload zone", () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      expect(
        screen.getByText(/drag and drop a pdf file here/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/maximum file size: 10mb/i)).toBeInTheDocument();
    });

    it("should accept valid PDF file", async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const file = new File(["test pdf content"], "test.pdf", {
        type: "application/pdf",
      });

      // Mock FileList
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: false,
      });

      // Trigger the onChange event
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/✓ test.pdf/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", {
        name: /submit briefing/i,
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("should reject non-PDF files", async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      // Mock FileList
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: false,
      });

      // Trigger the onChange event
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(
          screen.getByText(/only pdf files are allowed/i)
        ).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", {
        name: /submit briefing/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should reject files exceeding size limit", async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      // Create a file larger than 10MB (11MB)
      const file = new File(["x"], "large.pdf", {
        type: "application/pdf",
      });

      // Mock file.size to be 11MB
      Object.defineProperty(file, "size", {
        value: 11 * 1024 * 1024,
        writable: false,
        configurable: true,
      });

      // Mock FileList
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: false,
      });

      // Trigger the onChange event
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(
          screen.getByText(/file size exceeds 10mb limit/i)
        ).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", {
        name: /submit briefing/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Paste Mode", () => {
    it("should switch to paste mode when toggle is clicked", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const pasteButton = screen.getByRole("button", { name: /paste text/i });
      await user.click(pasteButton);

      expect(
        screen.getByLabelText(/paste notam text/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/drag and drop a pdf file here/i)
      ).not.toBeInTheDocument();
    });

    it("should accept pasted NOTAM text", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // Switch to paste mode
      const pasteButton = screen.getByRole("button", { name: /paste text/i });
      await user.click(pasteButton);

      const textarea = screen.getByLabelText(/paste notam text/i);
      const notamText = "A1234/24 NOTAMN\nQ) YMMM/QFAAH/IV/NBO/A/000/999/2714S15302E005\nA) YBBN";

      await user.type(textarea, notamText);

      const submitButton = screen.getByRole("button", {
        name: /submit briefing/i,
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("should disable submit when paste mode textarea is empty", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // Switch to paste mode
      const pasteButton = screen.getByRole("button", { name: /paste text/i });
      await user.click(pasteButton);

      const submitButton = screen.getByRole("button", {
        name: /submit briefing/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Mode Toggle", () => {
    it("should only show one input mode at a time", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // Initially PDF mode
      expect(
        screen.getByText(/drag and drop a pdf file here/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/paste notam text/i)
      ).not.toBeInTheDocument();

      // Switch to paste mode
      const pasteButton = screen.getByRole("button", { name: /paste text/i });
      await user.click(pasteButton);

      expect(
        screen.queryByText(/drag and drop a pdf file here/i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByLabelText(/paste notam text/i)
      ).toBeInTheDocument();

      // Switch back to PDF mode
      const pdfButton = screen.getByRole("button", { name: /pdf upload/i });
      await user.click(pdfButton);

      expect(
        screen.getByText(/drag and drop a pdf file here/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/paste notam text/i)
      ).not.toBeInTheDocument();
    });

    it("should clear input when switching modes", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // Upload a file in PDF mode
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["test"], "test.pdf", {
        type: "application/pdf",
      });
      
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText(/✓ test.pdf/i)).toBeInTheDocument();
      });

      // Switch to paste mode
      const pasteButton = screen.getByRole("button", { name: /paste text/i });
      await user.click(pasteButton);

      // Switch back to PDF mode
      const pdfButton = screen.getByRole("button", { name: /pdf upload/i });
      await user.click(pdfButton);

      // File should be cleared
      expect(
        screen.queryByText(/✓ test.pdf/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Submit Button", () => {
    it("should be disabled when no valid input is present", () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole("button", {
        name: /submit briefing/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should be enabled when valid PDF is selected", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["test"], "test.pdf", {
        type: "application/pdf",
      });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByText(/✓ test.pdf/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", {
        name: /submit briefing/i,
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("should be enabled when valid text is pasted", async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const pasteButton = screen.getByRole("button", { name: /paste text/i });
      await user.click(pasteButton);

      const textarea = screen.getByLabelText(/paste notam text/i);
      await user.type(textarea, "NOTAM text");

      const submitButton = screen.getByRole("button", {
        name: /submit briefing/i,
      });
      expect(submitButton).not.toBeDisabled();
    });
  });
});


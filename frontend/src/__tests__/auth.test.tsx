import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SignupPage from "../pages/SignupPage";
import LoginPage from "../pages/LoginPage";

describe("Authentication UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Signup Page", () => {
    it("should render signup form", () => {
      render(
        <BrowserRouter>
          <SignupPage />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("should enforce minimum password length", async () => {
      render(
        <BrowserRouter>
          <SignupPage />
        </BrowserRouter>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute("minLength", "8");
    });
  });

  describe("Login Page", () => {
    it("should render login form", () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });
});


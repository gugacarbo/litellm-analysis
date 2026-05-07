import { render, screen } from "@testing-library/react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { describe, expect, it, vi } from "vitest";
import { PageLayout } from "../page-layout";

vi.mock("./card", () => ({
  Card: ({ children, className }) =>
    _jsx("div", {
      "data-testid": "filter-card",
      className: className,
      children: children,
    }),
}));
describe("PageLayout", () => {
  describe("Title rendering", () => {
    it("renders title correctly", () => {
      render(_jsx(PageLayout, { title: "Test Page" }));
      expect(screen.getByText("Test Page")).toBeInTheDocument();
    });
    it("renders title as h1 heading", () => {
      render(_jsx(PageLayout, { title: "Dashboard" }));
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Dashboard");
    });
  });
  describe("Subtitle rendering", () => {
    it("renders subtitle when provided", () => {
      render(_jsx(PageLayout, { title: "Test", subtitle: "Test subtitle" }));
      expect(screen.getByText("Test subtitle")).toBeInTheDocument();
    });
    it("does not render subtitle when not provided", () => {
      render(_jsx(PageLayout, { title: "Test" }));
      const subtitle = screen.queryByText(/subtitle/i);
      expect(subtitle).not.toBeInTheDocument();
    });
  });
  describe("Filters visibility", () => {
    it("shows filters by default", () => {
      render(
        _jsx(PageLayout, {
          title: "Test",
          filters: _jsx("div", { children: "Filter Content" }),
        }),
      );
      expect(screen.getByText("Filter Content")).toBeInTheDocument();
    });
    it("shows filters when showFilters is true", () => {
      render(
        _jsx(PageLayout, {
          title: "Test",
          showFilters: true,
          filters: _jsx("div", { children: "Filter Content" }),
        }),
      );
      expect(screen.getByText("Filter Content")).toBeInTheDocument();
    });
    it("hides filters when showFilters is false", () => {
      render(
        _jsx(PageLayout, {
          title: "Test",
          showFilters: false,
          filters: _jsx("div", { children: "Filter Content" }),
        }),
      );
      expect(screen.queryByText("Filter Content")).not.toBeInTheDocument();
    });
    it("does not render filter card when filters prop is not provided", () => {
      render(_jsx(PageLayout, { title: "Test" }));
      expect(screen.queryByTestId("filter-card")).not.toBeInTheDocument();
    });
  });
  describe("Buttons slot", () => {
    it("renders buttons when provided", () => {
      render(
        _jsx(PageLayout, {
          title: "Test",
          buttons: _jsx("button", { type: "button", children: "Action" }),
        }),
      );
      expect(
        screen.getByRole("button", { name: "Action" }),
      ).toBeInTheDocument();
    });
    it("does not render buttons container when not provided", () => {
      render(_jsx(PageLayout, { title: "Test" }));
      const buttons = screen.queryByRole("button");
      expect(buttons).not.toBeInTheDocument();
    });
    it("renders multiple buttons", () => {
      render(
        _jsx(PageLayout, {
          title: "Test",
          buttons: _jsxs(_Fragment, {
            children: [
              _jsx("button", { type: "button", children: "Button 1" }),
              _jsx("button", { type: "button", children: "Button 2" }),
            ],
          }),
        }),
      );
      expect(screen.getByText("Button 1")).toBeInTheDocument();
      expect(screen.getByText("Button 2")).toBeInTheDocument();
    });
  });
  describe("Variant styling", () => {
    it('applies flex classes when variant is "flex"', () => {
      const { container } = render(
        _jsx(PageLayout, { title: "Test", variant: "flex" }),
      );
      expect(container.firstChild).toHaveClass("flex", "flex-col", "gap-6");
    });
    it("does not apply flex classes for default variant", () => {
      const { container } = render(
        _jsx(PageLayout, { title: "Test", variant: "default" }),
      );
      expect(container.firstChild).not.toHaveClass("flex", "flex-col", "gap-6");
    });
    it("defaults to default variant", () => {
      const { container } = render(_jsx(PageLayout, { title: "Test" }));
      expect(container.firstChild).not.toHaveClass("flex", "flex-col", "gap-6");
    });
  });
  describe("Children rendering", () => {
    it("renders children when provided", () => {
      render(
        _jsx(PageLayout, {
          title: "Test",
          children: _jsx("div", { children: "Child Content" }),
        }),
      );
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });
    it("does not break when children is not provided", () => {
      render(_jsx(PageLayout, { title: "Test" }));
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });
});

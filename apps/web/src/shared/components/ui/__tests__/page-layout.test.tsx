import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PageLayout } from "../page-layout";

vi.mock("./card", () => ({
  Card: ({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) => (
    <div data-testid="filter-card" className={className}>
      {children}
    </div>
  ),
}));

describe("PageLayout", () => {
  describe("Title rendering", () => {
    it("renders title correctly", () => {
      render(<PageLayout title="Test Page" />);
      expect(screen.getByText("Test Page")).toBeInTheDocument();
    });

    it("renders title as h1 heading", () => {
      render(<PageLayout title="Dashboard" />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Dashboard");
    });
  });

  describe("Subtitle rendering", () => {
    it("renders subtitle when provided", () => {
      render(<PageLayout title="Test" subtitle="Test subtitle" />);
      expect(screen.getByText("Test subtitle")).toBeInTheDocument();
    });

    it("does not render subtitle when not provided", () => {
      render(<PageLayout title="Test" />);
      const subtitle = screen.queryByText(/subtitle/i);
      expect(subtitle).not.toBeInTheDocument();
    });
  });

  describe("Filters visibility", () => {
    it("shows filters by default", () => {
      render(<PageLayout title="Test" filters={<div>Filter Content</div>} />);
      expect(screen.getByText("Filter Content")).toBeInTheDocument();
    });

    it("shows filters when showFilters is true", () => {
      render(
        <PageLayout
          title="Test"
          showFilters={true}
          filters={<div>Filter Content</div>}
        />,
      );
      expect(screen.getByText("Filter Content")).toBeInTheDocument();
    });

    it("hides filters when showFilters is false", () => {
      render(
        <PageLayout
          title="Test"
          showFilters={false}
          filters={<div>Filter Content</div>}
        />,
      );
      expect(screen.queryByText("Filter Content")).not.toBeInTheDocument();
    });

    it("does not render filter card when filters prop is not provided", () => {
      render(<PageLayout title="Test" />);
      expect(screen.queryByTestId("filter-card")).not.toBeInTheDocument();
    });
  });

  describe("Buttons slot", () => {
    it("renders buttons when provided", () => {
      render(
        <PageLayout
          title="Test"
          buttons={<button type="button">Action</button>}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Action" }),
      ).toBeInTheDocument();
    });

    it("does not render buttons container when not provided", () => {
      render(<PageLayout title="Test" />);
      const buttons = screen.queryByRole("button");
      expect(buttons).not.toBeInTheDocument();
    });

    it("renders multiple buttons", () => {
      render(
        <PageLayout
          title="Test"
          buttons={
            <>
              <button type="button">Button 1</button>
              <button type="button">Button 2</button>
            </>
          }
        />,
      );
      expect(screen.getByText("Button 1")).toBeInTheDocument();
      expect(screen.getByText("Button 2")).toBeInTheDocument();
    });
  });

  describe("Variant styling", () => {
    it('applies flex classes when variant is "flex"', () => {
      const { container } = render(<PageLayout title="Test" variant="flex" />);
      expect(container.firstChild).toHaveClass("flex", "flex-col", "gap-3");
    });

    it("does not apply flex classes for default variant", () => {
      const { container } = render(
        <PageLayout title="Test" variant="default" />,
      );
      expect(container.firstChild).not.toHaveClass("flex", "flex-col", "gap-6");
    });

    it("defaults to default variant", () => {
      const { container } = render(<PageLayout title="Test" />);
      expect(container.firstChild).not.toHaveClass("flex", "flex-col", "gap-6");
    });
  });

  describe("Children rendering", () => {
    it("renders children when provided", () => {
      render(
        <PageLayout title="Test">
          <div>Child Content</div>
        </PageLayout>,
      );
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });

    it("does not break when children is not provided", () => {
      render(<PageLayout title="Test" />);
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });
});

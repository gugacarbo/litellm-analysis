import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { FilterProvider } from "../../../contexts/filter-context";
import { PageLayout } from "../../layout/page-layout/page-layout";

vi.mock("@tanstack/react-query", () => ({
  useIsFetching: () => 0,
}));

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

function wrapper({ children }: { children: ReactNode }) {
  return <FilterProvider>{children}</FilterProvider>;
}

describe("PageLayout", () => {
  describe("Title rendering", () => {
    it("renders title correctly", () => {
      render(<PageLayout title="Test Page" />, { wrapper });
      expect(screen.getByText("Test Page")).toBeInTheDocument();
    });

    it("renders title as h1 heading", () => {
      render(<PageLayout title="Dashboard" />, { wrapper });
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Dashboard");
    });
  });

  describe("Subtitle rendering", () => {
    it("renders subtitle when provided", () => {
      render(<PageLayout title="Test" subtitle="Test subtitle" />, {
        wrapper,
      });
      expect(screen.getByText("Test subtitle")).toBeInTheDocument();
    });

    it("does not render subtitle when not provided", () => {
      render(<PageLayout title="Test" />, { wrapper });
      const subtitle = screen.queryByText(/subtitle/i);
      expect(subtitle).not.toBeInTheDocument();
    });
  });

  describe("Filters visibility", () => {
    it("shows filters by default", () => {
      render(
        <PageLayout title="Test" filters={<div>Filter Content</div>} />,
        { wrapper },
      );
      expect(screen.getByText("Filter Content")).toBeInTheDocument();
    });

    it("shows filters when showFilters is true", () => {
      render(
        <PageLayout
          title="Test"
          showFilters={true}
          filters={<div>Filter Content</div>}
        />,
        { wrapper },
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
        { wrapper },
      );
      expect(screen.queryByText("Filter Content")).not.toBeInTheDocument();
    });

    it("renders default date range filter when showFilters is true and no filters prop", () => {
      render(<PageLayout title="Test" showFilters={true} />, { wrapper });
      expect(screen.getByText("30 dias")).toBeInTheDocument();
    });
  });

  describe("Buttons slot", () => {
    it("renders buttons when provided", () => {
      render(
        <PageLayout
          title="Test"
          buttons={<button type="button">Action</button>}
        />,
        { wrapper },
      );
      expect(
        screen.getByRole("button", { name: "Action" }),
      ).toBeInTheDocument();
    });

    it("does not render buttons container when not provided", () => {
      render(<PageLayout title="Test" showFilters={false} />, { wrapper });
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
        { wrapper },
      );
      expect(screen.getByText("Button 1")).toBeInTheDocument();
      expect(screen.getByText("Button 2")).toBeInTheDocument();
    });
  });

  describe("Variant styling", () => {
    it('applies flex classes when variant is "flex"', () => {
      const { container } = render(
        <PageLayout title="Test" variant="flex" />,
        { wrapper },
      );
      expect(container.firstChild).toHaveClass("flex", "flex-col", "gap-6");
    });

    it("does not apply flex classes for default variant", () => {
      const { container } = render(
        <PageLayout title="Test" variant="default" />,
        { wrapper },
      );
      expect(container.firstChild).not.toHaveClass(
        "flex",
        "flex-col",
        "gap-6",
      );
    });

    it("defaults to default variant", () => {
      const { container } = render(<PageLayout title="Test" />, { wrapper });
      expect(container.firstChild).not.toHaveClass(
        "flex",
        "flex-col",
        "gap-6",
      );
    });
  });

  describe("Children rendering", () => {
    it("renders children when provided", () => {
      render(
        <PageLayout title="Test">
          <div>Child Content</div>
        </PageLayout>,
        { wrapper },
      );
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });

    it("does not break when children is not provided", () => {
      render(<PageLayout title="Test" />, { wrapper });
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });

  describe("Reload button", () => {
    it("renders reload button when onReload is provided", () => {
      render(<PageLayout title="Test" onReload={() => {}} />, { wrapper });
      expect(
        screen.getByRole("button", { name: "Refresh" }),
      ).toBeInTheDocument();
    });

    it("does not render reload button when onReload is not provided", () => {
      render(<PageLayout title="Test" showFilters={false} />, { wrapper });
      expect(
        screen.queryByRole("button", { name: "Refresh" }),
      ).not.toBeInTheDocument();
    });
  });
});
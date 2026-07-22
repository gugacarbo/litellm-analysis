/** @vitest-environment jsdom */

import type { ArtificialAnalysisBenchmarkItem } from "@lite-llm/contracts/benchmarks";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { groupModelVariants, toAaTableItems } from "./benchmark-table-model";
import { AaSection, OpenRouterSection } from "./benchmark-tables";

const item = (id: string, name: string): ArtificialAnalysisBenchmarkItem => ({
  id,
  name,
  slug: id,
  creatorId: "anthropic",
  creatorName: "Anthropic",
  creatorSlug: "anthropic",
  source: "artificial-analysis",
  intelligenceIndex: 50,
  codingIndex: null,
  mathIndex: null,
  mmluPro: null,
  gpqa: null,
  hle: null,
  livecodebench: null,
  scicode: null,
  math500: null,
  aime: null,
  aime25: null,
  tau2: null,
  ifbench: null,
  lcr: null,
  terminalbenchHard: null,
  priceInput1mTokens: 3,
  priceOutput1mTokens: 15,
  priceBlended1mTokens: null,
  medianOutputTokensPerSecond: null,
  medianTimeToFirstTokenSeconds: null,
  medianTimeToFirstAnswerTokenSeconds: null,
});

afterEach(cleanup);

describe("AA model variant grouping", () => {
  const items = [
    item("june", "Claude 3.5 Sonnet (June '24)"),
    item("oct", "Claude 3.5 Sonnet (Oct '24)"),
    item("reasoning", "Claude 3.7 Sonnet (Reasoning)"),
    item("non-reasoning", "Claude 3.7 Sonnet (Non-reasoning)"),
    item("opus", "Claude 3 Opus"),
  ];

  it("groups dated and reasoning variants without merging distinct model versions", () => {
    const groups = groupModelVariants(toAaTableItems(items));

    expect(
      groups.map(({ name, items: variants }) => [name, variants.length]),
    ).toEqual([
      ["Claude 3.5 Sonnet", 2],
      ["Claude 3.7 Sonnet", 2],
      ["Claude 3 Opus", 1],
    ]);
    expect(groups[1]?.representative.name).toBe(
      "Claude 3.7 Sonnet (Non-reasoning)",
    );
  });

  it("lets the viewer enable grouping from the card header", () => {
    function ControlledSection() {
      const [groupVariants, setGroupVariants] = useState(false);
      return (
        <AaSection
          groupVariants={groupVariants}
          items={items}
          onGroupVariantsChange={setGroupVariants}
        />
      );
    }
    render(<ControlledSection />);

    expect(screen.queryByText("2 variantes")).toBeNull();
    fireEvent.click(
      screen.getByRole("switch", { name: "Agrupar variantes em Modelos" }),
    );

    expect(screen.getAllByText("2 variantes")).toHaveLength(2);
    expect(screen.getByText("Claude 3.5 Sonnet")).toBeTruthy();
    expect(screen.getByText("Claude 3.7 Sonnet")).toBeTruthy();
    expect(screen.queryByText("Claude 3.7 Sonnet (Reasoning)")).toBeNull();

    const groupButton = screen.getByRole("button", {
      name: "Expandir variantes de Claude 3.7 Sonnet",
    });
    expect(groupButton.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(groupButton);

    expect(groupButton.getAttribute("aria-expanded")).toBe("true");
    expect(groupButton.getAttribute("aria-label")).toBe(
      "Recolher variantes de Claude 3.7 Sonnet",
    );
    expect(screen.getByText("Claude 3.7 Sonnet (Reasoning)")).toBeTruthy();
    expect(screen.getByText("Claude 3.7 Sonnet (Non-reasoning)")).toBeTruthy();
  });

  it("uses the same grouping surface for OpenRouter model variants", () => {
    const openRouterItems = [
      {
        id: "reasoning",
        subsource: "artificial-analysis" as const,
        modelPermaslug: "anthropic/claude-4",
        name: "Claude 4 Sonnet (Reasoning)",
        provider: "anthropic",
        arena: null,
        category: null,
        elo: null,
        winRate: null,
        averageTimeSeconds: null,
        intelligenceIndex: 60,
        priceInput1mTokens: 3,
        priceOutput1mTokens: 15,
        attribution: {
          label: "OpenRouter",
          url: "https://openrouter.ai",
          citation: null,
        },
        native: {},
      },
      {
        id: "non-reasoning",
        subsource: "artificial-analysis" as const,
        modelPermaslug: "anthropic/claude-4",
        name: "Claude 4 Sonnet (Non-reasoning)",
        provider: "anthropic",
        arena: null,
        category: null,
        elo: null,
        winRate: null,
        averageTimeSeconds: null,
        intelligenceIndex: 58,
        priceInput1mTokens: 3,
        priceOutput1mTokens: 15,
        attribution: {
          label: "OpenRouter",
          url: "https://openrouter.ai",
          citation: null,
        },
        native: {},
      },
    ];
    function ControlledSection() {
      const [groupVariants, setGroupVariants] = useState(false);
      return (
        <OpenRouterSection
          groupVariants={groupVariants}
          items={openRouterItems}
          onGroupVariantsChange={setGroupVariants}
          title="Artificial Analysis via OpenRouter"
        />
      );
    }
    render(<ControlledSection />);

    fireEvent.click(
      screen.getByRole("switch", {
        name: "Agrupar variantes em Artificial Analysis via OpenRouter",
      }),
    );

    expect(screen.getByText("Claude 4 Sonnet")).toBeTruthy();
    expect(screen.getByText("2 variantes")).toBeTruthy();
  });
});

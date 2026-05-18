import { Scale } from "lucide-react";
import type {
  ComparisonCardData,
  UseCase,
} from "@/features/benchmarks/types/benchmark-types";
import { EmptyState } from "../../../components/ui/empty-state";
import { ComparisonCard } from "./comparison-card";

interface ComparisonDeckProps {
  cards: ComparisonCardData[];
  activeUseCase: UseCase;
  selectedIds: string[];
}

export function ComparisonDeck({
  cards,
  activeUseCase,
  selectedIds,
}: ComparisonDeckProps) {
  if (cards.length === 0) {
    return (
      <EmptyState
        title="No models to compare"
        description="Select models from the table or click 'Compare top 3' to get started."
        icon={Scale}
      />
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
        {cards.map((card) => (
          <div key={card.model.id} className="snap-start">
            <ComparisonCard
              card={card}
              activeUseCase={activeUseCase}
              isSelected={selectedIds.includes(card.model.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

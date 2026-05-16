import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  DollarSign,
  Gauge,
  Sigma,
  Timer,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MetricCard } from "../components/metric-card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { PageLayout } from "../components/ui/page-layout";
import { Skeleton } from "../components/ui/skeleton";
import { getModelBenchmarks } from "../lib/api-client/benchmarks";
import {
  formatBenchmarkPrice,
  formatFetchedAt,
  formatLatencySeconds,
  formatNullableNumber,
  formatSpeed,
} from "./benchmarks/benchmark-utils";

export function BenchmarkDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("from") ?? "/benchmarks";

  const query = useQuery({
    queryKey: ["benchmarks", "models"],
    queryFn: getModelBenchmarks,
    refetchInterval: 10 * 60_000,
  });

  const model = query.data?.models.find((item) => item.id === id) ?? null;

  return (
    <PageLayout
      title="Benchmark Detail"
      subtitle="Detailed benchmark, pricing, and latency profile"
      icon={Brain}
      showFilters={false}
      buttons={
        <Button variant="ghost" size="sm" asChild>
          <Link to={returnTo}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      {query.error ? (
        <Card>
          <CardContent className="py-6 text-sm text-red-500">
            {query.error instanceof Error
              ? query.error.message
              : "Unknown error"}
          </CardContent>
        </Card>
      ) : query.isPending && !query.data ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !model ? (
        <EmptyState
          title="Model not found"
          description="This benchmark id is not available in the current dataset."
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold">{model.name}</h2>
                {model.isConfigured && (
                  <Badge variant="success">Configured</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {model.creatorName} • {model.slug ?? "no-slug"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                ID: {model.id} • Last dataset update:{" "}
                {formatFetchedAt(query.data?.fetchedAt ?? "")}
              </p>
              {model.matchedConfiguredModel && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Matched configured model:{" "}
                  <span className="font-medium text-foreground">
                    {model.matchedConfiguredModel}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard
              icon={Brain}
              title="Intelligence"
              value={formatNullableNumber(model.intelligenceIndex)}
              colorScheme="blue"
              size="sm"
            />
            <MetricCard
              icon={Sigma}
              title="Coding"
              value={formatNullableNumber(model.codingIndex)}
              colorScheme="amber"
              size="sm"
            />
            <MetricCard
              icon={BadgeCheck}
              title="Math"
              value={formatNullableNumber(model.mathIndex)}
              colorScheme="green"
              size="sm"
            />
            <MetricCard
              icon={Gauge}
              title="Speed"
              value={formatSpeed(model.medianOutputTokensPerSecond)}
              colorScheme="neutral"
              size="sm"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Input ($/1M)</span>
                  <span>{formatBenchmarkPrice(model.priceInput1mTokens)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Output ($/1M)</span>
                  <span>{formatBenchmarkPrice(model.priceOutput1mTokens)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Blended 3:1 ($/1M)
                  </span>
                  <span>
                    {formatBenchmarkPrice(model.priceBlended1mTokens)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Latency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">TTFT</span>
                  <span>
                    {formatLatencySeconds(model.medianTimeToFirstTokenSeconds)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    First answer token
                  </span>
                  <span>
                    {formatLatencySeconds(
                      model.medianTimeToFirstAnswerTokenSeconds,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Output speed</span>
                  <span>{formatSpeed(model.medianOutputTokensPerSecond)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Benchmark Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-muted-foreground">MMLU Pro</span>
                  <span>{formatNullableNumber(model.mmluPro)}</span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-muted-foreground">GPQA</span>
                  <span>{formatNullableNumber(model.gpqa)}</span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-muted-foreground">HLE</span>
                  <span>{formatNullableNumber(model.hle)}</span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-muted-foreground">LiveCodeBench</span>
                  <span>{formatNullableNumber(model.livecodebench)}</span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-muted-foreground">SciCode</span>
                  <span>{formatNullableNumber(model.scicode)}</span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-muted-foreground">Math 500</span>
                  <span>{formatNullableNumber(model.math500)}</span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-muted-foreground">AIME</span>
                  <span>{formatNullableNumber(model.aime)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}

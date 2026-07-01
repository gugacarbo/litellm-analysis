import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { PageLayout } from "@/shared/components/ui/page-layout";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { getModelsWithConfig } from "@/shared/lib/api-client/models";
import { ModelDetailContext } from "./model-detail-context";

const TAB_SEGMENTS = ["settings", "overview", "logs"] as const;

export function ModelDetailLayout() {
  const { modelName } = useParams() as { modelName: string };
  const location = useLocation();
  const navigate = useNavigate();

  const lastSegment = location.pathname.split("/").pop() ?? "settings";
  const tabValue = (TAB_SEGMENTS as readonly string[]).includes(lastSegment)
    ? lastSegment
    : "settings";

  const modelsQuery = useQuery({
    queryKey: ["models-with-config"],
    queryFn: getModelsWithConfig,
  });

  const credentialsQuery = useQuery({
    queryKey: ["credentials"],
    queryFn: () =>
      import("@/shared/lib/api-client/credentials").then((m) =>
        m.getAllCredentials(),
      ),
  });

  const model = useMemo(() => {
    if (!modelsQuery.data) return null;
    return (
      modelsQuery.data.models.find((m) => m.modelName === modelName) ?? null
    );
  }, [modelsQuery.data, modelName]);

  const loading =
    modelsQuery.isPending || (modelsQuery.isFetching && !modelsQuery.data);

  const error = modelsQuery.error ? String(modelsQuery.error) : null;
  const notFound = !loading && modelsQuery.data !== undefined && model === null;

  const contextValue = useMemo(
    () => ({
      model,
      loading,
      error,
      notFound,
      credentials: credentialsQuery.data ?? [],
    }),
    [model, loading, error, notFound, credentialsQuery.data],
  );

  if (loading) {
    return (
      <PageLayout title="Loading..." icon={TrendingUp}>
        <div className="space-y-6 p-2">
          <div className="h-48 w-full animate-pulse rounded bg-muted" />
          <div className="h-48 w-full animate-pulse rounded bg-muted" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Error"
        icon={TrendingUp}
        buttons={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/models">
              <ArrowLeft className="h-4 w-4" />
              Back to Models
            </Link>
          </Button>
        }
      >
        <div className="flex items-center justify-center py-16">
          <p className="text-destructive">{error}</p>
        </div>
      </PageLayout>
    );
  }

  if (notFound) {
    return (
      <PageLayout
        title={`Model: ${modelName}`}
        icon={TrendingUp}
        buttons={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/models">
              <ArrowLeft className="h-4 w-4" />
              Back to Models
            </Link>
          </Button>
        }
      >
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <TrendingUp className="mb-3 h-10 w-10 stroke-1 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Model not found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The model &quot;{modelName}&quot; does not exist.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <ModelDetailContext.Provider value={contextValue}>
      <PageLayout
        title={model?.modelName ?? modelName}
        icon={TrendingUp}
        showFilters={false}
        buttons={
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/models">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {loading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </>
        }
      >
        <Tabs
          value={tabValue}
          onValueChange={(value) => {
            navigate(`/models/${encodeURIComponent(modelName)}/${value}`, {
              replace: false,
            });
          }}
        >
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-6">
          <Outlet />
        </div>
      </PageLayout>
    </ModelDetailContext.Provider>
  );
}

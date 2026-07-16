import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  ModelSettingsPage,
  type ModelSettingsTab,
  modelSettingsTabs,
} from "@/features/model-admin/models/model-settings-page";
import { modelAdminQueries } from "@/features/model-admin/query/query-options";

export const Route = createFileRoute("/_protected/models/$modelId/settings")({
  beforeLoad: ({ location, params }) => {
    if (location.pathname.replace(/\/$/, "").endsWith("/settings")) {
      throw redirect({
        to: "/models/$modelId/settings/$tab",
        params: { modelId: params.modelId, tab: "essential" },
      });
    }
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      modelAdminQueries.model(params.modelId),
    ),
  component: ModelSettingsRoute,
});

function ModelSettingsRoute() {
  const { modelId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const activeTab = useRouterState({
    select: (state) => getActiveTab(state.location.pathname),
  });

  return (
    <ModelSettingsPage
      activeTab={activeTab}
      modelId={modelId}
      role={session.user.role}
      onTabChange={(tab) =>
        void navigate({
          to: "/models/$modelId/settings/$tab",
          params: { modelId, tab },
        })
      }
    />
  );
}

function getActiveTab(pathname: string): ModelSettingsTab {
  const tab = pathname.split("/").at(-1);
  return modelSettingsTabs.includes(tab as ModelSettingsTab)
    ? (tab as ModelSettingsTab)
    : "essential";
}

import { Database, HeartPulse } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export function ModelsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabValue = location.pathname.startsWith("/models/health-check")
    ? "health-check"
    : "models";

  return (
    <div className="px-4 pt-2">
      <Tabs value={tabValue} className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList variant="line">
            <TabsTrigger
              value="models"
              className="gap-1.5"
              onClick={() => {
                navigate("/models");
              }}
            >
              <Database className="size-3.5" />
              Configured Models
            </TabsTrigger>
            <TabsTrigger
              value="health-check"
              className="gap-1.5"
              onClick={() => {
                navigate("/models/health-check");
              }}
            >
              <HeartPulse className="size-3.5" />
              Health Check
            </TabsTrigger>
          </TabsList>
        </div>

        <Outlet />
      </Tabs>
    </div>
  );
}

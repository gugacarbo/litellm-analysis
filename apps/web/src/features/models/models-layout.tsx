import { Outlet } from "react-router-dom";

export function ModelsLayout() {
  return (
    <div className="px-4 pt-2">
      <Outlet />
    </div>
  );
}

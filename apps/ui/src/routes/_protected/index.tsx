import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getRuntimeStatus } from "../../server/runtime-status.functions";

export const Route = createFileRoute("/_protected/")({
  component: ProtectedHome,
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  ),
  errorComponent: ({ error: _error }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-4 text-gray-600">Failed to load dashboard data.</p>
        <a
          href="/"
          className="mt-6 inline-block text-indigo-600 hover:underline"
        >
          Try again
        </a>
      </div>
    </div>
  ),
});

function ProtectedHome() {
  const { data: status } = useSuspenseQuery({
    queryKey: ["runtime-status"],
    queryFn: () => getRuntimeStatus({ data: {} }),
  });

  if (!status.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-2 text-gray-600">{status.error.message}</p>
        <p className="mt-1 text-sm text-gray-400">Code: {status.error.code}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-700">✅ Authenticated</p>
        <p className="text-sm text-green-600 mt-1">Runtime: {status.runtime}</p>
      </div>
    </div>
  );
}

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const { getSession } = await import("../server/auth/get-session.functions");
    const result = await getSession({ data: {} });

    if (!result.ok) {
      throw redirect({
        to: "/login",
        search: { returnTo: location.pathname, inviteToken: undefined },
      });
    }

    return { session: result.session };
  },
  errorComponent: ({ error: _error }) => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Error</h1>
          <p className="mt-4 text-gray-600">
            An error occurred while loading this page.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block text-indigo-600 hover:underline"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return <Outlet />;
}

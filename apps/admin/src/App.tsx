import { Route, Switch, Redirect } from "wouter";
import { lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tickets = lazy(() => import("./pages/Tickets"));
const Departures = lazy(() => import("./pages/Departures"));
const Shipments = lazy(() => import("./pages/Shipments"));
const Finance = lazy(() => import("./pages/Finance"));
const Charges = lazy(() => import("./pages/Charges"));
const Configuration = lazy(() => import("./pages/Configuration"));
const Staff = lazy(() => import("./pages/Staff"));
const StaffUsers = lazy(() => import("./pages/StaffUsers"));
const Manifeste = lazy(() => import("./pages/Manifeste"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-mats-purple border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/tickets" component={() => <ProtectedRoute component={Tickets} />} />
        <Route path="/departures" component={() => <ProtectedRoute component={Departures} />} />
        <Route path="/shipments" component={() => <ProtectedRoute component={Shipments} />} />
        <Route path="/finance" component={() => <ProtectedRoute component={Finance} />} />
        <Route path="/charges" component={() => <ProtectedRoute component={Charges} />} />
        <Route path="/configuration" component={() => <ProtectedRoute component={Configuration} />} />
        <Route path="/staff" component={() => <ProtectedRoute component={Staff} />} />
        <Route path="/users" component={() => <ProtectedRoute component={StaffUsers} />} />
        <Route path="/manifeste/:ref" component={() => <ProtectedRoute component={Manifeste} />} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

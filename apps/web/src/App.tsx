import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";

const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const DeparturesPublic = lazy(() => import("./pages/DeparturesPublic"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const Tracking = lazy(() => import("./pages/Tracking"));
const VerifyTicket = lazy(() => import("./pages/VerifyTicket"));
const Tarifs = lazy(() => import("./pages/Tarifs"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-mats-purple border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={Search} />
        <Route path="/departs" component={DeparturesPublic} />
        <Route path="/reserver/:tripId" component={BookingPage} />
        <Route path="/confirmation/:ref" component={Confirmation} />
        <Route path="/suivi" component={Tracking} />
        <Route path="/verifier" component={VerifyTicket} />
        <Route path="/tarifs" component={Tarifs} />
        <Route path="/connexion" component={Login} />
        <Route path="/inscription" component={Register} />
        <Route path="/mes-reservations" component={MyBookings} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </Suspense>
  );
}

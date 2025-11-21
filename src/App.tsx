import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UserTypeSelection from "./pages/UserTypeSelection";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";
import WorkshopDashboard from "./pages/workshop/Dashboard";
import WorkshopNewService from "./pages/workshop/NewService";
import WorkshopNewServiceClient from "./pages/workshop/NewServiceClient";
import WorkshopNewServiceDetails from "./pages/workshop/NewServiceDetails";
import WorkshopSettings from "./pages/workshop/Settings";
import WorkshopTemplates from "./pages/workshop/Templates";
import WorkshopHistory from "./pages/workshop/History";
import WorkshopClients from "./pages/workshop/Clients";
import WorkshopPlans from "./pages/workshop/Plans";
import WorkshopOnboarding from "./pages/workshop/Onboarding";
import PublicVehicleHistory from "./pages/PublicVehicleHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<UserTypeSelection />} />
            <Route path="/home" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/workshop/dashboard" element={
              <ProtectedRoute>
                <WorkshopDashboard />
              </ProtectedRoute>
            } />
            <Route path="/workshop/new-service" element={
              <ProtectedRoute>
                <WorkshopNewService />
              </ProtectedRoute>
            } />
            <Route path="/workshop/new-service/client" element={
              <ProtectedRoute>
                <WorkshopNewServiceClient />
              </ProtectedRoute>
            } />
            <Route path="/workshop/new-service/details" element={
              <ProtectedRoute>
                <WorkshopNewServiceDetails />
              </ProtectedRoute>
            } />
            <Route path="/workshop/settings" element={
              <ProtectedRoute>
                <WorkshopSettings />
              </ProtectedRoute>
            } />
            <Route path="/workshop/templates" element={
              <ProtectedRoute>
                <WorkshopTemplates />
              </ProtectedRoute>
            } />
            <Route path="/workshop/history" element={
              <ProtectedRoute>
                <WorkshopHistory />
              </ProtectedRoute>
            } />
            <Route path="/workshop/clients" element={
              <ProtectedRoute>
                <WorkshopClients />
              </ProtectedRoute>
            } />
            <Route path="/workshop/plans" element={
              <ProtectedRoute>
                <WorkshopPlans />
              </ProtectedRoute>
            } />
            <Route path="/workshop/onboarding" element={
              <ProtectedRoute>
                <WorkshopOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/report/:vehicleId" element={<Report />} />
            <Route path="/report" element={<Report />} />
            <Route path="/share/:token" element={<PublicVehicleHistory />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

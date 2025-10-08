import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PartnerDashboardWrapper from "./pages/PartnerDashboardWrapper";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import NewLeadPage from "./pages/NewLeadPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import DashboardRouter from "./components/DashboardRouter";
import PublicPartner from "./pages/public/PublicPartner";
import DataImport from "./pages/DataImport";
import ApplicationTracker from "./components/student/ApplicationTracker";

// Import comprehensive university data import script
import "./scripts/importData";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to dashboard router */}
          <Route path="/" element={<DashboardRouter />} />
          
          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          
          {/* Public Routes - No Authentication Required */}
          <Route 
            path="/public/partner/:partnerCode" 
            element={
              <PublicRoute>
                <PublicPartner />
              </PublicRoute>
            } 
          />
          
          {/* Partner Dashboard - Multi-tenant */}
          <Route 
            path="/partner/:partnerCode" 
            element={
              <ProtectedRoute requiredRole="partner">
                <PartnerDashboardWrapper />
              </ProtectedRoute>
            } 
          />
          
          {/* New Lead Page */}
          <Route 
            path="/partner/:partnerCode/new-lead" 
            element={
              <ProtectedRoute requiredRole="partner">
                <NewLeadPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Dashboard */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Data Import */}
          <Route 
            path="/admin/import" 
            element={
              <ProtectedRoute requiredRole="admin">
                <DataImport />
              </ProtectedRoute>
            } 
          />
          
          {/* Student Dashboard */}
          <Route 
            path="/student" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Student Application Tracker */}
          <Route 
            path="/student/application/:applicationId" 
            element={
              <ProtectedRoute requiredRole="student">
                <ApplicationTracker />
              </ProtectedRoute>
            } 
          />
          
          {/* Unauthorized page */}
          <Route 
            path="/unauthorized" 
            element={
              <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                  <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
              </div>
            } 
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

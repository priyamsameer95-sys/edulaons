import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PartnerDashboardWrapper from "./pages/PartnerDashboardWrapper";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

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
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          
          {/* Partner Dashboard - Multi-tenant */}
          <Route 
            path="/partner/:partnerCode" 
            element={
              <ProtectedRoute requiredRole="partner">
                <PartnerDashboardWrapper />
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

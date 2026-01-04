import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import PartnerDashboardWrapper from "./pages/PartnerDashboardWrapper";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import StudentLanding from "./pages/student/StudentLanding";
import StudentAuth from "./pages/student/StudentAuth";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSignedInLanding from "./pages/student/StudentSignedInLanding";
import StudentApplicationFlow from "./components/student/StudentApplicationFlow";
import Login from "./pages/Login";
import PartnerLogin from "./pages/PartnerLogin";
import NotFound from "./pages/NotFound";
import NewLeadPage from "./pages/NewLeadPage";
import PartnerDocumentPage from "./pages/PartnerDocumentPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import DashboardRouter from "./components/DashboardRouter";
import PublicPartner from "./pages/public/PublicPartner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            {/* Root = Student Landing Page (Primary) */}
            <Route path="/" element={<StudentLanding />} />
            
            {/* ============ NEW STANDARDIZED ROUTES ============ */}
            
            {/* Login Routes - Standardized */}
            <Route path="/login/student" element={<StudentAuth />} />
            <Route path="/login/partner" element={<PartnerLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            
            {/* Dashboard Routes - Standardized */}
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/student" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Partner dashboard uses dynamic route with partner code */}
            <Route 
              path="/dashboard/partner" 
              element={<DashboardRouter />} 
            />
            
            {/* ============ BACKWARD-COMPATIBLE REDIRECTS ============ */}
            
            {/* Legacy login routes */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/partner/login" element={<Navigate to="/login/partner" replace />} />
            <Route path="/student/auth" element={<Navigate to="/login/student" replace />} />
            <Route path="/student/landing" element={<Navigate to="/" replace />} />
            
            {/* Legacy dashboard routes */}
            <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
            <Route path="/admin/v2" element={<Navigate to="/dashboard/admin" replace />} />
            <Route path="/student" element={<Navigate to="/dashboard/student" replace />} />
            
            {/* Student Welcome Page (post-auth landing) */}
            <Route 
              path="/student/welcome" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentSignedInLanding />
                </ProtectedRoute>
              } 
            />
            
            {/* ============ FUNCTIONAL ROUTES ============ */}
            
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
            
            {/* Partner Document Page */}
            <Route 
              path="/partner/:partnerCode/lead/:leadId/documents" 
              element={
                <ProtectedRoute requiredRole="partner">
                  <PartnerDocumentPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Student Application Form */}
            <Route 
              path="/student/apply" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentApplicationFlow />
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

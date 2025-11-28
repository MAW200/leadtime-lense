import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import { MainLayout } from "./components/layout/MainLayout";
import { OnsiteLayout } from "./components/layout/OnsiteLayout";
import { WarehouseLayout } from "./components/layout/WarehouseLayout";
import Index from "./pages/Index";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Vendors from "./pages/Vendors";
import VendorProfile from "./pages/VendorProfile";
import Settings from "./pages/Settings";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectTemplates from "./pages/ProjectTemplates";
import AuditLog from "./pages/AuditLog";
import Invoices from "./pages/Invoices";
import OnsiteMyProjects from "./pages/OnsiteMyProjects";
import OnsiteProjectBOM from "./pages/OnsiteProjectBOM";
import WarehousePendingClaims from "./pages/WarehousePendingClaims";
import WarehouseClaimHistory from "./pages/WarehouseClaimHistory";
import WarehousePendingReturns from "./pages/WarehousePendingReturns";
import WarehouseStockAdjustments from "./pages/WarehouseStockAdjustments";
import NotFound from "./pages/NotFound";
import { type UserRole } from "./lib/supabase";
import { HOME_BY_ROLE } from "./constants/routes";

const queryClient = new QueryClient();

type RoleGuardProps = {
  allowedRoles: UserRole[];
  currentRole: UserRole;
  children: ReactNode;
};

const RoleGuard = ({ allowedRoles, currentRole, children }: RoleGuardProps) => {
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={HOME_BY_ROLE[currentRole]} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentRole } = useRole();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RoleGuard allowedRoles={["ceo_admin", "purchaser", "finance_admin"]} currentRole={currentRole}>
            <MainLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Index />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="purchase-orders/:id" element={<PurchaseOrderDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="vendors/:id" element={<VendorProfile />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="project-templates" element={<ProjectTemplates />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        element={
          <RoleGuard allowedRoles={["onsite_team"]} currentRole={currentRole}>
            <OnsiteLayout />
          </RoleGuard>
        }
      >
        <Route path="onsite/dashboard" element={<Index />} />
        <Route path="onsite/projects" element={<OnsiteMyProjects />} />
        <Route path="onsite/projects/:id" element={<OnsiteProjectBOM />} />
      </Route>

      <Route
        element={
          <RoleGuard allowedRoles={["warehouse_admin"]} currentRole={currentRole}>
            <WarehouseLayout />
          </RoleGuard>
        }
      >
        <Route path="warehouse/dashboard" element={<Index />} />
        <Route path="warehouse/pending-claims" element={<WarehousePendingClaims />} />
        <Route path="warehouse/pending-returns" element={<WarehousePendingReturns />} />
        <Route path="warehouse/stock-adjustments" element={<WarehouseStockAdjustments />} />
        <Route path="warehouse/claim-history" element={<WarehouseClaimHistory />} />
      </Route>

      <Route
        path="*"
        element={
          currentRole === "ceo_admin" || currentRole === "purchaser" || currentRole === "finance_admin" ? (
            <NotFound />
          ) : (
            <Navigate to={HOME_BY_ROLE[currentRole]} replace />
          )
        }
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;

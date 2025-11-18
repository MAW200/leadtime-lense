import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import { MainLayout } from "./components/MainLayout";
import { OnsiteLayout } from "./components/OnsiteLayout";
import { WarehouseLayout } from "./components/WarehouseLayout";
import Index from "./pages/Index";
import PurchaseOrders from "./pages/PurchaseOrders";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectTemplates from "./pages/ProjectTemplates";
import AuditLog from "./pages/AuditLog";
import OnsiteMyProjects from "./pages/OnsiteMyProjects";
import OnsiteProjectBOM from "./pages/OnsiteProjectBOM";
import WarehousePendingClaims from "./pages/WarehousePendingClaims";
import WarehouseClaimHistory from "./pages/WarehouseClaimHistory";
import WarehousePendingReturns from "./pages/WarehousePendingReturns";
import WarehouseStockAdjustments from "./pages/WarehouseStockAdjustments";
import NotFound from "./pages/NotFound";
import { type UserRole } from "./lib/supabase";

const queryClient = new QueryClient();

const HOME_BY_ROLE: Record<UserRole, string> = {
  ceo_admin: "/",
  warehouse_admin: "/warehouse/pending-claims",
  onsite_team: "/onsite/projects",
};

const guardRoute = (currentRole: UserRole, allowedRoles: UserRole[], element: JSX.Element) => {
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={HOME_BY_ROLE[currentRole]} replace />;
  }

  return element;
};

const AppRoutes = () => {
  const { currentRole } = useRole();

  return (
    <Routes>
      <Route
        path="/"
        element={guardRoute(
          currentRole,
          ["ceo_admin"],
          <MainLayout>
            <Index />
          </MainLayout>,
        )}
      />
      <Route
        path="/purchase-orders"
        element={guardRoute(
          currentRole,
          ["ceo_admin"],
          <MainLayout>
            <PurchaseOrders />
          </MainLayout>,
        )}
      />
      <Route
        path="/products"
        element={guardRoute(
          currentRole,
          ["ceo_admin"],
          <MainLayout>
            <Products />
          </MainLayout>,
        )}
      />
      <Route
        path="/projects"
        element={guardRoute(
          currentRole,
          ["ceo_admin"],
          <MainLayout>
            <Projects />
          </MainLayout>,
        )}
      />
      <Route
        path="/projects/:id"
        element={guardRoute(
          currentRole,
          ["ceo_admin"],
          <MainLayout>
            <ProjectDetail />
          </MainLayout>,
        )}
      />
      <Route
        path="/project-templates"
        element={guardRoute(
          currentRole,
          ["ceo_admin"],
          <MainLayout>
            <ProjectTemplates />
          </MainLayout>,
        )}
      />
      <Route
        path="/audit-log"
        element={guardRoute(
          currentRole,
          ["ceo_admin"],
          <MainLayout>
            <AuditLog />
          </MainLayout>,
        )}
      />
      <Route
        path="/settings"
        element={guardRoute(
          currentRole,
          ["ceo_admin"],
          <MainLayout>
            <Settings />
          </MainLayout>,
        )}
      />
      <Route
        path="/onsite/projects"
        element={guardRoute(
          currentRole,
          ["onsite_team"],
          <OnsiteLayout>
            <OnsiteMyProjects />
          </OnsiteLayout>,
        )}
      />
      <Route
        path="/onsite/projects/:id"
        element={guardRoute(
          currentRole,
          ["onsite_team"],
          <OnsiteLayout>
            <OnsiteProjectBOM />
          </OnsiteLayout>,
        )}
      />
      <Route
        path="/warehouse/pending-claims"
        element={guardRoute(
          currentRole,
          ["warehouse_admin"],
          <WarehouseLayout>
            <WarehousePendingClaims />
          </WarehouseLayout>,
        )}
      />
      <Route
        path="/warehouse/pending-returns"
        element={guardRoute(
          currentRole,
          ["warehouse_admin"],
          <WarehouseLayout>
            <WarehousePendingReturns />
          </WarehouseLayout>,
        )}
      />
      <Route
        path="/warehouse/stock-adjustments"
        element={guardRoute(
          currentRole,
          ["warehouse_admin"],
          <WarehouseLayout>
            <WarehouseStockAdjustments />
          </WarehouseLayout>,
        )}
      />
      <Route
        path="/warehouse/claim-history"
        element={guardRoute(
          currentRole,
          ["warehouse_admin"],
          <WarehouseLayout>
            <WarehouseClaimHistory />
          </WarehouseLayout>,
        )}
      />
      <Route
        path="*"
        element={
          currentRole === "ceo_admin" ? (
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
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;

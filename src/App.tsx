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
import AuditLog from "./pages/AuditLog";
import OnsiteMyProjects from "./pages/OnsiteMyProjects";
import OnsiteProjectBOM from "./pages/OnsiteProjectBOM";
import WarehousePendingClaims from "./pages/WarehousePendingClaims";
import WarehouseClaimHistory from "./pages/WarehouseClaimHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { currentRole } = useRole();

  if (currentRole === 'onsite_team') {
    return (
      <Routes>
        <Route element={<OnsiteLayout><OnsiteMyProjects /></OnsiteLayout>} path="/onsite/projects" />
        <Route element={<OnsiteLayout><OnsiteProjectBOM /></OnsiteLayout>} path="/onsite/projects/:id" />
        <Route path="*" element={<Navigate to="/onsite/projects" replace />} />
      </Routes>
    );
  }

  if (currentRole === 'warehouse_admin') {
    return (
      <Routes>
        <Route element={<WarehouseLayout><WarehousePendingClaims /></WarehouseLayout>} path="/warehouse/pending-claims" />
        <Route element={<WarehouseLayout><WarehouseClaimHistory /></WarehouseLayout>} path="/warehouse/claim-history" />
        <Route path="*" element={<Navigate to="/warehouse/pending-claims" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout><Index /></MainLayout>} path="/" />
      <Route element={<MainLayout><PurchaseOrders /></MainLayout>} path="/purchase-orders" />
      <Route element={<MainLayout><Products /></MainLayout>} path="/products" />
      <Route element={<MainLayout><Projects /></MainLayout>} path="/projects" />
      <Route element={<MainLayout><ProjectDetail /></MainLayout>} path="/projects/:id" />
      <Route element={<MainLayout><AuditLog /></MainLayout>} path="/audit-log" />
      <Route element={<MainLayout><Settings /></MainLayout>} path="/settings" />
      <Route path="*" element={<NotFound />} />
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

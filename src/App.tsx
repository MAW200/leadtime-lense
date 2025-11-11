import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import { MainLayout } from "./components/MainLayout";
import { OnsiteLayout } from "./components/OnsiteLayout";
import Index from "./pages/Index";
import Requests from "./pages/Requests";
import PurchaseOrders from "./pages/PurchaseOrders";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Projects from "./pages/Projects";
import AuditLog from "./pages/AuditLog";
import OnsiteBrowse from "./pages/OnsiteBrowse";
import OnsiteRequests from "./pages/OnsiteRequests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { currentRole } = useRole();
  const isOnsite = currentRole === 'onsite_team';

  if (isOnsite) {
    return (
      <Routes>
        <Route element={<OnsiteLayout><OnsiteBrowse /></OnsiteLayout>} path="/onsite/browse" />
        <Route element={<OnsiteLayout><OnsiteRequests /></OnsiteLayout>} path="/onsite/requests" />
        <Route path="*" element={<Navigate to="/onsite/browse" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout><Index /></MainLayout>} path="/" />
      <Route element={<MainLayout><Requests /></MainLayout>} path="/requests" />
      <Route element={<MainLayout><PurchaseOrders /></MainLayout>} path="/purchase-orders" />
      <Route element={<MainLayout><Products /></MainLayout>} path="/products" />
      <Route element={<MainLayout><Projects /></MainLayout>} path="/projects" />
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

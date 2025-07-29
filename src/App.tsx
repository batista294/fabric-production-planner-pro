
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import Products from "./pages/Products";
import ProductCatalog from "./pages/ProductCatalog";
import RawMaterials from "./pages/RawMaterials";
import StampTypes from "./pages/StampTypes";
import FailureTypes from "./pages/FailureTypes";
import PrintEntries from "./pages/PrintEntries";
import SewingEntries from "./pages/SewingEntries";
import FailureEntries from "./pages/FailureEntries";
import Sales from "./pages/Sales";
import ShippingEntries from "./pages/ShippingEntries";
import ProductionOrders from "./pages/ProductionOrders";
import ProductionKanban from "./pages/ProductionKanban";
import Productivity from "./pages/Productivity";
import Config from "./pages/Config";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Index />} />
              <Route path="funcionarios" element={<Employees />} />
              <Route path="produtos" element={<Products />} />
              <Route path="catalogo-produtos" element={<ProductCatalog />} />
              <Route path="materias-primas" element={<RawMaterials />} />
              <Route path="tipos-estampa" element={<StampTypes />} />
              <Route path="tipos-falha" element={<FailureTypes />} />
              <Route path="impressoes" element={<PrintEntries />} />
              <Route path="costuras" element={<SewingEntries />} />
              <Route path="falhas" element={<FailureEntries />} />
              <Route path="vendas" element={<Sales />} />
              <Route path="entregas" element={<ShippingEntries />} />
              <Route path="painel-producao" element={<ProductionKanban />} />
              <Route path="ordens-producao" element={<ProductionOrders />} />
              <Route path="produtividade" element={<Productivity />} />
              <Route path="configuracoes" element={<Config />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

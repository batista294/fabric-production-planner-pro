
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
import RawMaterials from "./pages/RawMaterials";
import StampTypes from "./pages/StampTypes";
import FailureTypes from "./pages/FailureTypes";
import PrintEntries from "./pages/PrintEntries";
import FailureEntries from "./pages/FailureEntries";
import Sales from "./pages/Sales";
import ShippingEntries from "./pages/ShippingEntries";
import Productivity from "./pages/Productivity";
import Config from "./pages/Config";
import Cells from "./pages/Cells";
import StampEntries from "./pages/StampEntries";
import DispatchEntries from "./pages/DispatchEntries";
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
              <Route path="materias-primas" element={<RawMaterials />} />
              <Route path="tipos-estampa" element={<StampTypes />} />
              <Route path="tipos-falha" element={<FailureTypes />} />
              <Route path="impressoes" element={<PrintEntries />} />
              <Route path="falhas" element={<FailureEntries />} />
              <Route path="vendas" element={<Sales />} />
              <Route path="entregas" element={<ShippingEntries />} />
              <Route path="produtividade" element={<Productivity />} />
              <Route path="celulas" element={<Cells />} />
              <Route path="lancamento-estampa" element={<StampEntries />} />
              <Route path="lancamento-expedicao" element={<DispatchEntries />} />
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

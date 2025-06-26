
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
import FailureTypes from "./pages/FailureTypes";
import PrintEntries from "./pages/PrintEntries";
import SewingEntries from "./pages/SewingEntries";
import FailureEntries from "./pages/FailureEntries";
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
              <Route path="tipos-falha" element={<FailureTypes />} />
              <Route path="impressoes" element={<PrintEntries />} />
              <Route path="costuras" element={<SewingEntries />} />
              <Route path="falhas" element={<FailureEntries />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

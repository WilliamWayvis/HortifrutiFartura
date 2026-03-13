import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueueProvider } from "@/contexts/QueueContext";
import { useState } from "react";
import Index from "./pages/Index";
import Display from "./pages/Display";
import DisplayFrangos from "./pages/DisplayFrangos";
import DisplayCarnes from "./pages/DisplayCarnes";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [adminAuth, setAdminAuth] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <QueueProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/display" element={<Display />} />
              <Route path="/display/frangos" element={<DisplayFrangos />} />
              <Route path="/display/acougue" element={<DisplayCarnes />} />
              <Route path="/display/carnes" element={<DisplayCarnes />} />
              <Route path="/admin/login" element={<AdminLogin onAuth={() => setAdminAuth(true)} />} />
              <Route path="/admin" element={adminAuth ? <Admin /> : <Navigate to="/admin/login" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueueProvider>
    </QueryClientProvider>
  );
};

export default App;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <QueueProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/display" element={<Display />} />
            <Route path="/display/frangos" element={<DisplayFrangos />} />
            <Route path="/display/acougue" element={<DisplayCarnes />} />
            <Route path="/display/carnes" element={<DisplayCarnes />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedAdmin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueueProvider>
  </QueryClientProvider>
);

export default App;

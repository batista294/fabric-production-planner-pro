
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  Package, 
  AlertTriangle, 
  Printer, 
  Bug,
  Palette,
  Layers,
  ClipboardList,
  LayoutGrid,
  Factory,
  Stamp,
  Scissors,
  Truck,
  
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Funcionários", url: "/funcionarios", icon: Users },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Matéria-Prima", url: "/materias-primas", icon: Layers },
  { title: "Tipos de Estampa", url: "/tipos-estampa", icon: Palette },
  { title: "Tipos de Falha", url: "/tipos-falha", icon: AlertTriangle },
];

const productionItems = [
  { title: "Painel Kanban", url: "/painel-producao", icon: LayoutGrid },
  { title: "Ordens de Produção", url: "/ordens-producao", icon: ClipboardList },
  { title: "Células", url: "/celulas", icon: Factory },
  { title: "Impressões", url: "/impressoes", icon: Printer },
  { title: "Lançamento de Estampa", url: "/lancamento-estampa", icon: Stamp },
  { title: "Costuras", url: "/costuras", icon: Scissors },
  { title: "Peças Costuradas", url: "/pecas-costuradas", icon: Scissors },
  { title: "Lançamento - Expedição", url: "/lancamento-expedicao", icon: Truck },
  { title: "Falhas", url: "/falhas", icon: Bug },
];

export function AppSidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const getNavClassName = (path: string) =>
    isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-6">
        <h2 className="text-xl font-bold text-sidebar-primary">Sistema PCP</h2>
        <p className="text-sm text-sidebar-foreground/70">Planejamento e Controle</p>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Produção</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {productionItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

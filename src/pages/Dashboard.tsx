
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, AlertTriangle, TrendingUp, Printer, Scissors } from "lucide-react";

interface DashboardStats {
  totalEmployees: number;
  totalProducts: number;
  totalFailureTypes: number;
  todayProduction: number;
  weeklyProduction: number;
  pendingIssues: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalProducts: 0,
    totalFailureTypes: 0,
    todayProduction: 0,
    weeklyProduction: 0,
    pendingIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get employees count
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const totalEmployees = employeesSnapshot.size;

        // Get products count
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const totalProducts = productsSnapshot.size;

        // Get failure types count
        const failureTypesSnapshot = await getDocs(collection(db, 'failure_types'));
        const totalFailureTypes = failureTypesSnapshot.size;

        // Get today's production (example query)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        const productionQuery = query(
          collection(db, 'print_entries'),
          where('date', '>=', todayTimestamp)
        );
        const todayProductionSnapshot = await getDocs(productionQuery);
        const todayProduction = todayProductionSnapshot.size;

        setStats({
          totalEmployees,
          totalProducts,
          totalFailureTypes,
          todayProduction,
          weeklyProduction: todayProduction * 5, // Mock data
          pendingIssues: Math.floor(Math.random() * 10), // Mock data
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Funcionários",
      value: stats.totalEmployees,
      description: "Total de funcionários cadastrados",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Produtos",
      value: stats.totalProducts,
      description: "Produtos registrados no sistema",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Tipos de Falha",
      value: stats.totalFailureTypes,
      description: "Categorias de falha cadastradas",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Produção Hoje",
      value: stats.todayProduction,
      description: "Itens produzidos hoje",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de produção
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Sistema Online
          </div>
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Resumo da Produção</CardTitle>
            <CardDescription>
              Atividades de produção das últimas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                <Printer className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium">Impressões</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.todayProduction} itens processados hoje
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                <Scissors className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium">Costuras</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(stats.todayProduction * 0.8)} itens finalizados
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-medium">Falhas Registradas</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.pendingIssues} ocorrências pendentes
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Informações gerais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Funcionários Ativos</span>
              <Badge variant="secondary">{stats.totalEmployees}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Produtos Cadastrados</span>
              <Badge variant="secondary">{stats.totalProducts}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tipos de Falha</span>
              <Badge variant="secondary">{stats.totalFailureTypes}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Produção Semanal</span>
              <Badge variant="default">{stats.weeklyProduction}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

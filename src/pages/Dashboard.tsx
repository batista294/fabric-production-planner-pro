import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, AlertTriangle, TrendingUp, Printer, Scissors, Truck, Stamp, Factory } from "lucide-react";
import { DeliveryCalendar } from "@/components/DeliveryCalendar";

interface DashboardStats {
  totalEmployees: number;
  totalProducts: number;
  totalCells: number;
  totalSewingPieces: number;
  totalPrintPieces: number;
  recentShippings: number;
  recentFailures: number;
  recentStampEntries: number;
}

interface RecentActivity {
  id: string;
  type: 'sewing' | 'print' | 'shipping' | 'failure' | 'stamp';
  description: string;
  date: string;
  quantity?: number;
}

interface DeliveryDate {
  date: Date;
  orders: {
    id: string;
    orderId: string;
    clientName?: string;
    quantity: number;
    productName: string;
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalProducts: 0,
    totalCells: 0,
    totalSewingPieces: 0,
    totalPrintPieces: 0,
    recentShippings: 0,
    recentFailures: 0,
    recentStampEntries: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate[]>([]);
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

        // Get cells count
        const cellsSnapshot = await getDocs(collection(db, 'cells'));
        const totalCells = cellsSnapshot.size;

        // Get sewing pieces data and calculate total quantity
        const sewingSnapshot = await getDocs(collection(db, 'sewingPieces'));
        const sewingData = sewingSnapshot.docs.map(doc => doc.data());
        const totalSewingPieces = sewingData.reduce((total, piece) => {
          const pieceTotal = (piece.products || []).reduce((pieceSum: number, product: any) => 
            pieceSum + (product.quantity || 0), 0
          );
          return total + pieceTotal;
        }, 0);

        // Get print entries data and calculate total quantity
        const printSnapshot = await getDocs(collection(db, 'print_entries'));
        const printData = printSnapshot.docs.map(doc => doc.data());
        const totalPrintPieces = printData.reduce((total, entry) => {
          const entryTotal = (entry.products || []).reduce((entrySum: number, product: any) => {
            const productTotal = (product.sizes || []).reduce((sizeSum: number, size: any) => 
              sizeSum + (size.quantity || 0), 0
            );
            return entrySum + productTotal;
          }, 0);
          return total + entryTotal;
        }, 0);

        // Get recent shippings (last 7 days)
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 7);
        const recentDateStr = recentDate.toISOString().split('T')[0];
        
        const shippingSnapshot = await getDocs(collection(db, 'shippingEntries'));
        const recentShippings = shippingSnapshot.docs.filter(doc => 
          doc.data().date >= recentDateStr
        ).length;

        // Get recent failures (last 7 days)
        const failuresSnapshot = await getDocs(collection(db, 'failure_entries'));
        const recentFailures = failuresSnapshot.docs.filter(doc => 
          doc.data().date >= recentDateStr
        ).length;

        // Get recent stamp entries (last 7 days)
        const stampSnapshot = await getDocs(collection(db, 'stamp_entries'));
        const recentStampEntries = stampSnapshot.docs.filter(doc => 
          doc.data().date >= recentDateStr
        ).length;

        // Collect recent activities
        const activities: RecentActivity[] = [];

        // Add recent sewing activities
        const recentSewing = sewingSnapshot.docs
          .filter(doc => doc.data().date >= recentDateStr)
          .slice(0, 3);
        recentSewing.forEach(doc => {
          const data = doc.data();
          const totalQty = (data.products || []).reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
          activities.push({
            id: doc.id,
            type: 'sewing',
            description: data.description || 'Peça costurada',
            date: data.date,
            quantity: totalQty
          });
        });

        // Add recent print activities
        const recentPrint = printSnapshot.docs
          .filter(doc => doc.data().date >= recentDateStr)
          .slice(0, 3);
        recentPrint.forEach(doc => {
          const data = doc.data();
          const totalQty = (data.products || []).reduce((sum: number, product: any) => {
            return sum + (product.sizes || []).reduce((sizeSum: number, size: any) => 
              sizeSum + (size.quantity || 0), 0
            );
          }, 0);
          activities.push({
            id: doc.id,
            type: 'print',
            description: data.description || 'Impressão realizada',
            date: data.date,
            quantity: totalQty
          });
        });

        // Sort activities by date
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Fetch production orders for calendar
        const ordersSnapshot = await getDocs(collection(db, 'production_orders'));
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          orderId: doc.data().orderId || '',
          productName: doc.data().productName || '',
          quantity: doc.data().quantity || 0,
          client: doc.data().client || '',
          dueDate: doc.data().dueDate || '',
          ...doc.data()
        }));
        
        // Group orders by due date
        const dateMap: Map<string, DeliveryDate['orders']> = new Map();
        
        orders.forEach(order => {
          if (!order.dueDate) return;
          
          const dateKey = new Date(order.dueDate).toDateString();
          const existingOrders = dateMap.get(dateKey) || [];
          
          dateMap.set(dateKey, [
            ...existingOrders,
            {
              id: order.id,
              orderId: order.orderId,
              clientName: order.client,
              quantity: order.quantity,
              productName: order.productName
            }
          ]);
        });
        
        const deliveryDatesArray: DeliveryDate[] = Array.from(dateMap.entries()).map(
          ([dateKey, orders]) => ({
            date: new Date(dateKey),
            orders
          })
        );

        setStats({
          totalEmployees,
          totalProducts,
          totalCells,
          totalSewingPieces,
          totalPrintPieces,
          recentShippings,
          recentFailures,
          recentStampEntries,
        });
        
        setRecentActivities(activities);
        setDeliveryDates(deliveryDatesArray);
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
      title: "Células de Produção",
      value: stats.totalCells,
      description: "Células de produção ativas",
      icon: Factory,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Peças Costuradas",
      value: stats.totalSewingPieces,
      description: "Peças costuradas no sistema",
      icon: Scissors,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const productionCards = [
    {
      title: "Peças Impressas",
      value: stats.totalPrintPieces,
      description: "Total de peças impressas",
      icon: Printer,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Expedições (7 dias)",
      value: stats.recentShippings,
      description: "Expedições dos últimos 7 dias",
      icon: Truck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Falhas (7 dias)",
      value: stats.recentFailures,
      description: "Falhas registradas recentemente",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Estampas (7 dias)",
      value: stats.recentStampEntries,
      description: "Lançamentos de estampa recentes",
      icon: Stamp,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
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
        <div className="grid gap-4 md:grid-cols-1">
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {productionCards.map((card) => (
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

      {/* Delivery Calendar */}
      <div className="grid gap-4 md:grid-cols-1">
        <DeliveryCalendar deliveries={deliveryDates} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas atividades registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhuma atividade recente</p>
                <p className="text-sm">As atividades aparecerão aqui conforme forem registradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.slice(0, 6).map((activity) => {
                  const getActivityIcon = (type: string) => {
                    switch (type) {
                      case 'sewing': return <Scissors className="h-5 w-5 text-green-600" />;
                      case 'print': return <Printer className="h-5 w-5 text-blue-600" />;
                      case 'shipping': return <Truck className="h-5 w-5 text-purple-600" />;
                      case 'failure': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
                      case 'stamp': return <Stamp className="h-5 w-5 text-rose-600" />;
                      default: return <TrendingUp className="h-5 w-5 text-gray-600" />;
                    }
                  };

                  const getActivityBg = (type: string) => {
                    switch (type) {
                      case 'sewing': return 'bg-green-50';
                      case 'print': return 'bg-blue-50';
                      case 'shipping': return 'bg-purple-50';
                      case 'failure': return 'bg-orange-50';
                      case 'stamp': return 'bg-rose-50';
                      default: return 'bg-gray-50';
                    }
                  };

                  return (
                    <div key={activity.id} className={`flex items-center gap-4 p-3 ${getActivityBg(activity.type)} rounded-lg`}>
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString("pt-BR")}
                          {activity.quantity && ` - ${activity.quantity} peças`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo da Produção</CardTitle>
            <CardDescription>
              Estatísticas gerais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Peças Costuradas</span>
              <Badge variant="secondary">{stats.totalSewingPieces}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Peças Impressas</span>
              <Badge variant="secondary">{stats.totalPrintPieces}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Expedições (7 dias)</span>
              <Badge variant="default">{stats.recentShippings}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Falhas (7 dias)</span>
              <Badge variant={stats.recentFailures > 0 ? "destructive" : "secondary"}>
                {stats.recentFailures}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Estampas (7 dias)</span>
              <Badge variant="default">{stats.recentStampEntries}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
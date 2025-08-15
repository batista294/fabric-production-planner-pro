import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Package, AlertTriangle, TrendingUp, Printer, Scissors, Truck, Stamp, Factory, Clock, Target, BarChart3 } from "lucide-react";
import { DeliveryCalendar } from "@/components/DeliveryCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SewingPiece {
  id: string;
  date: string;
  description: string;
  cellId: string;
  peopleCount: number;
  products: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
}

interface Cell {
  id: string;
  name: string;
}

interface SewingAnalytics {
  totalPieces: number;
  totalPeople: number;
  totalEntries: number;
  avgPiecesPerPerson: number;
  avgPiecesPerEntry: number;
  productivityTrend: { date: string; pieces: number; people: number }[];
  cellStats: Record<string, { pieces: number; people: number; entries: number; avgPiecesPerEntry: number }>;
  last7Days: { pieces: number; people: number; entries: number };
  last30Days: { pieces: number; people: number; entries: number };
}

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
  const [sewingAnalytics, setSewingAnalytics] = useState<SewingAnalytics | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get employees count
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const totalEmployees = employeesSnapshot.size;

        // Get products count
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const totalProducts = productsSnapshot.size;

        // Get cells data
        const cellsSnapshot = await getDocs(collection(db, 'cells'));
        const totalCells = cellsSnapshot.size;
        const cellsData = cellsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Célula sem nome',
          ...doc.data()
        })) as Cell[];

        // Get sewing pieces data and calculate detailed analytics
        const sewingSnapshot = await getDocs(collection(db, 'sewingPieces'));
        const sewingPiecesData = sewingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SewingPiece[];

        const totalSewingPieces = sewingPiecesData.reduce((total, piece) => {
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

        // Calculate detailed sewing analytics
        const sewingAnalytics = calculateSewingAnalytics(sewingPiecesData, cellsData);

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
        setSewingAnalytics(sewingAnalytics);
        setCells(cellsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const calculateSewingAnalytics = (sewingPieces: SewingPiece[], cells: Cell[]): SewingAnalytics => {
    const totalPieces = sewingPieces.reduce((total, piece) => {
      return total + (piece.products || []).reduce((sum, product) => sum + (product.quantity || 0), 0);
    }, 0);

    const totalPeople = sewingPieces.reduce((total, piece) => total + (piece.peopleCount || 0), 0);
    const totalEntries = sewingPieces.length;

    const avgPiecesPerPerson = totalPeople > 0 ? totalPieces / totalPeople : 0;
    const avgPiecesPerEntry = totalEntries > 0 ? totalPieces / totalEntries : 0;

    // Calculate last 7 and 30 days
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent7 = sewingPieces.filter(piece => new Date(piece.date) >= last7Days);
    const recent30 = sewingPieces.filter(piece => new Date(piece.date) >= last30Days);

    const last7DaysStats = {
      pieces: recent7.reduce((total, piece) => 
        total + (piece.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0), 0),
      people: recent7.reduce((total, piece) => total + (piece.peopleCount || 0), 0),
      entries: recent7.length
    };

    const last30DaysStats = {
      pieces: recent30.reduce((total, piece) => 
        total + (piece.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0), 0),
      people: recent30.reduce((total, piece) => total + (piece.peopleCount || 0), 0),
      entries: recent30.length
    };

    // Calculate cell statistics
    const cellStats = cells.reduce((stats, cell) => {
      const cellPieces = sewingPieces.filter(piece => piece.cellId === cell.id);
      const cellTotalPieces = cellPieces.reduce((total, piece) =>
        total + (piece.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0), 0);
      const cellTotalPeople = cellPieces.reduce((total, piece) => total + (piece.peopleCount || 0), 0);
      const cellEntries = cellPieces.length;

      stats[cell.name] = {
        pieces: cellTotalPieces,
        people: cellTotalPeople,
        entries: cellEntries,
        avgPiecesPerEntry: cellEntries > 0 ? cellTotalPieces / cellEntries : 0
      };

      return stats;
    }, {} as Record<string, { pieces: number; people: number; entries: number; avgPiecesPerEntry: number }>);

    // Calculate productivity trend (last 10 days)
    const productivityTrend = [];
    for (let i = 9; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayPieces = sewingPieces.filter(piece => piece.date === dateStr);
      
      productivityTrend.push({
        date: dateStr,
        pieces: dayPieces.reduce((total, piece) => 
          total + (piece.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0), 0),
        people: dayPieces.reduce((total, piece) => total + (piece.peopleCount || 0), 0)
      });
    }

    return {
      totalPieces,
      totalPeople,
      totalEntries,
      avgPiecesPerPerson: Math.round(avgPiecesPerPerson * 100) / 100,
      avgPiecesPerEntry: Math.round(avgPiecesPerEntry * 100) / 100,
      productivityTrend,
      cellStats,
      last7Days: last7DaysStats,
      last30Days: last30DaysStats
    };
  };

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
        <div className="flex items-center space-x-2">
          {sewingAnalytics && (
            <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Análise Produtividade
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Análise de Produtividade - Peças Costuradas</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Métricas Principais */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{sewingAnalytics.avgPiecesPerPerson}</div>
                        <p className="text-sm text-muted-foreground">Peças/Pessoa</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{sewingAnalytics.avgPiecesPerEntry}</div>
                        <p className="text-sm text-muted-foreground">Peças/Registro</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{sewingAnalytics.last7Days.pieces}</div>
                        <p className="text-sm text-muted-foreground">Peças (7 dias)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{sewingAnalytics.last30Days.pieces}</div>
                        <p className="text-sm text-muted-foreground">Peças (30 dias)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-cyan-600">
                          {sewingAnalytics.last7Days.entries > 0 
                            ? Math.round((sewingAnalytics.last7Days.pieces / sewingAnalytics.last7Days.entries) * 100) / 100
                            : 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Média 7 dias</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Comparativo de Períodos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Últimos 7 dias</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Peças produzidas:</span>
                            <Badge variant="default">{sewingAnalytics.last7Days.pieces}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Total de pessoas:</span>
                            <Badge variant="secondary">{sewingAnalytics.last7Days.people}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Registros:</span>
                            <Badge variant="outline">{sewingAnalytics.last7Days.entries}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Produtividade média:</span>
                            <Badge variant="default">
                              {sewingAnalytics.last7Days.people > 0 
                                ? Math.round((sewingAnalytics.last7Days.pieces / sewingAnalytics.last7Days.people) * 100) / 100
                                : 0} peças/pessoa
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Últimos 30 dias</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Peças produzidas:</span>
                            <Badge variant="default">{sewingAnalytics.last30Days.pieces}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Total de pessoas:</span>
                            <Badge variant="secondary">{sewingAnalytics.last30Days.people}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Registros:</span>
                            <Badge variant="outline">{sewingAnalytics.last30Days.entries}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Produtividade média:</span>
                            <Badge variant="default">
                              {sewingAnalytics.last30Days.people > 0 
                                ? Math.round((sewingAnalytics.last30Days.pieces / sewingAnalytics.last30Days.people) * 100) / 100
                                : 0} peças/pessoa
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Estatísticas por Célula */}
                  {Object.keys(sewingAnalytics.cellStats).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance por Célula de Produção</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          {Object.entries(sewingAnalytics.cellStats).map(([cellName, stats]) => (
                            <div key={cellName} className="border rounded-lg p-4">
                              <h4 className="font-medium mb-3 text-lg">{cellName}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                  <div className="text-xl font-bold text-blue-600">{stats.pieces}</div>
                                  <div className="text-sm text-muted-foreground">Total Peças</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xl font-bold text-green-600">{stats.people}</div>
                                  <div className="text-sm text-muted-foreground">Total Pessoas</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xl font-bold text-purple-600">{stats.entries}</div>
                                  <div className="text-sm text-muted-foreground">Registros</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xl font-bold text-orange-600">
                                    {Math.round(stats.avgPiecesPerEntry * 100) / 100}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Peças/Registro</div>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground text-center">
                                Produtividade: {stats.people > 0 ? Math.round((stats.pieces / stats.people) * 100) / 100 : 0} peças por pessoa
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tendência dos Últimos 10 Dias */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tendência de Produção (Últimos 10 dias)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {sewingAnalytics.productivityTrend.map((day, index) => (
                          <div key={day.date} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm font-medium">
                              {new Date(day.date).toLocaleDateString("pt-BR")}
                            </span>
                            <div className="flex space-x-4 text-sm">
                              <span>Peças: <Badge variant="default">{day.pieces}</Badge></span>
                              <span>Pessoas: <Badge variant="secondary">{day.people}</Badge></span>
                              <span>
                                Produtividade: <Badge variant="outline">
                                  {day.people > 0 ? Math.round((day.pieces / day.people) * 100) / 100 : 0}
                                </Badge>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Badge variant="secondary" className="px-3 py-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistema Online
            </div>
          </Badge>
        </div>
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

      {/* Production Analytics Cards */}
      {sewingAnalytics && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Produtividade
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sewingAnalytics.avgPiecesPerPerson}</div>
              <p className="text-xs text-muted-foreground mt-1">
                peças por pessoa (geral)
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Eficiência
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sewingAnalytics.avgPiecesPerEntry}</div>
              <p className="text-xs text-muted-foreground mt-1">
                peças por registro
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Últimos 7 dias
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sewingAnalytics.last7Days.pieces}</div>
              <p className="text-xs text-muted-foreground mt-1">
                peças produzidas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Semanal
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-50">
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sewingAnalytics.last7Days.people > 0 
                  ? Math.round((sewingAnalytics.last7Days.pieces / sewingAnalytics.last7Days.people) * 100) / 100
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                peças/pessoa (7 dias)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
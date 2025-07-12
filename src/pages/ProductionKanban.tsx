import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/components/OrderCard";
import { LayoutGrid, RefreshCw, List } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";

interface ProductionOrder {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  priority: string;
  status: string;
  dueDate: string;
  date: string;
  notes?: string;
}

const statusColumns = [
  { id: 'pendente', title: 'Pendente', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'em_producao', title: 'Em Produção', color: 'bg-blue-50 border-blue-200' },
  { id: 'concluida', title: 'Concluída', color: 'bg-green-50 border-green-200' },
  { id: 'cancelada', title: 'Cancelada', color: 'bg-red-50 border-red-200' },
];

export default function ProductionKanban() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const querySnapshot = await getDocs(collection(db, 'production_orders'));
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductionOrder[];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erro ao carregar ordens de produção");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as string;

    // Verifica se é uma coluna válida
    if (!statusColumns.find(col => col.id === newStatus)) return;

    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === newStatus) return;

    try {
      // Atualiza no Firestore
      await updateDoc(doc(db, 'production_orders', orderId), {
        status: newStatus
      });

      // Atualiza o estado local
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );

      toast.success(`Ordem ${order.orderId} movida para ${statusColumns.find(col => col.id === newStatus)?.title}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Erro ao atualizar status da ordem");
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const activeOrder = activeId ? orders.find(order => order.id === activeId) : null;

  // Componente de coluna com droppable
  function DroppableColumn({ column, children }: { column: any; children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
      id: column.id,
    });

    return (
      <Card ref={setNodeRef} className={`${column.color} border-2 min-h-[600px]`}>
        {children}
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Painel Kanban</h1>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
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
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel Kanban</h1>
            <p className="text-muted-foreground">
              Gerencie ordens de produção com arrastar e soltar
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/ordens-producao')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Ver Lista
          </Button>
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statusColumns.map((column) => {
            const columnOrders = getOrdersByStatus(column.id);
            
            return (
              <DroppableColumn key={column.id} column={column}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{column.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {columnOrders.length}
                    </Badge>
                  </div>
                </CardHeader>
                
                <SortableContext
                  items={columnOrders.map(order => order.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <CardContent className="space-y-3 pb-6">
                    {columnOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <LayoutGrid className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm">Nenhuma ordem</p>
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))
                    )}
                  </CardContent>
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <OrderCard order={activeOrder} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
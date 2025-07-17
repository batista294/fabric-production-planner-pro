import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package2, User, CalendarClock } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  client?: string;
  productionStage?: string;
  customerFeedback?: string;
}

interface OrderCardProps {
  order: ProductionOrder;
}

export function OrderCard({ order }: OrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'baixa':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };
  
  const getStageColor = (stage?: string) => {
    switch (stage) {
      case 'Arte Montada':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Impresso':
        return 'bg-blue-200 text-blue-800 border-blue-300';
      case 'Estampado':
        return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'Houve Falhas':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Finalizado / Entregue':
        return 'bg-green-50 text-green-600 border-green-100';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getFeedbackColor = (feedback?: string) => {
    switch (feedback) {
      case 'Elogiado pelo Cliente':
        return 'bg-green-300 text-green-800 border-green-400';
      case 'Reclamação / Problema':
        return 'bg-yellow-300 text-yellow-800 border-yellow-400';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : 'opacity-100'
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm">🧾 {order.orderId}</h4>
            <p className="text-xs text-muted-foreground">{order.productName}</p>
            {order.client && (
              <div className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">✅ CLIENTE: {order.client}</p>
              </div>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${getPriorityColor(order.priority)}`}
          >
            {order.priority}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Package2 className="h-3 w-3" />
            <span>🔢 QUANTIDADE: {order.quantity} un.</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>📦 ENTREGA EM: {formatDate(order.dueDate)}</span>
          </div>
        </div>

        {order.date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            <span>📌 INCLUSO EM: {formatDate(order.date)}</span>
          </div>
        )}
        
        {order.productionStage && (
          <div className="mt-1">
            <Badge variant="outline" className={`text-xs w-full justify-center ${getStageColor(order.productionStage)}`}>
              📊 STATUS: {order.productionStage}
            </Badge>
          </div>
        )}

        {order.customerFeedback && (
          <div className="mt-1">
            <Badge variant="outline" className={`text-xs w-full justify-center ${getFeedbackColor(order.customerFeedback)}`}>
              📣 FEEDBACK: {order.customerFeedback}
            </Badge>
          </div>
        )}
        
        {order.notes && (
          <p className="text-xs text-muted-foreground truncate" title={order.notes}>
            📝 OBSERVAÇÕES: {order.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
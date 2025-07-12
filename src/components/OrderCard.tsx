import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package2 } from "lucide-react";
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
            <h4 className="font-semibold text-sm">{order.orderId}</h4>
            <p className="text-xs text-muted-foreground">{order.productName}</p>
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
            <span>{order.quantity} un.</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(order.dueDate)}</span>
          </div>
        </div>
        
        {order.notes && (
          <p className="text-xs text-muted-foreground truncate" title={order.notes}>
            {order.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
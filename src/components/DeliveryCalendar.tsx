import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  format,
  isSameDay,
} from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Package } from 'lucide-react';

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

interface DeliveryCalendarProps {
  deliveries: DeliveryDate[];
}

export function DeliveryCalendar({ deliveries }: DeliveryCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Find deliveries for selected date
  const selectedDateDeliveries = selectedDate
    ? deliveries.find(d => isSameDay(new Date(d.date), selectedDate))?.orders || []
    : [];

  // Function to highlight dates with deliveries
  const isDayWithDelivery = (date: Date) => {
    return deliveries.some(delivery => isSameDay(new Date(delivery.date), date));
  };

  // Get total deliveries per day for the badge
  const getDeliveryCount = (date: Date) => {
    const delivery = deliveries.find(d => isSameDay(new Date(d.date), date));
    return delivery ? delivery.orders.length : 0;
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Entregas Programadas</CardTitle>
            <CardDescription>
              Visualização de todas as entregas agendadas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1 md:p-6 flex flex-col md:flex-row gap-6">
        <div className="border rounded-lg p-3 flex-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="pointer-events-auto"
            modifiers={{
              delivery: (date) => isDayWithDelivery(date),
            }}
            modifiersStyles={{
              delivery: {
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                color: 'hsl(var(--primary))',
              },
            }}
            components={{
              DayContent: (props) => {
                const deliveryCount = getDeliveryCount(props.date);
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {props.date.getDate()}
                    {deliveryCount > 0 && (
                      <span className="absolute bottom-0 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </div>
                );
              },
            }}
          />
        </div>

        <div className="border rounded-lg p-3 flex-1 h-[300px] overflow-auto">
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              Entregas em {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '-'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedDateDeliveries.length} {selectedDateDeliveries.length === 1 ? 'entrega' : 'entregas'} programadas
            </p>
          </div>

          {selectedDateDeliveries.length > 0 ? (
            <div className="space-y-3">
              {selectedDateDeliveries.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <p className="font-semibold">Pedido #{order.orderId}</p>
                        </div>
                        <p className="text-sm mt-1">
                          {order.productName}
                        </p>
                        {order.clientName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cliente: {order.clientName}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-primary/5">
                        {order.quantity} un
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Package className="h-12 w-12 mb-2 opacity-20" />
              <p>Nenhuma entrega programada</p>
              <p className="text-sm">Selecione outra data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Truck } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DispatchEntry {
  id: string;
  date: Date;
  description: string;
  sentOrdersDate: Date;
  mostDelayedOrderDate: Date;
  delayReason: string;
  delayDescription: string;
  sentOrdersQuantity: number;
  pendingOrdersQuantity: number;
  createdAt: Date;
}

export default function DispatchEntries() {
  const [entries, setEntries] = useState<DispatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date(),
    description: "",
    sentOrdersDate: new Date(),
    mostDelayedOrderDate: new Date(),
    delayReason: "",
    delayDescription: "",
    sentOrdersQuantity: 0,
    pendingOrdersQuantity: 0
  });
  const { toast } = useToast();

  const fetchEntries = async () => {
    try {
      const q = query(collection(db, "dispatchEntries"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const entriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        sentOrdersDate: doc.data().sentOrdersDate?.toDate(),
        mostDelayedOrderDate: doc.data().mostDelayedOrderDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as DispatchEntry[];
      setEntries(entriesData);
    } catch (error) {
      console.error("Erro ao buscar lançamentos de expedição:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lançamentos de expedição",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const resetForm = () => {
    setFormData({
      date: new Date(),
      description: "",
      sentOrdersDate: new Date(),
      mostDelayedOrderDate: new Date(),
      delayReason: "",
      delayDescription: "",
      sentOrdersQuantity: 0,
      pendingOrdersQuantity: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha a descrição da expedição",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, "dispatchEntries"), {
        ...formData,
        createdAt: new Date(),
      });

      toast({
        title: "Sucesso",
        description: "Lançamento de expedição adicionado com sucesso!",
      });

      resetForm();
      fetchEntries();
    } catch (error) {
      console.error("Erro ao adicionar lançamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar lançamento de expedição",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Truck className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Lançamento - Expedição</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Lançamento de Expedição</CardTitle>
          <CardDescription>
            Registre informações sobre expedições e pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição de Expedição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Digite a descrição da expedição"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sentOrdersDate">Data dos Pedidos Enviados</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.sentOrdersDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.sentOrdersDate ? format(formData.sentOrdersDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.sentOrdersDate}
                      onSelect={(date) => date && setFormData({ ...formData, sentOrdersDate: date })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mostDelayedOrderDate">Data do Pedido Mais Atrasado</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.mostDelayedOrderDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.mostDelayedOrderDate ? format(formData.mostDelayedOrderDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.mostDelayedOrderDate}
                      onSelect={(date) => date && setFormData({ ...formData, mostDelayedOrderDate: date })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delayReason">Motivo do Atraso</Label>
                <Input
                  id="delayReason"
                  value={formData.delayReason}
                  onChange={(e) => setFormData({ ...formData, delayReason: e.target.value })}
                  placeholder="Digite o motivo do atraso"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sentOrdersQuantity">Quantidade de Pedidos Enviados</Label>
                <Input
                  id="sentOrdersQuantity"
                  type="number"
                  min="0"
                  value={formData.sentOrdersQuantity}
                  onChange={(e) => setFormData({ ...formData, sentOrdersQuantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pendingOrdersQuantity">Quantidade de Pedidos Pendentes</Label>
                <Input
                  id="pendingOrdersQuantity"
                  type="number"
                  min="0"
                  value={formData.pendingOrdersQuantity}
                  onChange={(e) => setFormData({ ...formData, pendingOrdersQuantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delayDescription">Descrição do Motivo</Label>
              <Textarea
                id="delayDescription"
                value={formData.delayDescription}
                onChange={(e) => setFormData({ ...formData, delayDescription: e.target.value })}
                placeholder="Descreva detalhadamente o motivo do atraso"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full">
              Adicionar Lançamento de Expedição
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground">Nenhum lançamento encontrado.</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <strong>Data:</strong> {format(entry.date, "dd/MM/yyyy")}
                    </div>
                    <div>
                      <strong>Descrição:</strong> {entry.description}
                    </div>
                    <div>
                      <strong>Data Pedidos Enviados:</strong> {format(entry.sentOrdersDate, "dd/MM/yyyy")}
                    </div>
                    <div>
                      <strong>Pedido Mais Atrasado:</strong> {format(entry.mostDelayedOrderDate, "dd/MM/yyyy")}
                    </div>
                    <div>
                      <strong>Motivo Atraso:</strong> {entry.delayReason || "N/A"}
                    </div>
                    <div>
                      <strong>Pedidos Enviados:</strong> {entry.sentOrdersQuantity}
                    </div>
                    <div>
                      <strong>Pedidos Pendentes:</strong> {entry.pendingOrdersQuantity}
                    </div>
                    {entry.delayDescription && (
                      <div className="col-span-full">
                        <strong>Descrição do Motivo:</strong> {entry.delayDescription}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
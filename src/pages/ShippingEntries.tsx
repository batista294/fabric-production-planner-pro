
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Plus } from "lucide-react";
import { toast } from "sonner";

interface ShippingEntry {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  status: string;
  trackingCode?: string;
  date: string;
  shippingCost: number;
}

export default function ShippingEntries() {
  const [shippingEntries, setShippingEntries] = useState<ShippingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [orderId, setOrderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("preparando");
  const [trackingCode, setTrackingCode] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchShippingEntries = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'shipping_entries'));
      const entriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShippingEntry[];
      setShippingEntries(entriesData);
    } catch (error) {
      console.error("Error fetching shipping entries:", error);
      toast.error("Erro ao carregar entregas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingEntries();
  }, []);

  const resetForm = () => {
    setOrderId("");
    setCustomerName("");
    setAddress("");
    setStatus("preparando");
    setTrackingCode("");
    setShippingCost("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const entryData = {
        orderId,
        customerName,
        address,
        status,
        trackingCode: trackingCode || undefined,
        shippingCost: parseFloat(shippingCost),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'shipping_entries'), entryData);
      toast.success("Entrega registrada com sucesso!");
      
      resetForm();
      fetchShippingEntries();
    } catch (error) {
      console.error("Error saving shipping entry:", error);
      toast.error("Erro ao registrar entrega");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Controle de Entregas</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando entregas...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle de Entregas</h1>
          <p className="text-muted-foreground">
            Gerencie as entregas e envios dos pedidos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Nova Entrega</CardTitle>
              <CardDescription>
                Registre uma nova entrega
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">ID do Pedido</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Ex: PED-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">Nome do Cliente</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Endereço completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preparando">Preparando</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingCode">Código de Rastreamento</Label>
                <Input
                  id="trackingCode"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Código de rastreamento (opcional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingCost">Custo do Envio (R$)</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="15.90"
                  required
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Registrando..." : "Registrar Entrega"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Entregas Recentes</CardTitle>
              <CardDescription>
                Últimas entregas registradas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {shippingEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhuma entrega registrada</p>
                <p className="text-sm">Preencha o formulário ao lado para começar</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {shippingEntries.slice(-10).reverse().map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{entry.orderId}</p>
                        <p className="text-sm text-muted-foreground">{entry.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {entry.shippingCost.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{entry.date}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        entry.status === 'entregue' ? 'bg-green-100 text-green-800' :
                        entry.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                        entry.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status}
                      </span>
                      {entry.trackingCode && (
                        <span className="text-xs text-muted-foreground">
                          {entry.trackingCode}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Plus, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

interface Product {
  id: string;
  name: string;
  requiredMaterials?: RequiredMaterial[];
}

interface RequiredMaterial {
  materialId: string;
  materialName: string;
  quantityPerUnit: number;
}

interface RawMaterial {
  id: string;
  name: string;
  stockQuantity: number;
}

export default function ProductionOrders() {
  const navigate = useNavigate();
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [orderId, setOrderId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("pendente");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [ordersSnapshot, productsSnapshot, materialsSnapshot] = await Promise.all([
        getDocs(collection(db, 'production_orders')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'raw_materials'))
      ]);

      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductionOrder[];

      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      const materialsData = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RawMaterial[];

      setProductionOrders(ordersData);
      setProducts(productsData);
      setRawMaterials(materialsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setOrderId("");
    setProductId("");
    setQuantity("");
    setPriority("normal");
    setStatus("pendente");
    setDueDate("");
    setNotes("");
  };

  const checkStockAvailability = (product: Product, orderQuantity: number): boolean => {
    if (!product.requiredMaterials) return true;
    
    for (const requiredMaterial of product.requiredMaterials) {
      const rawMaterial = rawMaterials.find(rm => rm.id === requiredMaterial.materialId);
      if (!rawMaterial) continue;
      
      const totalNeeded = requiredMaterial.quantityPerUnit * orderQuantity;
      if (rawMaterial.stockQuantity < totalNeeded) {
        return false;
      }
    }
    return true;
  };

  const updateMaterialStock = async (product: Product, orderQuantity: number) => {
    if (!product.requiredMaterials) return;
    
    for (const requiredMaterial of product.requiredMaterials) {
      const rawMaterial = rawMaterials.find(rm => rm.id === requiredMaterial.materialId);
      if (!rawMaterial) continue;
      
      const totalUsed = requiredMaterial.quantityPerUnit * orderQuantity;
      const newStock = rawMaterial.stockQuantity - totalUsed;
      
      await updateDoc(doc(db, 'raw_materials', rawMaterial.id), {
        stockQuantity: Math.max(0, newStock)
      });
    }
  };

  const handleStatusChange = async (order: ProductionOrder) => {
    try {
      let newStatus = order.status;
      
      if (order.status === 'pendente') {
        // Verificar estoque antes de iniciar produção
        const product = products.find(p => p.id === order.productId);
        if (product && !checkStockAvailability(product, order.quantity)) {
          toast.error("Estoque de matéria-prima insuficiente para iniciar a produção.");
          return;
        }
        
        // Baixar estoque
        if (product) {
          await updateMaterialStock(product, order.quantity);
        }
        
        newStatus = 'em_producao';
        toast.success("Produção iniciada! Estoque de matéria-prima atualizado.");
      } else if (order.status === 'em_producao') {
        newStatus = 'concluida';
        toast.success("Ordem de produção finalizada!");
      }
      
      await updateDoc(doc(db, 'production_orders', order.id), {
        status: newStatus
      });
      
      fetchData();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Erro ao atualizar status da ordem");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedProduct = products.find(p => p.id === productId);

      const orderData = {
        orderId,
        productId,
        productName: selectedProduct?.name || "",
        quantity: parseInt(quantity),
        priority,
        status,
        dueDate,
        notes: notes || "",
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'production_orders'), orderData);
      toast.success("Ordem de produção criada com sucesso!");
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving production order:", error);
      toast.error("Erro ao criar ordem de produção");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ordens de Produção</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando ordens...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Produção</h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de produção da confecção
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/painel-producao')}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Ver Kanban
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Plus className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Nova Ordem</CardTitle>
              <CardDescription>
                Crie uma nova ordem de produção
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">ID da Ordem</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Ex: OP-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Produto</Label>
                <Select value={productId} onValueChange={setProductId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantidade a produzir"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_producao">Em Produção</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Entrega</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre a ordem"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Criando..." : "Criar Ordem"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ClipboardList className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Ordens Recentes</CardTitle>
              <CardDescription>
                Últimas ordens de produção
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {productionOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhuma ordem registrada</p>
                <p className="text-sm">Preencha o formulário ao lado para começar</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {productionOrders.slice(-10).reverse().map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{order.orderId}</p>
                        <p className="text-sm text-muted-foreground">{order.productName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{order.quantity} unidades</p>
                        <p className="text-sm text-muted-foreground">{order.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(order)}
                          disabled={order.status === 'concluida' || order.status === 'cancelada'}
                          className="text-xs"
                        >
                          {order.status === 'pendente' ? 'Iniciar Produção' : 
                           order.status === 'em_producao' ? 'Finalizar' : 'Concluída'}
                        </Button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'concluida' ? 'bg-green-100 text-green-800' :
                          order.status === 'em_producao' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.priority === 'urgente' ? 'bg-red-100 text-red-800' :
                          order.priority === 'alta' ? 'bg-orange-100 text-orange-800' :
                          order.priority === 'baixa' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.priority}
                        </span>
                      </div>
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

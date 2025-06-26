
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus } from "lucide-react";
import { toast } from "sonner";

interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customerName: string;
  date: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState("pendente");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [salesSnapshot, productsSnapshot] = await Promise.all([
        getDocs(collection(db, 'sales')),
        getDocs(collection(db, 'products'))
      ]);

      const salesData = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[];

      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      setSales(salesData);
      setProducts(productsData);
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
    setProductId("");
    setQuantity("");
    setCustomerName("");
    setStatus("pendente");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedProduct = products.find(p => p.id === productId);
      const unitPrice = selectedProduct?.price || 0;
      const totalPrice = unitPrice * parseInt(quantity);

      const saleData = {
        productId,
        productName: selectedProduct?.name || "",
        quantity: parseInt(quantity),
        unitPrice,
        totalPrice,
        customerName,
        status,
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'sales'), saleData);
      toast.success("Venda registrada com sucesso!");
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving sale:", error);
      toast.error("Erro ao registrar venda");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === productId);
  const estimatedTotal = selectedProduct && quantity ? selectedProduct.price * parseInt(quantity) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vendas</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando dados...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">
            Registre e gerencie as vendas realizadas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Nova Venda</CardTitle>
              <CardDescription>
                Registre uma nova venda realizada
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produto</Label>
                <Select value={productId} onValueChange={setProductId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - R$ {product.price.toFixed(2)}
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
                  placeholder="Quantidade vendida"
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
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {estimatedTotal > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    Total estimado: <strong>R$ {estimatedTotal.toFixed(2)}</strong>
                  </p>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Registrando..." : "Registrar Venda"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Vendas Recentes</CardTitle>
              <CardDescription>
                Últimas vendas registradas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhuma venda registrada</p>
                <p className="text-sm">Preencha o formulário ao lado para começar</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sales.slice(-10).reverse().map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{sale.productName}</p>
                        <p className="text-sm text-muted-foreground">{sale.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">R$ {sale.totalPrice.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{sale.quantity} un.</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sale.status === 'entregue' ? 'bg-green-100 text-green-800' :
                        sale.status === 'confirmada' ? 'bg-blue-100 text-blue-800' :
                        sale.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sale.status}
                      </span>
                      <span className="text-sm text-muted-foreground">{sale.date}</span>
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

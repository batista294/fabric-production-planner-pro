
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";

interface FailureEntry {
  id: string;
  productId: string;
  productName: string;
  failureTypeId: string;
  failureTypeName: string;
  failureCategory: string;
  quantity: number;
  date: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
}

interface FailureType {
  id: string;
  name: string;
  category: string;
}

export default function FailureEntries() {
  const [failureEntries, setFailureEntries] = useState<FailureEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [failureTypes, setFailureTypes] = useState<FailureType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [productId, setProductId] = useState("");
  const [failureTypeId, setFailureTypeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [entriesSnapshot, productsSnapshot, failureTypesSnapshot] = await Promise.all([
        getDocs(collection(db, 'failure_entries')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'failure_types'))
      ]);

      const entriesData = entriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FailureEntry[];

      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      const failureTypesData = failureTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FailureType[];

      setFailureEntries(entriesData);
      setProducts(productsData);
      setFailureTypes(failureTypesData);
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
    setFailureTypeId("");
    setQuantity("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedProduct = products.find(p => p.id === productId);
      const selectedFailureType = failureTypes.find(ft => ft.id === failureTypeId);

      const entryData = {
        productId,
        productName: selectedProduct?.name || "",
        failureTypeId,
        failureTypeName: selectedFailureType?.name || "",
        failureCategory: selectedFailureType?.category || "",
        quantity: parseInt(quantity),
        date: new Date().toISOString().split('T')[0],
        description: description || ""
      };

      await addDoc(collection(db, 'failure_entries'), entryData);
      toast.success("Lançamento de falha registrado com sucesso!");
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving failure entry:", error);
      toast.error("Erro ao registrar lançamento");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      estampa: "bg-blue-100 text-blue-800",
      costura: "bg-green-100 text-green-800",
      corte: "bg-orange-100 text-orange-800",
      acabamento: "bg-purple-100 text-purple-800",
      qualidade: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lançamento de Falhas</h1>
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
          <h1 className="text-2xl font-bold">Lançamento de Falhas</h1>
          <p className="text-muted-foreground">
            Registre as falhas identificadas na produção
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Plus className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Novo Lançamento</CardTitle>
              <CardDescription>
                Registre uma nova falha identificada
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
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="failureType">Tipo de Falha</Label>
                <Select value={failureTypeId} onValueChange={setFailureTypeId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de falha" />
                  </SelectTrigger>
                  <SelectContent>
                    {failureTypes.map((failureType) => (
                      <SelectItem key={failureType.id} value={failureType.id}>
                        {failureType.name} ({failureType.category})
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
                  placeholder="Quantidade com falha"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição detalhada da falha"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Registrando..." : "Registrar Lançamento"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Lançamentos Recentes</CardTitle>
              <CardDescription>
                Últimas falhas registradas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {failureEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum lançamento registrado</p>
                <p className="text-sm">Preencha o formulário ao lado para começar</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {failureEntries.slice(-10).reverse().map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{entry.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(entry.failureCategory)}>
                            {entry.failureTypeName}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{entry.quantity} unidades</p>
                        <p className="text-sm text-muted-foreground">{entry.date}</p>
                      </div>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-2">{entry.description}</p>
                    )}
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

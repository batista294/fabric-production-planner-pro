
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Plus } from "lucide-react";
import { toast } from "sonner";

interface SewingEntry {
  id: string;
  productId: string;
  productName: string;
  employeeId: string;
  employeeName: string;
  quantity: number;
  date: string;
  notes?: string;
}

interface Product {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

export default function SewingEntries() {
  const [sewingEntries, setSewingEntries] = useState<SewingEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [productId, setProductId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [entriesSnapshot, productsSnapshot, employeesSnapshot] = await Promise.all([
        getDocs(collection(db, 'sewing_entries')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'employees'))
      ]);

      const entriesData = entriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SewingEntry[];

      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];

      setSewingEntries(entriesData);
      setProducts(productsData);
      setEmployees(employeesData);
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
    setEmployeeId("");
    setQuantity("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedProduct = products.find(p => p.id === productId);
      const selectedEmployee = employees.find(emp => emp.id === employeeId);

      const entryData = {
        productId,
        productName: selectedProduct?.name || "",
        employeeId,
        employeeName: selectedEmployee?.name || "",
        quantity: parseInt(quantity),
        date: new Date().toISOString().split('T')[0],
        notes: notes || ""
      };

      await addDoc(collection(db, 'sewing_entries'), entryData);
      toast.success("Lançamento de costura registrado com sucesso!");
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving sewing entry:", error);
      toast.error("Erro ao registrar lançamento");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lançamento de Costuras</h1>
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
          <h1 className="text-2xl font-bold">Lançamento de Costuras</h1>
          <p className="text-muted-foreground">
            Registre as costuras realizadas na produção
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
              <CardTitle>Novo Lançamento</CardTitle>
              <CardDescription>
                Registre uma nova costura realizada
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
                <Label htmlFor="employee">Funcionário</Label>
                <Select value={employeeId} onValueChange={setEmployeeId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
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
                  placeholder="Quantidade costurada"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações opcionais"
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
            <div className="p-2 bg-green-50 rounded-lg">
              <Scissors className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Lançamentos Recentes</CardTitle>
              <CardDescription>
                Últimas costuras registradas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {sewingEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scissors className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum lançamento registrado</p>
                <p className="text-sm">Preencha o formulário ao lado para começar</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sewingEntries.slice(-10).reverse().map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{entry.productName}</p>
                        <p className="text-sm text-muted-foreground">{entry.employeeName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{entry.quantity} unidades</p>
                        <p className="text-sm text-muted-foreground">{entry.date}</p>
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{entry.notes}</p>
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

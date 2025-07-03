
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface FailureType {
  id: string;
  name: string;
  category: string;
}

const categories = [
  { value: "estampa", label: "Estampa" },
  { value: "costura", label: "Costura" },
  { value: "corte", label: "Corte" },
  { value: "acabamento", label: "Acabamento" },
  { value: "qualidade", label: "Qualidade" },
];

export default function FailureTypes() {
  const [failureTypes, setFailureTypes] = useState<FailureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFailureType, setEditingFailureType] = useState<FailureType | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFailureTypes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'failure_types'));
      const failureTypesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FailureType[];
      setFailureTypes(failureTypesData);
    } catch (error) {
      console.error("Error fetching failure types:", error);
      toast.error("Erro ao carregar tipos de falha");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailureTypes();
  }, []);

  const resetForm = () => {
    setName("");
    setCategory("");
    setEditingFailureType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const failureTypeData = { name, category };

      if (editingFailureType) {
        await updateDoc(doc(db, 'failure_types', editingFailureType.id), failureTypeData);
        toast.success("Tipo de falha atualizado com sucesso!");
      } else {
        await addDoc(collection(db, 'failure_types'), failureTypeData);
        toast.success("Tipo de falha cadastrado com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchFailureTypes();
    } catch (error) {
      console.error("Error saving failure type:", error);
      toast.error("Erro ao salvar tipo de falha");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (failureType: FailureType) => {
    setEditingFailureType(failureType);
    setName(failureType.name);
    setCategory(failureType.category);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de falha?")) return;

    try {
      await deleteDoc(doc(db, 'failure_types', id));
      toast.success("Tipo de falha excluído com sucesso!");
      fetchFailureTypes();
    } catch (error) {
      console.error("Error deleting failure type:", error);
      toast.error("Erro ao excluir tipo de falha");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const getCategoryLabel = (categoryValue: string) => {
    return categories.find(cat => cat.value === categoryValue)?.label || categoryValue;
  };

  const getCategoryVariant = (category: string): "estampa" | "costura" | "corte" | "acabamento" | "qualidade" | "secondary" => {
    const variants: Record<string, "estampa" | "costura" | "corte" | "acabamento" | "qualidade"> = {
      estampa: "estampa",
      costura: "costura", 
      corte: "corte",
      acabamento: "acabamento",
      qualidade: "qualidade",
    };
    return variants[category] || "secondary";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tipos de Falha</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando tipos de falha...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Falha</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias de falhas da produção
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Tipo de Falha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFailureType ? "Editar Tipo de Falha" : "Novo Tipo de Falha"}
              </DialogTitle>
              <DialogDescription>
                {editingFailureType 
                  ? "Atualize as informações do tipo de falha" 
                  : "Cadastre um novo tipo de falha no sistema"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Falha</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Linha desalinhada"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting 
                    ? (editingFailureType ? "Atualizando..." : "Cadastrando...") 
                    : (editingFailureType ? "Atualizar" : "Cadastrar")
                  }
                </Button>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-failure rounded-lg">
            <AlertTriangle className="h-6 w-6 text-failure-foreground" />
          </div>
          <div>
            <CardTitle>Tipos de Falha Cadastrados</CardTitle>
            <CardDescription>
              {failureTypes.length} tipo{failureTypes.length !== 1 ? 's' : ''} de falha cadastrado{failureTypes.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {failureTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhum tipo de falha cadastrado</p>
              <p className="text-sm">Clique em "Novo Tipo de Falha" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Falha</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failureTypes.map((failureType) => (
                  <TableRow key={failureType.id}>
                    <TableCell className="font-medium">{failureType.name}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryVariant(failureType.category)}>
                        {getCategoryLabel(failureType.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(failureType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(failureType.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

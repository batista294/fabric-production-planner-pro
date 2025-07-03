
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
import { Plus, Edit, Trash2, Palette } from "lucide-react";
import { toast } from "sonner";

interface StampType {
  id: string;
  name: string;
  description: string;
}

export default function StampTypes() {
  const [stampTypes, setStampTypes] = useState<StampType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStampType, setEditingStampType] = useState<StampType | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStampTypes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'stamp_types'));
      const stampTypesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StampType[];
      setStampTypes(stampTypesData);
    } catch (error) {
      console.error("Error fetching stamp types:", error);
      toast.error("Erro ao carregar tipos de estampa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStampTypes();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingStampType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const stampTypeData = { name, description };

      if (editingStampType) {
        await updateDoc(doc(db, 'stamp_types', editingStampType.id), stampTypeData);
        toast.success("Tipo de estampa atualizado com sucesso!");
      } else {
        await addDoc(collection(db, 'stamp_types'), stampTypeData);
        toast.success("Tipo de estampa cadastrado com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchStampTypes();
    } catch (error) {
      console.error("Error saving stamp type:", error);
      toast.error("Erro ao salvar tipo de estampa");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (stampType: StampType) => {
    setEditingStampType(stampType);
    setName(stampType.name);
    setDescription(stampType.description);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de estampa?")) return;

    try {
      await deleteDoc(doc(db, 'stamp_types', id));
      toast.success("Tipo de estampa excluído com sucesso!");
      fetchStampTypes();
    } catch (error) {
      console.error("Error deleting stamp type:", error);
      toast.error("Erro ao excluir tipo de estampa");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tipos de Estampa</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando tipos de estampa...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Estampa</h1>
          <p className="text-muted-foreground">
            Gerencie os tipos de estampa utilizados na produção
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Tipo de Estampa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStampType ? "Editar Tipo de Estampa" : "Novo Tipo de Estampa"}
              </DialogTitle>
              <DialogDescription>
                {editingStampType 
                  ? "Atualize as informações do tipo de estampa" 
                  : "Cadastre um novo tipo de estampa no sistema"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Tipo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sublimação, DTF, Serigrafia"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição detalhada do tipo de estampa"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting 
                    ? (editingStampType ? "Atualizando..." : "Cadastrando...") 
                    : (editingStampType ? "Atualizar" : "Cadastrar")
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
          <div className="p-2 bg-stamp rounded-lg">
            <Palette className="h-6 w-6 text-stamp-foreground" />
          </div>
          <div>
            <CardTitle>Tipos de Estampa Cadastrados</CardTitle>
            <CardDescription>
              {stampTypes.length} tipo{stampTypes.length !== 1 ? 's' : ''} de estampa cadastrado{stampTypes.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {stampTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhum tipo de estampa cadastrado</p>
              <p className="text-sm">Clique em "Novo Tipo de Estampa" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stampTypes.map((stampType) => (
                  <TableRow key={stampType.id}>
                    <TableCell className="font-medium">{stampType.name}</TableCell>
                    <TableCell>{stampType.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(stampType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(stampType.id)}
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

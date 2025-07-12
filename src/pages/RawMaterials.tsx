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
import { Plus, Edit, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";

interface RawMaterial {
  id: string;
  name: string;
  description: string;
  unit: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export default function RawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'raw_materials'));
      const materialsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RawMaterial[];
      setMaterials(materialsData);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("Erro ao carregar matérias-primas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setUnit("");
    setStockQuantity("");
    setLowStockThreshold("");
    setEditingMaterial(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const materialData = {
        name,
        description,
        unit,
        stockQuantity: parseFloat(stockQuantity),
        lowStockThreshold: parseFloat(lowStockThreshold)
      };

      if (editingMaterial) {
        await updateDoc(doc(db, 'raw_materials', editingMaterial.id), materialData);
        toast.success("Matéria-prima atualizada com sucesso!");
      } else {
        await addDoc(collection(db, 'raw_materials'), materialData);
        toast.success("Matéria-prima cadastrada com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error("Error saving material:", error);
      toast.error("Erro ao salvar matéria-prima");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setName(material.name);
    setDescription(material.description);
    setUnit(material.unit);
    setStockQuantity(material.stockQuantity.toString());
    setLowStockThreshold(material.lowStockThreshold.toString());
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta matéria-prima?")) return;

    try {
      await deleteDoc(doc(db, 'raw_materials', id));
      toast.success("Matéria-prima excluída com sucesso!");
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Erro ao excluir matéria-prima");
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
          <h1 className="text-2xl font-bold">Matérias-Primas</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando matérias-primas...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matérias-Primas</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque de matérias-primas
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Matéria-Prima
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? "Editar Matéria-Prima" : "Nova Matéria-Prima"}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial 
                  ? "Atualize as informações da matéria-prima" 
                  : "Cadastre uma nova matéria-prima no estoque"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Matéria-Prima</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Tecido Algodão"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição da matéria-prima"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Ex: kg, m, unidades"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Quantidade em Estoque</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  step="0.01"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Limite Mínimo de Estoque</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  step="0.01"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="10"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting 
                    ? (editingMaterial ? "Atualizando..." : "Cadastrando...") 
                    : (editingMaterial ? "Atualizar" : "Cadastrar")
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
          <div className="p-2 bg-primary/10 rounded-lg">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Matérias-Primas Cadastradas</CardTitle>
            <CardDescription>
              {materials.length} matéria{materials.length !== 1 ? 's' : ''}-prima{materials.length !== 1 ? 's' : ''} cadastrada{materials.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhuma matéria-prima cadastrada</p>
              <p className="text-sm">Clique em "Nova Matéria-Prima" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{material.stockQuantity}</span>
                        {material.stockQuantity <= material.lowStockThreshold && (
                          <Badge variant="destructive" className="text-xs">
                            Estoque Baixo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>{material.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(material.id)}
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
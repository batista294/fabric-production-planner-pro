import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Cell {
  id: string;
  name: string;
  description: string;
}

export default function Cells() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCells();
  }, []);

  const loadCells = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "cells"));
      const cellsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cell[];
      setCells(cellsData);
    } catch (error) {
      console.error("Error loading cells:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar células",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da célula é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCell) {
        await updateDoc(doc(db, "cells", editingCell.id), formData);
        toast({
          title: "Sucesso",
          description: "Célula atualizada com sucesso",
        });
      } else {
        await addDoc(collection(db, "cells"), formData);
        toast({
          title: "Sucesso",
          description: "Célula cadastrada com sucesso",
        });
      }
      
      setFormData({ name: "", description: "" });
      setEditingCell(null);
      setIsDialogOpen(false);
      loadCells();
    } catch (error) {
      console.error("Error saving cell:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar célula",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cell: Cell) => {
    setEditingCell(cell);
    setFormData({
      name: cell.name,
      description: cell.description,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (cellId: string) => {
    if (confirm("Tem certeza que deseja excluir esta célula?")) {
      try {
        await deleteDoc(doc(db, "cells", cellId));
        toast({
          title: "Sucesso",
          description: "Célula excluída com sucesso",
        });
        loadCells();
      } catch (error) {
        console.error("Error deleting cell:", error);
        toast({
          title: "Erro",
          description: "Erro ao excluir célula",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingCell(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cadastro de Células</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Célula
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCell ? "Editar Célula" : "Nova Célula"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Célula</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome da célula"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Digite a descrição da célula"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCell ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {cells.map((cell) => (
          <Card key={cell.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{cell.name}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cell)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(cell.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{cell.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
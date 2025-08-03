import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

interface SewingPiece {
  id: string;
  date: string;
  sewingDescription: string;
  productionCell: string;
  peopleCount: number;
  products: string[];
}

interface Cell {
  id: string;
  name: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
}

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

export default function SewingPieces() {
  const [sewingPieces, setSewingPieces] = useState<SewingPiece[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sewingEntries, setSewingEntries] = useState<SewingEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState<SewingPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: "",
    sewingDescription: "",
    productionCell: "",
    peopleCount: 1,
    products: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Load sewing pieces
      const sewingPiecesSnapshot = await getDocs(collection(db, "sewingPieces"));
      const sewingPiecesData = sewingPiecesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SewingPiece[];
      setSewingPieces(sewingPiecesData);

      // Load cells
      const cellsSnapshot = await getDocs(collection(db, "cells"));
      const cellsData = cellsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cell[];
      setCells(cellsData);

      // Load products
      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);

      // Load sewing entries for descriptions
      const sewingEntriesSnapshot = await getDocs(collection(db, "sewingEntries"));
      const sewingEntriesData = sewingEntriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SewingEntry[];
      setSewingEntries(sewingEntriesData);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.sewingDescription || !formData.productionCell || formData.products.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const pieceData = {
        date: formData.date,
        sewingDescription: formData.sewingDescription,
        productionCell: formData.productionCell,
        peopleCount: formData.peopleCount,
        products: formData.products,
        createdAt: new Date().toISOString(),
      };

      if (editingPiece) {
        await updateDoc(doc(db, "sewingPieces", editingPiece.id), pieceData);
        toast({
          title: "Sucesso",
          description: "Peça costurada atualizada com sucesso!",
        });
      } else {
        await addDoc(collection(db, "sewingPieces"), pieceData);
        toast({
          title: "Sucesso",
          description: "Peça costurada cadastrada com sucesso!",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar peça costurada",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (piece: SewingPiece) => {
    setEditingPiece(piece);
    setFormData({
      date: piece.date,
      sewingDescription: piece.sewingDescription,
      productionCell: piece.productionCell,
      peopleCount: piece.peopleCount,
      products: piece.products,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (pieceId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta peça costurada?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "sewingPieces", pieceId));
      toast({
        title: "Sucesso",
        description: "Peça costurada excluída com sucesso!",
      });
      fetchData();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir peça costurada",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      sewingDescription: "",
      productionCell: "",
      peopleCount: 1,
      products: [],
    });
    setEditingPiece(null);
  };

  const getProductNames = (productIds: string[]) => {
    return productIds.map(id => {
      const product = products.find(p => p.id === id);
      return product?.name || id;
    }).join(", ");
  };

  const getCellName = (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    return cell?.name || cellId;
  };

  // Get unique sewing descriptions from sewing entries
  const uniqueSewingDescriptions = [...new Set(sewingEntries.map(entry => entry.notes || "").filter(Boolean))];

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cadastro de Peças Costuradas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Peça Costurada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPiece ? "Editar Peça Costurada" : "Nova Peça Costurada"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Quantidade de Pessoas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.peopleCount}
                    onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Descrição da Costura</Label>
                <Select
                  value={formData.sewingDescription}
                  onValueChange={(value) => setFormData({ ...formData, sewingDescription: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar descrição" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSewingDescriptions.map((description, index) => (
                      <SelectItem key={index} value={description}>
                        {description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Célula de Produção</Label>
                <Select
                  value={formData.productionCell}
                  onValueChange={(value) => setFormData({ ...formData, productionCell: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar célula" />
                  </SelectTrigger>
                  <SelectContent>
                    {cells.map((cell) => (
                      <SelectItem key={cell.id} value={cell.id}>
                        {cell.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Produtos</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.products.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              products: [...formData.products, product.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              products: formData.products.filter(id => id !== product.id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{product.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPiece ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sewingPieces.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma peça costurada cadastrada
            </CardContent>
          </Card>
        ) : (
          sewingPieces.map((piece) => (
            <Card key={piece.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{piece.sewingDescription}</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(piece)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(piece.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Data:</strong> {new Date(piece.date).toLocaleDateString("pt-BR")}</p>
                  <p><strong>Célula:</strong> {getCellName(piece.productionCell)}</p>
                  <p><strong>Pessoas:</strong> {piece.peopleCount}</p>
                  <p><strong>Produtos:</strong> {getProductNames(piece.products)}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
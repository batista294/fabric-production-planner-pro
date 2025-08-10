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
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SewingProduct {
  productId: string;
  productName: string;
  quantity: number;
}

interface SewingPiece {
  id: string;
  date: string;
  sewingDescription: string;
  productionCell: string;
  peopleCount: number;
  products: SewingProduct[];
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
    products: [] as SewingProduct[],
  });

  // Product dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState(0);

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

  const resetProductDialog = () => {
    setSelectedProductId("");
    setProductQuantity(0);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setProductQuantity(0);
  };

  const addProductToList = () => {
    const product = products.find(p => p.id === selectedProductId);
    
    if (!product || productQuantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um produto e defina a quantidade",
        variant: "destructive",
      });
      return;
    }

    const sewingProduct: SewingProduct = {
      productId: product.id,
      productName: product.name,
      quantity: productQuantity
    };

    setFormData({
      ...formData,
      products: [...formData.products, sewingProduct]
    });
    setProductDialogOpen(false);
    resetProductDialog();
    toast({
      title: "Sucesso",
      description: "Produto adicionado ao lançamento",
    });
  };

  const removeProductFromList = (index: number) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: newProducts });
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Produtos Selecionados</Label>
                  <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Produto
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Produto</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Produto</Label>
                          <Select value={selectedProductId} onValueChange={handleProductSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
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

                        {selectedProductId && (
                          <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              value={productQuantity}
                              onChange={(e) => setProductQuantity(parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min="1"
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button type="button" onClick={addProductToList}>
                            Adicionar
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {formData.products.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-3">
                    {formData.products.map((product, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/50 rounded p-2">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <Badge variant="outline" className="text-xs">
                            Quantidade: {product.quantity}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProductFromList(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <p><strong>Data:</strong> {new Date(piece.date).toLocaleDateString("pt-BR")}</p>
                  <p><strong>Célula:</strong> {getCellName(piece.productionCell)}</p>
                  <p><strong>Pessoas:</strong> {piece.peopleCount}</p>
                </div>
                {piece.products && piece.products.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Produtos:</p>
                    {piece.products.map((product, index) => (
                      <div key={index} className="text-xs bg-muted/50 rounded p-2">
                        <p className="font-medium">{product.productName}</p>
                        <Badge variant="outline" className="text-xs">
                          Quantidade: {product.quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
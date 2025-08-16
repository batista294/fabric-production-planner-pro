import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, X, Filter } from "lucide-react";

interface SewingProduct {
  productId: string;
  productName: string;
  quantity: number;
}

interface SewingPiece {
  id: string;
  date: string;
  description: string;
  cellId: string;
  peopleCount: number;
  products: SewingProduct[];
}

interface Cell {
  id: string;
  name: string;
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
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductQuantity, setSelectedProductQuantity] = useState(1);

  const [formData, setFormData] = useState({
    date: "",
    description: "",
    cellId: "",
    peopleCount: 1,
    products: [] as SewingProduct[],
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch sewing pieces
      const sewingPiecesSnapshot = await getDocs(collection(db, "sewingPieces"));
      const sewingPiecesData = sewingPiecesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SewingPiece[];

      // Fetch cells
      const cellsSnapshot = await getDocs(collection(db, "cells"));
      const cellsData = cellsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cell[];

      // Fetch products
      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Fetch sewing entries
      const sewingEntriesSnapshot = await getDocs(collection(db, "sewingEntries"));
      const sewingEntriesData = sewingEntriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SewingEntry[];

      setSewingPieces(sewingPiecesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCells(cellsData);
      setProducts(productsData);
      setSewingEntries(sewingEntriesData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
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
    
    if (!formData.date || !formData.description || !formData.cellId || formData.products.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios e adicione pelo menos um produto",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        // Update existing sewing piece
        await updateDoc(doc(db, "sewingPieces", editingId), {
          date: formData.date,
          description: formData.description,
          cellId: formData.cellId,
          peopleCount: formData.peopleCount,
          products: formData.products,
        });

        setSewingPieces(prev => prev.map(piece => 
          piece.id === editingId 
            ? { ...piece, ...formData }
            : piece
        ));

        toast({
          title: "Sucesso",
          description: "Peça costurada atualizada com sucesso",
        });
      } else {
        // Add new sewing piece
        const docRef = await addDoc(collection(db, "sewingPieces"), {
          date: formData.date,
          description: formData.description,
          cellId: formData.cellId,
          peopleCount: formData.peopleCount,
          products: formData.products,
        });

        const newSewingPiece = {
          id: docRef.id,
          ...formData,
        };

        setSewingPieces(prev => [newSewingPiece, ...prev]);

        toast({
          title: "Sucesso",
          description: "Peça costurada criada com sucesso",
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar peça costurada:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar peça costurada",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (sewingPiece: SewingPiece) => {
    setFormData({
      date: sewingPiece.date,
      description: sewingPiece.description,
      cellId: sewingPiece.cellId,
      peopleCount: sewingPiece.peopleCount,
      products: sewingPiece.products,
    });
    setEditingId(sewingPiece.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta peça costurada?")) {
      try {
        await deleteDoc(doc(db, "sewingPieces", id));
        setSewingPieces(prev => prev.filter(piece => piece.id !== id));
        toast({
          title: "Sucesso",
          description: "Peça costurada excluída com sucesso",
        });
      } catch (error) {
        console.error("Erro ao excluir peça costurada:", error);
        toast({
          title: "Erro",
          description: "Erro ao excluir peça costurada",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      description: "",
      cellId: "",
      peopleCount: 1,
      products: [],
    });
    setEditingId(null);
  };

  const addProductToList = () => {
    if (!selectedProductId) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive",
      });
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) return;

    // Check if product is already in the list
    const existingProductIndex = formData.products.findIndex(p => p.productId === selectedProductId);
    if (existingProductIndex !== -1) {
      // Update quantity if product already exists
      const updatedProducts = [...formData.products];
      updatedProducts[existingProductIndex].quantity += selectedProductQuantity;
      setFormData(prev => ({ ...prev, products: updatedProducts }));
    } else {
      // Add new product to list
      const newProduct: SewingProduct = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: selectedProductQuantity,
      };
      setFormData(prev => ({ ...prev, products: [...prev.products, newProduct] }));
    }

    setSelectedProductId("");
    setSelectedProductQuantity(1);
    setIsProductDialogOpen(false);
  };

  const removeProductFromList = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.productId !== productId)
    }));
  };

  const getCellName = (cellId: string) => {
    const cell = cells.find(c => c.id === cellId);
    return cell ? cell.name : "Célula não encontrada";
  };

  const getTotalQuantity = (products: SewingProduct[]) => {
    return products.reduce((total, product) => total + product.quantity, 0);
  };

  const getOverallTotalQuantity = () => {
    return sewingPieces.reduce((total, piece) => {
      return total + getTotalQuantity(piece.products);
    }, 0);
  };


  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Peças Costuradas</h1>
          <p className="text-muted-foreground">Gerencie as peças costuradas</p>
          {sewingPieces.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Total de peças: {getOverallTotalQuantity()}</strong>
            </p>
          )}
        </div>
        
        <div className="flex space-x-2">

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Peça
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Peça Costurada" : "Nova Peça Costurada"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="peopleCount">Quantidade de Pessoas</Label>
                  <Input
                    id="peopleCount"
                    type="number"
                    min="1"
                    value={formData.peopleCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, peopleCount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cellId">Célula de Produção *</Label>
                <Select value={formData.cellId} onValueChange={(value) => setFormData(prev => ({ ...prev, cellId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma célula" />
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
                <div className="flex justify-between items-center mb-2">
                  <Label>Produtos *</Label>
                  <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
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
                        <div>
                          <Label>Produto</Label>
                          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
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
                        <div>
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={selectedProductQuantity}
                            onChange={(e) => setSelectedProductQuantity(Number(e.target.value))}
                          />
                        </div>
                        <Button type="button" onClick={addProductToList} className="w-full">
                          Adicionar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {formData.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum produto selecionado</p>
                  ) : (
                    formData.products.map((product) => (
                      <div key={product.productId} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">
                          {product.productName} (Qty: {product.quantity})
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductFromList(product.productId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? "Atualizar" : "Criar"} Peça
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>


      <div className="grid gap-4">
        {sewingPieces.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">Nenhuma peça costurada encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          sewingPieces.map((sewingPiece) => (
            <Card key={sewingPiece.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{sewingPiece.description}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(sewingPiece.date).toLocaleDateString("pt-BR")} - {getCellName(sewingPiece.cellId)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(sewingPiece)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(sewingPiece.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Pessoas:</strong> {sewingPiece.peopleCount} | <strong>Total de peças:</strong> {getTotalQuantity(sewingPiece.products)}
                  </p>
                  <div>
                    <strong className="text-sm">Produtos:</strong>
                    <ul className="text-sm text-muted-foreground ml-4">
                      {sewingPiece.products.map((product, index) => (
                        <li key={index}>
                          • {product.productName} (Qty: {product.quantity})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
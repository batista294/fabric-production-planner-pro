import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Plus, Trash2, Package, Edit, MoreVertical } from "lucide-react";
import { toast } from "sonner";

interface ProductSize {
  size: string;
  quantity: number;
}

interface PrintProduct {
  productId: string;
  productName: string;
  sizes: ProductSize[];
}

interface PrintEntry {
  id: string;
  date: string;
  description: string;
  stampTypeId: string;
  stampTypeName: string;
  peopleCount: number;
  products: PrintProduct[];
}

interface StampType {
  id: string;
  name: string;
}

interface ProductVariant {
  size: string;
  selected: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stampTypeId: string;
  stampTypeName: string;
  imageUrl?: string;
  variants: ProductVariant[];
}

export default function PrintEntries() {
  const [printEntries, setPrintEntries] = useState<PrintEntry[]>([]);
  const [stampTypes, setStampTypes] = useState<StampType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [stampTypeId, setStampTypeId] = useState("");
  const [peopleCount, setPeopleCount] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<PrintProduct[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Product dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);

  // Edit and delete states
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [entriesSnapshot, stampTypesSnapshot, productsSnapshot] = await Promise.all([
        getDocs(collection(db, 'print_entries')),
        getDocs(collection(db, 'stamp_types')),
        getDocs(collection(db, 'products'))
      ]);

      const entriesData = entriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrintEntry[];

      const stampTypesData = stampTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StampType[];

      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      setPrintEntries(entriesData);
      setStampTypes(stampTypesData);
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
    setDate(new Date().toISOString().split('T')[0]);
    setDescription("");
    setStampTypeId("");
    setPeopleCount("");
    setSelectedProducts([]);
    setEditingEntryId(null);
  };

  const handleEdit = (entry: PrintEntry) => {
    setDate(entry.date);
    setDescription(entry.description);
    setStampTypeId(entry.stampTypeId);
    setPeopleCount(entry.peopleCount.toString());
    setSelectedProducts(entry.products);
    setEditingEntryId(entry.id);
    toast.success("Lançamento carregado para edição");
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, 'print_entries', entryId));
      toast.success("Lançamento excluído com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Erro ao excluir lançamento");
    }
    setEntryToDelete(null);
  };

  const resetProductDialog = () => {
    setSelectedProductId("");
    setProductSizes([]);
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProductId(productId);
      // Filter only selected variants (where selected is true)
      const selectedVariants = product.variants.filter(v => v.selected);
      setProductSizes(selectedVariants.map(v => ({ size: v.size, quantity: 0 })));
    }
  };

  const updateProductSizeQuantity = (sizeIndex: number, quantity: number) => {
    const newSizes = [...productSizes];
    newSizes[sizeIndex].quantity = quantity;
    setProductSizes(newSizes);
  };

  const addProductToList = () => {
    const product = products.find(p => p.id === selectedProductId);
    const sizesWithQuantity = productSizes.filter(s => s.quantity > 0);
    
    if (!product || sizesWithQuantity.length === 0) {
      toast.error("Selecione um produto e defina as quantidades");
      return;
    }

    const printProduct: PrintProduct = {
      productId: product.id,
      productName: product.name,
      sizes: sizesWithQuantity
    };

    setSelectedProducts([...selectedProducts, printProduct]);
    setProductDialogOpen(false);
    resetProductDialog();
    toast.success("Produto adicionado ao lançamento");
  };

  const removeProductFromList = (index: number) => {
    const newProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newProducts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (selectedProducts.length === 0) {
        toast.error("Adicione pelo menos um produto ao lançamento");
        setSubmitting(false);
        return;
      }

      const selectedStampType = stampTypes.find(st => st.id === stampTypeId);

      const entryData = {
        date,
        description,
        stampTypeId,
        stampTypeName: selectedStampType?.name || "",
        peopleCount: parseInt(peopleCount),
        products: selectedProducts
      };

      if (editingEntryId) {
        await updateDoc(doc(db, 'print_entries', editingEntryId), entryData);
        toast.success("Lançamento de impressão atualizado com sucesso!");
      } else {
        await addDoc(collection(db, 'print_entries'), entryData);
        toast.success("Lançamento de impressão registrado com sucesso!");
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving print entry:", error);
      toast.error("Erro ao registrar lançamento");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lançamento de Impressões</h1>
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
          <h1 className="text-2xl font-bold">Lançamento de Impressões</h1>
          <p className="text-muted-foreground">
            Registre as impressões realizadas na produção
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Novo Lançamento</CardTitle>
              <CardDescription>
                Registre uma nova impressão realizada
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data de Impressão</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição da Impressão</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o lançamento de impressão"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stampType">Tipo de Estampa</Label>
                <Select value={stampTypeId} onValueChange={setStampTypeId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de estampa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stampTypes.map((stampType) => (
                      <SelectItem key={stampType.id} value={stampType.id}>
                        {stampType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="peopleCount">Quantidade de Pessoas no Processo</Label>
                <Input
                  id="peopleCount"
                  type="number"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  placeholder="Número de pessoas"
                  required
                />
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
                        <DialogDescription>
                          Selecione um produto e defina as quantidades por tamanho
                        </DialogDescription>
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
                            <Label>Quantidades por Tamanho</Label>
                            <div className="grid grid-cols-2 gap-4">
                              {productSizes.map((size, index) => (
                                <div key={size.size} className="space-y-1">
                                  <Label className="text-sm">{size.size}</Label>
                                  <Input
                                    type="number"
                                    value={size.quantity}
                                    onChange={(e) => updateProductSizeQuantity(index, parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                  />
                                </div>
                              ))}
                            </div>
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

                {selectedProducts.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-3">
                    {selectedProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/50 rounded p-2">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <div className="flex gap-1 flex-wrap">
                            {product.sizes.map((size) => (
                              <Badge key={size.size} variant="outline" className="text-xs">
                                {size.size}: {size.quantity}
                              </Badge>
                            ))}
                          </div>
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

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting 
                  ? (editingEntryId ? "Atualizando..." : "Registrando...") 
                  : (editingEntryId ? "Atualizar Lançamento" : "Registrar Lançamento")
                }
              </Button>
              {editingEntryId && (
                <Button type="button" variant="outline" onClick={resetForm} className="w-full">
                  Cancelar Edição
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Printer className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Lançamentos Recentes</CardTitle>
              <CardDescription>
                Últimas impressões registradas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {printEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum lançamento registrado</p>
                <p className="text-sm">Preencha o formulário ao lado para começar</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {printEntries.slice(-10).reverse().map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">{entry.stampTypeName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold">{entry.peopleCount} pessoas</p>
                          <p className="text-sm text-muted-foreground">{entry.date}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(entry)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setEntryToDelete(entry.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {entry.products?.map((product, index) => (
                        <div key={index} className="text-xs bg-muted/50 rounded p-2">
                          <p className="font-medium">{product.productName}</p>
                          <div className="flex gap-1 flex-wrap">
                            {product.sizes.map((size) => (
                              <Badge key={size.size} variant="outline" className="text-xs">
                                {size.size}: {size.quantity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento de impressão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => entryToDelete && handleDelete(entryToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Package, Calculator, FileText } from "lucide-react";
import { toast } from "sonner";

interface ProductVariant {
  size: string;
  quantity: number;
}

interface ProductCatalogItem {
  id: string;
  name: string;
  unitPrice: number;
  variants: ProductVariant[];
  category: string;
  totalQuantity?: number;
  totalValue?: number;
}

interface PrintSelection {
  productId: string;
  selectedVariants: { size: string; quantity: number }[];
}

const SIZES = ["PP", "P", "M", "G", "GG", "XG", "EXG"];
const CATEGORIES = ["Camisas", "Calças", "Baby Look", "Shorts", "Vestidos", "Outros"];

export default function ProductCatalog() {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [printSelections, setPrintSelections] = useState<PrintSelection[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    unitPrice: 0,
    category: "",
    variants: SIZES.map(size => ({ size, quantity: 0 }))
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "product_catalog"));
      const productsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const totalQuantity = data.variants?.reduce((sum: number, v: ProductVariant) => sum + v.quantity, 0) || 0;
        return {
          id: doc.id,
          ...data,
          totalQuantity,
          totalValue: totalQuantity * data.unitPrice
        } as ProductCatalogItem;
      });
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        unitPrice: formData.unitPrice,
        category: formData.category,
        variants: formData.variants.filter(v => v.quantity > 0),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingProduct) {
        await updateDoc(doc(db, "product_catalog", editingProduct.id), {
          ...productData,
          updatedAt: new Date()
        });
        toast.success("Produto atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "product_catalog"), productData);
        toast.success("Produto cadastrado com sucesso!");
      }

      handleDialogClose();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Erro ao salvar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: ProductCatalogItem) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      unitPrice: product.unitPrice,
      category: product.category,
      variants: SIZES.map(size => {
        const existingVariant = product.variants.find(v => v.size === size);
        return {
          size,
          quantity: existingVariant?.quantity || 0
        };
      })
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await deleteDoc(doc(db, "product_catalog", id));
        toast.success("Produto excluído com sucesso!");
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Erro ao excluir produto");
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      unitPrice: 0,
      category: "",
      variants: SIZES.map(size => ({ size, quantity: 0 }))
    });
  };

  const updateVariantQuantity = (sizeIndex: number, quantity: number) => {
    const newVariants = [...formData.variants];
    newVariants[sizeIndex].quantity = Math.max(0, quantity);
    setFormData({ ...formData, variants: newVariants });
  };

  const togglePrintMode = () => {
    setPrintMode(!printMode);
    if (!printMode) {
      // Initialize print selections
      setPrintSelections(products.map(product => ({
        productId: product.id,
        selectedVariants: []
      })));
    }
  };

  const updatePrintSelection = (productId: string, size: string, quantity: number, checked: boolean) => {
    setPrintSelections(prev => {
      const updatedSelections = [...prev];
      const productIndex = updatedSelections.findIndex(s => s.productId === productId);
      
      if (productIndex >= 0) {
        const variants = [...updatedSelections[productIndex].selectedVariants];
        const variantIndex = variants.findIndex(v => v.size === size);
        
        if (checked) {
          if (variantIndex >= 0) {
            variants[variantIndex].quantity = quantity;
          } else {
            variants.push({ size, quantity });
          }
        } else {
          if (variantIndex >= 0) {
            variants.splice(variantIndex, 1);
          }
        }
        
        updatedSelections[productIndex].selectedVariants = variants;
      }
      
      return updatedSelections;
    });
  };

  const generateReport = () => {
    const selectedProducts = printSelections
      .map(selection => {
        const product = products.find(p => p.id === selection.productId);
        if (!product || selection.selectedVariants.length === 0) return null;
        
        const totalSelectedQty = selection.selectedVariants.reduce((sum, v) => sum + v.quantity, 0);
        const totalValue = totalSelectedQty * product.unitPrice;
        
        return {
          ...product,
          selectedVariants: selection.selectedVariants,
          selectedTotalQuantity: totalSelectedQty,
          selectedTotalValue: totalValue
        };
      })
      .filter(Boolean);

    if (selectedProducts.length === 0) {
      toast.error("Selecione pelo menos um produto para gerar o relatório");
      return;
    }

    // Here you would generate and print/download the report
    const totalValue = selectedProducts.reduce((sum, p) => sum + (p?.selectedTotalValue || 0), 0);
    const totalQuantity = selectedProducts.reduce((sum, p) => sum + (p?.selectedTotalQuantity || 0), 0);
    
    console.log("Report data:", { selectedProducts, totalValue, totalQuantity });
    toast.success(`Relatório gerado: ${totalQuantity} itens, R$ ${totalValue.toFixed(2)}`);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie produtos e calcule valores por tamanho
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={togglePrintMode}
            variant={printMode ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {printMode ? "Cancelar Seleção" : "Modo Impressão"}
          </Button>
          {printMode && (
            <Button onClick={generateReport} className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Gerar Relatório
            </Button>
          )}
          {!printMode && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </DialogTitle>
                  <DialogDescription>
                    Cadastre produtos com quantidades por tamanho
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Produto</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Preço Unitário (R$)</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidades por Tamanho</Label>
                    <div className="grid grid-cols-4 gap-4">
                      {formData.variants.map((variant, index) => (
                        <div key={variant.size} className="space-y-1">
                          <Label className="text-sm font-medium">{variant.size}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variant.quantity}
                            onChange={(e) => updateVariantQuantity(index, parseInt(e.target.value) || 0)}
                            className="text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : editingProduct ? "Atualizar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos Cadastrados ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {printMode && <TableHead>Selecionar</TableHead>}
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Tamanhos</TableHead>
                  <TableHead>Qtd. Total</TableHead>
                  <TableHead>Valor Total</TableHead>
                  {!printMode && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    {printMode && (
                      <TableCell>
                        <div className="space-y-2">
                          {product.variants.map((variant) => (
                            <div key={variant.size} className="flex items-center gap-2">
                              <Checkbox
                                onCheckedChange={(checked) => 
                                  updatePrintSelection(product.id, variant.size, variant.quantity, checked as boolean)
                                }
                              />
                              <span className="text-sm">{variant.size}: {variant.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell>R$ {product.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.variants.map((variant) => (
                          <Badge key={variant.size} variant="outline" className="text-xs">
                            {variant.size}: {variant.quantity}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{product.totalQuantity}</TableCell>
                    <TableCell className="font-medium">R$ {product.totalValue?.toFixed(2)}</TableCell>
                    {!printMode && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {products.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
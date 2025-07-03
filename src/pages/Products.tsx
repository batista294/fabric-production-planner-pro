
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Package, Upload } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stampTypeId: string;
  stampTypeName: string;
  imageUrl?: string;
}

interface StampType {
  id: string;
  name: string;
  description: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stampTypes, setStampTypes] = useState<StampType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stampTypeId, setStampTypeId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erro ao carregar produtos");
    }
  };

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
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchStampTypes()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setStampTypeId("");
    setImageFile(null);
    setEditingProduct(null);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const imageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedStampType = stampTypes.find(st => st.id === stampTypeId);
      
      let imageUrl = editingProduct?.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        name,
        description,
        price: parseFloat(price),
        stampTypeId,
        stampTypeName: selectedStampType?.name || "",
        ...(imageUrl && { imageUrl })
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success("Produto cadastrado com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Erro ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setStampTypeId(product.stampTypeId);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success("Produto excluído com sucesso!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erro ao excluir produto");
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
          <h1 className="text-2xl font-bold">Produtos</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando produtos...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos da confecção
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? "Atualize as informações do produto" 
                  : "Cadastre um novo produto no sistema"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Camiseta Básica"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do produto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.90"
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
                <Label htmlFor="image">Imagem do Produto</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting 
                    ? (editingProduct ? "Atualizando..." : "Cadastrando...") 
                    : (editingProduct ? "Atualizar" : "Cadastrar")
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
          <div className="p-2 bg-product rounded-lg">
            <Package className="h-6 w-6 text-product-foreground" />
          </div>
          <div>
            <CardTitle>Produtos Cadastrados</CardTitle>
            <CardDescription>
              {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Nenhum produto cadastrado</p>
              <p className="text-sm">Clique em "Novo Produto" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Tipo de Estampa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="stamp">{product.stampTypeName}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(product.id)}
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

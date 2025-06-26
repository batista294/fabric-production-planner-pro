
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function Products() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos da confecção
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-green-50 rounded-lg">
            <Package className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle>Módulo de Produtos</CardTitle>
            <CardDescription>
              Em desenvolvimento - CRUD completo de produtos em breve
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Módulo em desenvolvimento</p>
            <p className="text-sm">Em breve você poderá gerenciar todos os produtos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

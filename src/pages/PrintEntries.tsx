
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";

export default function PrintEntries() {
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

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Printer className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle>Lançamento de Impressões</CardTitle>
            <CardDescription>
              Em desenvolvimento - Formulário de lançamento em breve
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Módulo em desenvolvimento</p>
            <p className="text-sm">Em breve você poderá registrar todas as impressões</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

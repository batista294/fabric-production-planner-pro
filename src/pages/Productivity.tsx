
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function Productivity() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatório de Produtividade</h1>
          <p className="text-muted-foreground">
            Acompanhe a produtividade da equipe e processos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle>Relatório de Produtividade</CardTitle>
            <CardDescription>
              Gráficos e análises detalhadas em desenvolvimento
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Relatórios em desenvolvimento</p>
            <p className="text-sm">
              Em breve você terá acesso a gráficos detalhados de produtividade,
              baseados nos dados dos lançamentos de impressões, costuras e falhas.
            </p>
            <div className="mt-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Funcionalidades planejadas:</h3>
              <ul className="text-sm space-y-1">
                <li>• Produtividade por funcionário</li>
                <li>• Análise de falhas por categoria</li>
                <li>• Comparativos mensais</li>
                <li>• Eficiência por tipo de produto</li>
                <li>• Relatórios de impressões vs costuras</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

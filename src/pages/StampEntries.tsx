import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StampEntry {
  id: string;
  date: Date;
  stampDescription: string;
  productionCell: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  workingHours: string;
  peopleCount: number;
  observations: string;
  printLists: { printId: string; quantity: number }[];
}

interface Cell {
  id: string;
  name: string;
}

interface StampType {
  id: string;
  name: string;
}

interface PrintEntry {
  id: string;
  description: string;
  date: string;
  stampTypeName: string;
}

interface Product {
  id: string;
  name: string;
}

export default function StampEntries() {
  const [stampEntries, setStampEntries] = useState<StampEntry[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [printEntries, setPrintEntries] = useState<PrintEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StampEntry | null>(null);
  const [formData, setFormData] = useState({
    date: new Date(),
    stampDescription: "",
    productionCell: "",
    startTime: "",
    endTime: "",
    breakTime: "",
    workingHours: "",
    peopleCount: 1,
    observations: "",
    printLists: [] as { printId: string; quantity: number }[],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stamp entries
      const stampSnapshot = await getDocs(collection(db, "stampEntries"));
      const stampData = stampSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      })) as StampEntry[];
      setStampEntries(stampData);

      // Load cells
      const cellsSnapshot = await getDocs(collection(db, "cells"));
      const cellsData = cellsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cell[];
      setCells(cellsData);


      // Load print entries from print_entries collection
      const printSnapshot = await getDocs(collection(db, "print_entries"));
      const printData = printSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrintEntry[];
      setPrintEntries(printData);

      // Load products for stamp descriptions
      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.stampDescription || !formData.productionCell) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        date: formData.date,
        peopleCount: Number(formData.peopleCount),
      };

      if (editingEntry) {
        await updateDoc(doc(db, "stampEntries", editingEntry.id), dataToSave);
        toast({
          title: "Sucesso",
          description: "Lançamento atualizado com sucesso",
        });
      } else {
        await addDoc(collection(db, "stampEntries"), dataToSave);
        toast({
          title: "Sucesso",
          description: "Lançamento cadastrado com sucesso",
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving stamp entry:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar lançamento",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: StampEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      stampDescription: entry.stampDescription,
      productionCell: entry.productionCell,
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakTime: entry.breakTime,
      workingHours: entry.workingHours || "",
      peopleCount: entry.peopleCount,
      observations: entry.observations,
      printLists: entry.printLists,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (entryId: string) => {
    if (confirm("Tem certeza que deseja excluir este lançamento?")) {
      try {
        await deleteDoc(doc(db, "stampEntries", entryId));
        toast({
          title: "Sucesso",
          description: "Lançamento excluído com sucesso",
        });
        loadData();
      } catch (error) {
        console.error("Error deleting stamp entry:", error);
        toast({
          title: "Erro",
          description: "Erro ao excluir lançamento",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date(),
      stampDescription: "",
      productionCell: "",
      startTime: "",
      endTime: "",
      breakTime: "",
      workingHours: "",
      peopleCount: 1,
      observations: "",
      printLists: [],
    });
    setEditingEntry(null);
  };

  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateWorkingHours = (startTime: string, endTime: string, breakTime: string): string => {
    if (!startTime || !endTime) return "";
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const breakMinutes = timeToMinutes(breakTime);
    
    let workingMinutes = endMinutes - startMinutes - breakMinutes;
    
    if (workingMinutes < 0) {
      // Handle overnight work (crossing midnight)
      workingMinutes = (24 * 60 - startMinutes) + endMinutes - breakMinutes;
    }
    
    return minutesToTime(workingMinutes);
  };

  const updateWorkingHours = (startTime: string, endTime: string, breakTime: string) => {
    const workingHours = calculateWorkingHours(startTime, endTime, breakTime);
    setFormData(prev => ({ ...prev, workingHours }));
  };

  const handlePrintListToggle = (printId: string) => {
    setFormData(prev => ({
      ...prev,
      printLists: prev.printLists.find(item => item.printId === printId)
        ? prev.printLists.filter(item => item.printId !== printId)
        : [...prev.printLists, { printId, quantity: 1 }]
    }));
  };

  const updatePrintQuantity = (printId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      printLists: prev.printLists.map(item => 
        item.printId === printId ? { ...item, quantity } : item
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lançamento de Estampa</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Editar Lançamento" : "Novo Lançamento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Lançamento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "dd/MM/yyyy") : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({ ...formData, date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="stampDescription">Tipo de Estampa</Label>
                  <Input
                    id="stampDescription"
                    type="text"
                    value={formData.stampDescription}
                    onChange={(e) => setFormData({ ...formData, stampDescription: e.target.value })}
                    placeholder="Digite o tipo de estampa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem key={cell.id} value={cell.name}>
                          {cell.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="startTime">Horário de Início</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      setFormData({ ...formData, startTime: newStartTime });
                      updateWorkingHours(newStartTime, formData.endTime, formData.breakTime);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Horário de Fim</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => {
                      const newEndTime = e.target.value;
                      setFormData({ ...formData, endTime: newEndTime });
                      updateWorkingHours(formData.startTime, newEndTime, formData.breakTime);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="breakTime">Tempo de Intervalo</Label>
                  <Input
                    id="breakTime"
                    type="time"
                    value={formData.breakTime}
                    onChange={(e) => {
                      const newBreakTime = e.target.value;
                      setFormData({ ...formData, breakTime: newBreakTime });
                      updateWorkingHours(formData.startTime, formData.endTime, newBreakTime);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="workingHours">Horas Trabalhadas</Label>
                  <Input
                    id="workingHours"
                    type="text"
                    value={formData.workingHours}
                    readOnly
                    className="bg-muted"
                    placeholder="00:00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="peopleCount">Quantidade de Pessoas</Label>
                <Input
                  id="peopleCount"
                  type="number"
                  min="1"
                  value={formData.peopleCount}
                  onChange={(e) => setFormData({ ...formData, peopleCount: Number(e.target.value) })}
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label>Listas de Impressão</Label>
                  {formData.printLists.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Total: {formData.printLists.reduce((total, item) => total + item.quantity, 0)} unidades
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-background">
                  {printEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Nenhuma impressão cadastrada</p>
                  ) : (
                    printEntries.map((printEntry) => {
                      const selectedPrint = formData.printLists.find(item => item.printId === printEntry.id);
                      const isSelected = !!selectedPrint;
                      
                      return (
                        <div key={printEntry.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={printEntry.id}
                            checked={isSelected}
                            onChange={() => handlePrintListToggle(printEntry.id)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <label htmlFor={printEntry.id} className="text-sm">
                              <span className="font-medium">{printEntry.description}</span>
                              {printEntry.stampTypeName && (
                                <span className="text-muted-foreground"> - {printEntry.stampTypeName}</span>
                              )}
                              <span className="text-muted-foreground text-xs block">{printEntry.date}</span>
                            </label>
                            {isSelected && (
                              <div className="mt-1">
                                <Input
                                  type="number"
                                  min="1"
                                  value={selectedPrint.quantity}
                                  onChange={(e) => updatePrintQuantity(printEntry.id, Number(e.target.value))}
                                  className="w-20 h-8 text-sm"
                                  placeholder="Qtd"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Digite observações adicionais"
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
                  {editingEntry ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {stampEntries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{entry.stampDescription}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Data:</strong> {format(entry.date, "dd/MM/yyyy")}</p>
                <p><strong>Célula:</strong> {entry.productionCell}</p>
                <p><strong>Horário:</strong> {entry.startTime} - {entry.endTime}</p>
                <p><strong>Pessoas:</strong> {entry.peopleCount}</p>
                <p><strong>Intervalo:</strong> {entry.breakTime}</p>
                <p><strong>Horas Trabalhadas:</strong> {entry.workingHours || "N/A"}</p>
              </div>
              {entry.observations && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Observações:</strong> {entry.observations}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
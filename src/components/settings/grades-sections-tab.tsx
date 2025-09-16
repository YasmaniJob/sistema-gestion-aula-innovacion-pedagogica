

'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, BookUser, GraduationCap, MoreHorizontal, PenSquare } from 'lucide-react';
import type { Grade, Section } from '@/domain/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { GradeSectionForm, type GradeSectionFormData } from './grade-section-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useData } from '@/context/data-provider-refactored';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

const gradeLevels = [
    '1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'
];

const sectionLetters = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'
];


export function GradesSectionsTab() {
  const { grades, addGrade, deleteGrade, addSection, deleteSection } = useData();
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<Section | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'grade' | 'section', data: Grade | Section, gradeId?: string } | null>(null);

  const sortedGrades = useMemo(() => {
      return [...grades].sort((a,b) => a.name.localeCompare(b.name));
  }, [grades]);
  
  const selectedGrade = useMemo(() => {
      return sortedGrades.find(g => g.id === selectedGradeId) || null;
  }, [selectedGradeId, sortedGrades]);

  useEffect(() => {
    if (!selectedGradeId && sortedGrades.length > 0) {
      setSelectedGradeId(sortedGrades[0].id);
    }
  }, [sortedGrades, selectedGradeId]);

  const openForm = (item: Section) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (type: 'grade' | 'section', data: Grade | Section, gradeId?: string) => {
    setItemToDelete({ type, data, gradeId });
    setIsDeleteDialogOpen(true);
  };

  const handleAddGrade = async () => {
    const existingGradeNames = grades.map(g => g.name);
    const nextGradeName = gradeLevels.find(level => !existingGradeNames.includes(level));

    if (!nextGradeName) {
        toast({
            title: "Límite de Grados Alcanzado",
            description: "Ya se han añadido todos los grados disponibles.",
            variant: "destructive"
        });
        return;
    }
    
    try {
        const newGrade = await addGrade(nextGradeName);
        if (newGrade) {
            setSelectedGradeId(newGrade.id);
            toast({ title: `Grado "${newGrade.name}" añadido` });
        }
    } catch(error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const handleAddSection = async () => {
    if (!selectedGrade) return;

    const existingSectionNames = selectedGrade.sections.map(s => s.name);
    const nextLetter = sectionLetters.find(letter => !existingSectionNames.includes(letter));

    if (!nextLetter) {
        toast({ title: "Límite de Secciones Alcanzado", variant: "destructive" });
        return;
    }

    try {
        await addSection(selectedGrade.id, nextLetter);
        toast({ title: `Sección ${nextLetter} añadida a ${selectedGrade.name}` });
    } catch(error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { type, data } = itemToDelete;

    try {
      if (type === 'grade') {
        await deleteGrade(data.id);
        if (selectedGradeId === data.id) {
          const firstRemainingGrade = sortedGrades.find(g => g.id !== data.id);
          setSelectedGradeId(firstRemainingGrade?.id || null);
        }
        toast({ title: "Grado Eliminado", variant: 'destructive' });
      } else {
        await deleteSection(data.id);
        toast({ title: "Sección Eliminada", variant: 'destructive' });
      }
    } catch(error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };



  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Columna de Grados */}
        <div className="md:col-span-1 lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Grados</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddGrade}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                </Button>
            </CardHeader>
            <CardContent>
                {sortedGrades.length > 0 ? (
                    <div className="space-y-1">
                        {sortedGrades.map(grade => (
                            <Button
                                key={grade.id}
                                variant={selectedGradeId === grade.id ? 'default' : 'ghost'}
                                className="w-full justify-start gap-3"
                                onClick={() => setSelectedGradeId(grade.id)}
                            >
                               <GraduationCap className="h-4 w-4" />
                               {grade.name}
                            </Button>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay grados.</p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Columna de Secciones */}
        <div className="md:col-span-2 lg:col-span-3">
           <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle>Secciones de {selectedGrade?.name || '...'}</CardTitle>
                            <CardDescription>Gestiona las secciones del grado seleccionado.</CardDescription>
                        </div>
                        <Button onClick={handleAddSection} disabled={!selectedGrade}>
                            <PlusCircle className="mr-2" />
                            Añadir Sección
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sección</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedGrade && selectedGrade.sections.length > 0 ? (
                                    selectedGrade.sections.map(section => (
                                        <TableRow key={section.id}>
                                            <TableCell className="font-semibold">Sección {section.name}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">

                                                        <DropdownMenuItem onClick={() => openDeleteDialog('section', section)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            {selectedGrade ? 'No hay secciones para este grado.' : 'Selecciona un grado para ver sus secciones.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
           </Card>
        </div>
      </div>


      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{(itemToDelete?.data as Grade)?.name || `la sección ${(itemToDelete?.data as Section)?.name}`}</strong> del sistema.
              {itemToDelete?.type === 'grade' && ' Todas sus secciones también serán eliminadas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


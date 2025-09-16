

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  User,
  MapPin,
  GraduationCap,
  Hash,
  X,
  Camera,
  CheckCircle,
  PenSquare,
  Loader2,
  Building,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Resource, LoanUser, Loan } from '@/domain/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { statusStyles } from '@/domain/constants';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserSelector } from '@/components/user-selector';
import { CategorySelector } from '@/components/category-selector';
import { useAuthorization } from '@/hooks/use-authorization';
import { useData } from '@/context/data-provider-refactored';
import { usePageTitle } from '@/hooks/use-page-title';

export default function NewLoanPage() {
  useAuthorization('Admin');
  usePageTitle('Crear Préstamo');
  const { addLoan, resources: allResources, currentUser, areas, grades } = useData();
  const [selectedResources, setSelectedResources] = useState<Resource[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [loanPurpose, setLoanPurpose] = useState<'aprendizaje' | 'institucional'>('aprendizaje');
  const [internalUsageDetails, setInternalUsageDetails] = useState('');
  const [selectedUser, setSelectedUser] = useState<LoanUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for the dynamic selects
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  const router = useRouter();
  const { toast } = useToast();

  const handleResourceClick = (resource: Resource) => {
    setSelectedResources((prev) =>
      prev.some((r) => r.id === resource.id)
        ? prev.filter((r) => r.id !== resource.id)
        : [...prev, resource]
    );
  };

  const isResourceSelected = (resource: Resource) => {
    return selectedResources.some((r) => r.id === resource.id);
  };
  
  const filteredResources = useMemo(() => {
    if (!activeCategory && allResources.length > 0) {
      setActiveCategory(allResources[0].category || '');
    }
    const filtered = allResources.filter(r => r.category === activeCategory && r.status === 'disponible');
    
    // Ordenar recursos de forma natural (Laptop 1, Laptop 2, etc.)
    return filtered.sort((a, b) => {
      // Extraer números del nombre para ordenamiento natural
      const getNumber = (name: string) => {
        const match = name.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      
      const numA = getNumber(a.name);
      const numB = getNumber(b.name);
      
      // Si ambos tienen números, ordenar por número
      if (numA && numB) {
        return numA - numB;
      }
      
      // Si solo uno tiene número, el que tiene número va primero
      if (numA && !numB) return -1;
      if (!numA && numB) return 1;
      
      // Si ninguno tiene número, ordenar alfabéticamente
      return a.name.localeCompare(b.name);
    });
  }, [activeCategory, allResources]);

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);

  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResources.slice(startIndex, endIndex);
  }, [filteredResources, currentPage, itemsPerPage]);

  const handleCategoryChange = (categoryName: string) => {
    setActiveCategory(categoryName);
    setCurrentPage(1);
  }
  
  const isFormValid = useMemo(() => {
    if (!selectedUser || selectedResources.length === 0) return false;
    if (loanPurpose === 'aprendizaje') {
      return selectedArea.trim() !== '' && selectedGrade.trim() !== '' && selectedSection.trim() !== '';
    }
    if (loanPurpose === 'institucional') {
        return internalUsageDetails.trim() !== '';
    }
    return false;
  }, [selectedUser, selectedResources, loanPurpose, selectedArea, selectedGrade, selectedSection, internalUsageDetails]);

  const handleRegisterLoan = async () => {
    if (!isFormValid || !currentUser) return;

    setIsSubmitting(true);

    try {
        const newLoanData: Omit<Loan, 'id' | 'loanDate' | 'status'> = {
        user: selectedUser!,
        purpose: loanPurpose,
        purposeDetails: loanPurpose === 'aprendizaje' 
            ? { area: selectedArea, grade: selectedGrade, section: selectedSection, activityName: `${selectedArea} - ${selectedGrade} ${selectedSection}` }
            : { activityName: internalUsageDetails },
        resources: selectedResources.map(r => ({ id: r.id, name: r.name, brand: r.brand })),
        };
        
        await addLoan(newLoanData, currentUser.role);

        toast({
            title: '¡Préstamo Registrado!',
            description: `El préstamo para ${selectedUser!.name} ha sido registrado correctamente.`,
            variant: 'default',
        });
        router.push('/loans');
    } catch (error: any) {
        toast({
            title: "Error al registrar el préstamo",
            description: "No se pudo crear el préstamo. Es posible que no tengas permisos para esta acción.",
            variant: 'destructive'
        })
    } finally {
        setIsSubmitting(false);
    }
  };

  const sectionsForSelectedGrade = useMemo(() => {
    if (!selectedGrade) return [];
    const grade = grades.find(g => g.name === selectedGrade);
    return grade?.sections || [];
  }, [selectedGrade, grades]);

  // Reset section when grade changes
  useEffect(() => {
    setSelectedSection('');
  }, [selectedGrade]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/loans" className="hover:text-primary">
              Préstamos
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-primary">Crear Préstamo</span>
          </div>
        </div>
      </div>
      <h1 className="text-3xl font-bold hidden sm:block">Crear Préstamo de Recursos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Detalles del Préstamo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        size="lg" 
                        className={cn("h-auto py-3", loanPurpose === 'aprendizaje' ? 'bg-green-600 text-white hover:bg-green-600/90' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
                        onClick={() => setLoanPurpose('aprendizaje')}
                    >
                        <GraduationCap className="mr-2"/>
                        <div className="flex flex-col items-center text-center flex-grow">
                            <span className="font-bold whitespace-normal">Actividad de aprendizaje</span>
                        </div>
                    </Button>
                    <Button 
                        size="lg" 
                        className={cn("h-auto py-3", loanPurpose === 'institucional' ? 'bg-green-600 text-white hover:bg-green-600/90' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
                        onClick={() => setLoanPurpose('institucional')}
                    >
                        <Building className="mr-2"/>
                        <div className="flex flex-col items-center text-center flex-grow">
                            <span className="font-bold whitespace-normal">Uso institucional</span>
                        </div>
                    </Button>
                </div>
                <Separator />
                <UserSelector
                    selectedUser={selectedUser}
                    onUserSelect={setSelectedUser}
                />

              {loanPurpose === 'aprendizaje' && (
                <div className="space-y-4 border-t pt-6">
                   <div>
                    <Label className="text-sm font-medium">Área Curricular</Label>
                    <Select onValueChange={setSelectedArea} value={selectedArea}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecciona un área curricular" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map(area => (
                            <SelectItem key={area.id} value={area.name}>{area.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-medium">Grado</Label>
                        <Select onValueChange={setSelectedGrade} value={selectedGrade}>
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Selecciona un grado" />
                        </SelectTrigger>
                        <SelectContent>
                            {grades.map(grade => (
                                <SelectItem key={grade.id} value={grade.name}>{grade.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Sección</Label>
                        <Select onValueChange={setSelectedSection} value={selectedSection} disabled={!selectedGrade}>
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Selecciona una sección" />
                        </SelectTrigger>
                        <SelectContent>
                            {sectionsForSelectedGrade.map(section => (
                                <SelectItem key={section.id} value={section.name}>{section.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                  </div>
                </div>
              )}
               {loanPurpose === 'institucional' && (
                <div className="space-y-2 border-t pt-6">
                  <Label htmlFor="internal-usage-details" className="text-sm font-medium">Nombre del Taller, Curso o Colegiado</Label>
                  <Input
                    id="internal-usage-details"
                    placeholder="Ej: Taller de Robótica Avanzada"
                    value={internalUsageDetails}
                    onChange={(e) => setInternalUsageDetails(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Selecciona los Recursos</CardTitle>
              <CardDescription>
                Filtra por categoría y haz clic en los recursos que deseas solicitar.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <CategorySelector
                    activeCategory={activeCategory}
                    onCategoryChange={handleCategoryChange}
               />
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                {paginatedResources.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => handleResourceClick(resource)}
                    className={cn(
                      'relative flex flex-col text-left rounded-lg border bg-card text-card-foreground shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      isResourceSelected(resource) && 'ring-2 ring-primary border-primary'
                    )}
                  >
                    {isResourceSelected(resource) && (
                        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                    )}
                    <CardHeader className="flex-row items-start justify-between pb-2 w-full">
                      <div className="flex items-center gap-3">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <div className="grid gap-0.5">
                          <CardTitle className="text-base font-semibold">{resource.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{resource.brand}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto pt-2 flex items-center justify-between w-full">
                        <Badge className={cn('font-normal', statusStyles[resource.status].badge)}>
                            Disponible
                        </Badge>
                    </CardContent>
                  </button>
                ))}
              </div>
               {totalPages > 1 && (
                <Pagination className="pt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm font-medium">
                        Página {currentPage} de {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext 
                        onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky top-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Solicitante:</span>
                    <span className="font-semibold">{selectedUser?.name || 'Ningún usuario seleccionado'}</span>
                  </div>
                </div>
                 <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0"/>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Tipo de uso:</span>
                    <span className="font-semibold capitalize">{loanPurpose === 'institucional' ? internalUsageDetails || "Institucional" : 'Actividad de Aprendizaje'}</span>
                  </div>
                </div>
                 {loanPurpose === 'aprendizaje' && (selectedArea || selectedGrade || selectedSection) && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Detalles Académicos:</span>
                      <span className="font-semibold">{[selectedArea, selectedGrade, selectedSection].filter(Boolean).join(' - ')}</span>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2">Recursos Seleccionados ({selectedResources.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedResources.length > 0 ? (
                    selectedResources.map(resource => (
                      <div key={resource.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">{resource.name}</p>
                                <p className="text-xs text-muted-foreground">{resource.brand}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleResourceClick(resource)}>
                            <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Selecciona recursos de la lista.
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <Button 
                size="lg" 
                className="w-full" 
                disabled={!isFormValid || isSubmitting}
                onClick={handleRegisterLoan}
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                    </>
                ) : (
                    'Registrar Préstamo Directo'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

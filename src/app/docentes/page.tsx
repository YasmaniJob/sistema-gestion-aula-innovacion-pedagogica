
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { LoanUser } from '@/domain/types';
import { useData } from '@/context/data-provider-refactored';
import { useAuthorization } from '@/hooks/use-authorization';
import { usePageTitle } from '@/hooks/use-page-title';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

import { DocentesToolbar } from '@/components/docentes/docentes-toolbar';
import { DocentesTable } from '@/components/docentes/docentes-table';
import { UserForm, UserFormData } from '@/components/user-form';
import { UserImportDialog } from '@/components/user-import-dialog';
import { ExportDialog } from '@/components/export-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { AdaptiveDialog } from '@/components/adaptive-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useSidebar } from '@/components/layout/sidebar-provider';
import { Button } from '@/components/ui/button';
import { Download, FileUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 10;

export default function DocentesPage() {
  useAuthorization('Admin');
  usePageTitle('Gestión de Personal');
  
  const { users, appName, schoolName, addUser, updateUser, deleteUser, addMultipleUsers } = useData();
  const { toast } = useToast();
  const { setHeaderActions } = useSidebar();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LoanUser | null>(null);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<LoanUser | null>(null);
  
  useEffect(() => {
    setHeaderActions(
      <>
        <Button variant="ghost" size="icon" onClick={() => setIsExportOpen(true)}>
          <Download className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsImportOpen(true)}>
          <FileUp className="h-5 w-5" />
        </Button>
      </>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions]);


  const staffUsers = useMemo(() => {
    return users.filter(user => user.role === 'Docente');
  }, [users]);

  const filteredUsers = useMemo(() => {
    return staffUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.dni && user.dni.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [staffUsers, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleEditClick = (user: LoanUser) => {
    setEditingUser(user);
    setIsAddFormOpen(true);
  };

  const handleDeleteClick = (user: LoanUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      toast({
          title: "Usuario Eliminado",
          description: `${userToDelete.name} ha sido eliminado del sistema.`,
          variant: 'destructive'
      });
    } catch (error: any) {
        toast({
          title: "Error al eliminar",
          description: error.message,
          variant: 'destructive'
      });
    } finally {
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    }
  };

  const handleFormSubmit = async (data: UserFormData) => {
     try {
        if (editingUser) {
            await updateUser(editingUser.id, data);
            toast({ title: "Usuario Actualizado", description: `Los datos de ${data.name} se han actualizado.` });
        } else {
            // For manual creation, DNI is the password.
            const newUser = await addUser({ ...data, password: data.dni });
            toast({ title: "Usuario Añadido", description: `${newUser.name} ha sido añadido al personal.` });
        }
        setIsAddFormOpen(false);
        setEditingUser(null);
     } catch (error: any) {
        toast({
            title: "Error al guardar",
            description: error.message,
            variant: "destructive"
        });
     }
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsAddFormOpen(open);
    if (!open) setEditingUser(null);
  };

  const handleImportUsers = async (newUsers: Omit<LoanUser, 'id'>[]) => {
    // The password for imported users is their DNI
    const usersWithPassword = newUsers.map(user => ({...user, password: user.dni}));
    await addMultipleUsers(usersWithPassword);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const dataToExport = filteredUsers.map(user => ({
      'Nombre Completo': user.name,
      'DNI': user.dni,
      'Correo Electrónico': user.email,
      'Rol': user.role,
    }));

    if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Personal');
        XLSX.writeFile(workbook, 'lista_personal.xlsx');
    } else {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Lista de Personal - ${appName}`, 14, 22);
        doc.setFontSize(11);
        doc.text(`${schoolName}`, 14, 30);
        doc.setTextColor(100);
        doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy h:mm a')}`, 14, 36);

        (doc as any).autoTable({
            startY: 42,
            head: [['Nombre Completo', 'DNI', 'Correo Electrónico', 'Rol']],
            body: dataToExport.map(user => Object.values(user)),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        });
        doc.save('lista_personal.pdf');
    }
    setIsExportOpen(false);
    toast({
      title: `Exportación a ${format.toUpperCase()} Exitosa`,
      description: `Se han exportado ${filteredUsers.length} registros.`
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold flex-grow hidden sm:block">Gestión de Personal</h1>
          <DocentesToolbar
            onAdd={() => setIsAddFormOpen(true)}
            onImport={() => setIsImportOpen(true)}
            onExport={() => setIsExportOpen(true)}
          />
        </div>
        
        <Card>
          <CardContent className="pt-6">
             <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o DNI..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-0">
            <DocentesTable
              users={paginatedUsers}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          </CardContent>
        </Card>
        
        {totalPages > 1 && (
          <div className="flex justify-center items-center pt-4">
              <Pagination>
                  <PaginationContent>
                      <PaginationItem>
                          <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}/>
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-sm text-muted-foreground">
                            Página {currentPage} de {totalPages}
                          </span>
                      </PaginationItem>
                      <PaginationItem>
                          <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}/>
                      </PaginationItem>
                  </PaginationContent>
              </Pagination>
          </div>
        )}
      </div>

      <AdaptiveDialog
        isOpen={isAddFormOpen}
        onOpenChange={handleModalOpenChange}
        title={editingUser ? 'Editar Personal' : 'Añadir Personal'}
        description={editingUser ? 'Modifica los detalles del miembro del personal.' : "Completa el formulario para añadir un nuevo miembro al personal."}
      >
        <UserForm
          onSubmit={handleFormSubmit}
          onCancel={() => handleModalOpenChange(false)}
          mode={editingUser ? 'edit' : 'add'}
          initialData={editingUser || { role: 'Docente' }}
        />
      </AdaptiveDialog>

      <UserImportDialog
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImportUsers}
      />
      
      <ExportDialog
        isOpen={isExportOpen}
        onOpenChange={setIsExportOpen}
        onExportExcel={() => handleExport('excel')}
        onExportPDF={() => handleExport('pdf')}
        itemCount={filteredUsers.length}
        itemName="Personal"
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="¿Estás seguro?"
        description={`Esta acción no se puede deshacer. Se eliminará permanentemente al usuario ${userToDelete?.name} del sistema.`}
      />
    </>
  );
}

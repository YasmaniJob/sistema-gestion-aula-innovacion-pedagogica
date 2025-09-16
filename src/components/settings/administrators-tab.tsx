
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, MoreHorizontal, PenSquare, PlusCircle, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import type { LoanUser } from '@/domain/types';
import { UserForm, UserFormData } from '@/components/user-form';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useData } from '@/context/data-provider-refactored';
import { getInitials } from '@/lib/utils';
import { AdaptiveDialog } from '../adaptive-dialog';

export function AdministratorsTab() {
  const { users, addUser, updateUser, deleteUser } = useData();
  const administrators = users.filter(u => u.role === 'Admin');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LoanUser | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<LoanUser | null>(null);

  const { toast } = useToast();

  const handleAddClick = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };
  
  const handleEditClick = (user: LoanUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: LoanUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleModalOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  }

  const confirmDelete = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    toast({
        title: "Administrador Eliminado",
        description: `${userToDelete.name} ha sido eliminado del sistema.`,
        variant: 'destructive'
    });
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleFormSubmit = (data: UserFormData) => {
     if (editingUser) {
        updateUser(editingUser.id, data);
        toast({ title: "Administrador Actualizado", description: `Los datos de ${data.name} se han actualizado.` });
     } else {
        const newUser = addUser(data);
        toast({ title: "Administrador Añadido", description: `${newUser.name} ha sido añadido al personal.` });
     }
     handleModalOpenChange(false);
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle>Gestión de Administradores</CardTitle>
                <CardDescription>
                Añade, edita o elimina los usuarios con permisos de administrador.
                </CardDescription>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
                <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2"/>
                    Importar
                </Button>
                 <AdaptiveDialog
                    isOpen={isFormOpen}
                    onOpenChange={handleModalOpenChange}
                    title={editingUser ? 'Editar Administrador' : 'Añadir Administrador'}
                    description={
                        editingUser ? 'Modifica los detalles del administrador.' : 'Completa el formulario para añadir un nuevo administrador.'
                    }
                    trigger={<Button onClick={handleAddClick} className="w-full sm:w-auto"><PlusCircle className="mr-2"/>Añadir</Button>}
                >
                    <UserForm 
                        onSubmit={handleFormSubmit}
                        onCancel={() => handleModalOpenChange(false)}
                        mode={editingUser ? 'edit' : 'add'}
                        initialData={editingUser || { role: 'Admin' }}
                        isEditingRole={!editingUser} // Only allow role editing on add
                    />
                </AdaptiveDialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
          {/* Mobile View */}
          <div className="sm:hidden -mx-6 -mb-6 border-t">
              {administrators.length > 0 ? (
                <div className="space-y-0">
                  {administrators.map(admin => (
                      <div key={admin.id} className="flex items-center gap-4 p-3 border-b last:border-b-0">
                          <Avatar>
                              <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-grow">
                              <p className="font-semibold">{admin.name}</p>
                              <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="shrink-0">
                                      <MoreHorizontal className="h-5 w-5" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClick(admin)}>
                                      <PenSquare className="mr-2 h-4 w-4" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteClick(admin)} className="text-destructive focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground p-8">No hay administradores.</p>
              )}
          </div>
        
          {/* Desktop View */}
          <div className="hidden sm:block border rounded-lg">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Correo Electrónico</TableHead>
                          <TableHead><span className="sr-only">Acciones</span></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {administrators.length > 0 ? administrators.map((admin) => (
                          <TableRow key={admin.id}>
                              <TableCell>
                                  <div className="flex items-center gap-4">
                                      <Avatar>
                                          <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
                                      </Avatar>
                                      <div className="grid gap-0.5">
                                          <p className="font-semibold">{admin.name}</p>
                                      </div>
                                  </div>
                              </TableCell>
                              <TableCell>{admin.email}</TableCell>
                              <TableCell>
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditClick(admin)}>
                                          <PenSquare className="mr-2 h-4 w-4" />
                                          Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteClick(admin)} className="text-destructive focus:text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Eliminar
                                      </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            No hay administradores.
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>
      </CardContent>
    </Card>

     <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente al administrador <strong>{userToDelete?.name}</strong> del sistema.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    Sí, eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

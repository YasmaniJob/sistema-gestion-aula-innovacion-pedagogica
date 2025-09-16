
'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Table, X, Download, Loader2 } from 'lucide-react';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LoanUser } from '@/domain/types';
import { Progress } from './ui/progress';
import { useData } from '@/context/data-provider-refactored';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info } from 'lucide-react';


type UserImportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImport: (newUsers: Omit<LoanUser, 'id'>[]) => Promise<void>;
};

const requiredHeaders = ['nombre_completo', 'dni'];
const BATCH_SIZE = 25;


export function UserImportDialog({
  isOpen,
  onOpenChange,
  onImport,
}: UserImportDialogProps) {
  const { users: existingUsers } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Omit<LoanUser, 'id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    const headerData = ['nombre_completo', 'dni', 'correo_electronico'];
    const worksheet = XLSX.utils.aoa_to_sheet([headerData]);

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F4F4F" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    ['A1', 'B1', 'C1'].forEach(cell => {
      if (worksheet[cell]) worksheet[cell].s = headerStyle;
    });

    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, 'plantilla_personal.xlsx');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
        });

        if (jsonData.length < 2) {
          setError('El archivo está vacío o no contiene datos.');
          setParsedData([]);
          return;
        }

        const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim().replace(/ /g, '_'));
        const body = jsonData.slice(1);

        if (!requiredHeaders.every(h => headers.includes(h))) {
            setError(`El archivo debe contener las columnas obligatorias: nombre_completo y dni. Por favor, utiliza la plantilla.`);
            setParsedData([]);
            return;
        }

        const nameIndex = headers.indexOf('nombre_completo');
        const dniIndex = headers.indexOf('dni');
        const emailIndex = headers.indexOf('correo_electronico');

        const validData: Omit<LoanUser, 'id'>[] = body
          .map(row => ({
            name: String(row[nameIndex] || '').trim(),
            dni: String(row[dniIndex] || '').trim(),
            email: emailIndex > -1 ? String(row[emailIndex] || '').trim() : '',
            role: 'Docente' as const
          }))
          .filter(row => row.name && row.dni);

        if (validData.length === 0) {
            setError('No se encontraron filas con datos válidos. Asegúrate de que las columnas "nombre_completo" y "dni" no estén vacías.');
            setParsedData([]);
            return;
        }

        setParsedData(validData);
        setError(null);

      } catch (err: any) {
        setError(`Error al procesar el archivo: ${err.message}`);
        setParsedData([]);
      }
    };
    reader.onerror = () => {
      setError('No se pudo leer el archivo.');
      setParsedData([]);
    };
    reader.readAsArrayBuffer(fileToParse);
  };
  
  const { newUsersToImport, duplicateCount } = useMemo(() => {
    if (parsedData.length === 0) {
      return { newUsersToImport: [], duplicateCount: 0 };
    }
    
    const existingDnis = new Set(existingUsers.map(u => u.dni));
    const existingEmails = new Set(existingUsers.map(u => u.email).filter(Boolean));

    const newUsers = parsedData.filter(newUser => {
      const dniExists = newUser.dni && existingDnis.has(newUser.dni);
      const emailExists = newUser.email && existingEmails.has(newUser.email);
      return !dniExists && !emailExists;
    });
    
    return {
      newUsersToImport: newUsers,
      duplicateCount: parsedData.length - newUsers.length,
    };
  }, [parsedData, existingUsers]);


  const handleImportClick = async () => {
    if (newUsersToImport.length === 0 || !!error) return;

    setIsImporting(true);
    setImportProgress(0);

    const totalBatches = Math.ceil(newUsersToImport.length / BATCH_SIZE);
    let importedCount = 0;

    try {
        for (let i = 0; i < totalBatches; i++) {
            const batch = newUsersToImport.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            await onImport(batch);
            importedCount += batch.length;
            setImportProgress((importedCount / newUsersToImport.length) * 100);
        }

        toast({
            title: "Importación Exitosa",
            description: `Se han añadido ${newUsersToImport.length} nuevos usuarios al sistema. Se omitieron ${duplicateCount} duplicados.`
        });
        resetState();

    } catch (err: any) {
         toast({
            title: "Error durante la importación",
            description: `Se importaron ${importedCount} de ${newUsersToImport.length} registros. Error: ${err.message}`,
            variant: "destructive"
        });
    } finally {
        setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setIsImporting(false);
    setImportProgress(0);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={isImporting ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar Personal desde CSV o Excel</DialogTitle>
          <DialogDescription>
            Sube un archivo con las columnas obligatorias: <strong>nombre_completo</strong> y <strong>dni</strong>. La columna <strong>correo_electronico</strong> es opcional.
            ¿No estás seguro del formato?{' '}
            <Button variant="link" onClick={handleDownloadTemplate} className="p-0 h-auto">
              <Download className="mr-1 h-3 w-3" />
              Descarga la plantilla
            </Button>
            .
          </DialogDescription>
        </DialogHeader>
        
        {isImporting ? (
            <div className="space-y-4 py-8 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                <p className="font-semibold">Importando, por favor espera...</p>
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                    {Math.round((importProgress / 100) * newUsersToImport.length)} de {newUsersToImport.length} usuarios importados.
                </p>
            </div>
        ) : (
            <div className="space-y-4 py-4">
            {!file ? (
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                            <p className="text-xs text-muted-foreground">Archivo CSV o Excel</p>
                        </div>
                        <Input id="dropzone-file" type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange}/>
                    </label>
                </div> 
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Table className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium text-sm">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFile(null); setParsedData([]); setError(null); }}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    
                    {parsedData.length > 0 && !error && (
                        <>
                        {duplicateCount > 0 && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Registros Duplicados</AlertTitle>
                                <AlertDescription>
                                    Se encontraron y omitirán <strong>{duplicateCount}</strong> registros porque el DNI o email ya existen en el sistema.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <div className="border rounded-lg max-h-64 overflow-y-auto">
                                <UiTable>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>DNI</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rol</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {newUsersToImport.slice(0, 6).map((user, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.dni || 'N/A'}</TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                            <TableCell>
                                            <span className='px-2 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground'>
                                                {user.role}
                                            </span>
                                            </TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </UiTable>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Mostrando previsualización. Se importarán <strong>{newUsersToImport.length}</strong> de {parsedData.length} registros.
                            </p>
                        </div>
                        </>
                    )}
                </div>
            )}
            </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={resetState} disabled={isImporting}>Cancelar</Button>
          <Button onClick={handleImportClick} disabled={isImporting || newUsersToImport.length === 0 || !!error}>
            Importar {newUsersToImport.length > 0 && `(${newUsersToImport.length})`} Usuarios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

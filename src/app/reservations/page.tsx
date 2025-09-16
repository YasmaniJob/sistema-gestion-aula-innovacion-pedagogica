
'use client';

import { useState, useMemo } from 'react';
import {
  PlusCircle,
  Download,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReservationCalendar } from '@/components/reservation-calendar';
import { useData } from '@/context/data-provider-refactored';
import { useAuthorization } from '@/hooks/use-authorization';
import { ExportDialog } from '@/components/export-dialog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/use-page-title';

export default function ReservationsPage() {
  useAuthorization('Admin');
  usePageTitle('Gestión de Reservas');
  const { reservations, updateReservationStatus } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExportOpen, setIsExportOpen] = useState(false);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const weeklyReservations = useMemo(() => {
    return reservations.filter(r => isWithinInterval(r.startTime, { start: weekStart, end: weekEnd }));
  }, [reservations, weekStart, weekEnd]);


  const handleExportExcel = () => {
    const dataToExport = weeklyReservations.map(res => ({
      'Fecha': format(res.startTime, "dd/MM/yyyy", { locale: es }),
      'Hora': res.purposeDetails?.activityName,
      'Docente': res.user.name,
      'Propósito': res.purpose === 'aprendizaje' ? 'Aprendizaje' : 'Institucional',
      'Actividad': res.purposeDetails.activityName,
      'Estado': res.status,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservas');
    XLSX.writeFile(workbook, `reservas_semana_${format(weekStart, 'yyyy-MM-dd')}.xlsx`);
    
    setIsExportOpen(false);
    toast({
      title: "Exportación a Excel Exitosa",
      description: `Se han exportado ${weeklyReservations.length} reservas.`
    });
  }

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableData = weeklyReservations.map(res => [
        format(res.startTime, "dd/MM/yy", { locale: es }),
        res.purposeDetails?.activityName,
        res.user.name,
        res.purposeDetails?.activityName,
        res.status,
    ]);
    
    const weekRangeText = `Semana del ${format(weekStart, 'd')} al ${format(weekEnd, "d 'de' MMMM, yyyy", { locale: es })}`;

    doc.setFontSize(18);
    doc.text(`Reporte de Reservas`, 14, 22);
    doc.setFontSize(11);
    doc.text(weekRangeText, 14, 30);

    (doc as any).autoTable({
        startY: 36,
        head: [['Fecha', 'Hora', 'Docente', 'Actividad', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });
    
    doc.save(`reservas_semana_${format(weekStart, 'yyyy-MM-dd')}.pdf`);
    setIsExportOpen(false);
    toast({
      title: "Exportación a PDF Exitosa",
      description: `Se han exportado ${weeklyReservations.length} reservas.`
    });
  }


  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex-grow hidden sm:block">Gestión de Reservas</h1>
        <div className="hidden sm:flex w-full sm:w-auto items-center gap-2">
            <Button variant="outline" onClick={() => setIsExportOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Semana
            </Button>
            <Button variant="outline" size="icon" asChild>
                <Link href="/reservations/search">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Búsqueda Avanzada</span>
                </Link>
            </Button>
            <Button asChild>
                <Link href="/reservations/new">
                    <PlusCircle className="mr-2" />
                    Nueva Reserva
                </Link>
            </Button>
        </div>
      </div>

      <ReservationCalendar
        mode="view"
        reservations={weeklyReservations}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onUpdateReservationStatus={updateReservationStatus}
      />
    </div>
    <ExportDialog
        isOpen={isExportOpen}
        onOpenChange={setIsExportOpen}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        itemCount={weeklyReservations.length}
        itemName={`Reservas de la Semana`}
      />
    </>
  );
}

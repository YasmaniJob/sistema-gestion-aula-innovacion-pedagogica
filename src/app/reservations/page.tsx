
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
  useAuthorization({ requiredRole: 'Admin' });
  usePageTitle('Gestión de Reservas');
  const { reservations, updateReservationStatus } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExportOpen, setIsExportOpen] = useState(false);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  // Get current week reservations for display purposes (but pass all reservations to calendar)
  const currentWeekReservations = useMemo(() => {
    return reservations.filter((r: any) => isWithinInterval(r.startTime, { start: weekStart, end: weekEnd }));
  }, [reservations, weekStart, weekEnd]);


  const handleExportExcel = () => {
    const dataToExport = currentWeekReservations.map((res: any) => ({
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
      description: `Se han exportado ${currentWeekReservations.length} reservas.`
    });
  }

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Configuración de colores
    const primaryColor = [41, 128, 185]; // Azul
    const secondaryColor = [52, 152, 219]; // Azul claro
    const accentColor = [46, 204, 113]; // Verde
    const textColor = [44, 62, 80]; // Gris oscuro
    
    // Encabezado del documento
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE RESERVAS', 14, 20);
    
    // Subtítulo con rango de fechas
    const weekRangeText = `Semana del ${format(weekStart, 'd')} al ${format(weekEnd, "d 'de' MMMM, yyyy", { locale: es })}`;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(weekRangeText, 14, 28);
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`, 14, 32);
    
    // Estadísticas resumidas
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', 14, 50);
    
    const stats = {
      total: currentWeekReservations.length,
      confirmadas: currentWeekReservations.filter((r: any) => r.status === 'Confirmada').length,
      completadas: currentWeekReservations.filter((r: any) => r.status === 'Completada').length,
      canceladas: currentWeekReservations.filter((r: any) => r.status === 'Cancelada').length,
      aprendizaje: currentWeekReservations.filter((r: any) => r.purpose === 'aprendizaje').length,
      institucional: currentWeekReservations.filter((r: any) => r.purpose === 'institucional').length
    };
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let yPos = 58;
    
    // Estadísticas en dos columnas
    doc.text(`• Total de reservas: ${stats.total}`, 14, yPos);
    doc.text(`• Reservas confirmadas: ${stats.confirmadas}`, 110, yPos);
    yPos += 6;
    doc.text(`• Reservas completadas: ${stats.completadas}`, 14, yPos);
    doc.text(`• Reservas canceladas: ${stats.canceladas}`, 110, yPos);
    yPos += 6;
    doc.text(`• Propósito académico: ${stats.aprendizaje}`, 14, yPos);
    doc.text(`• Propósito institucional: ${stats.institucional}`, 110, yPos);
    
    // Línea separadora
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 8, 196, yPos + 8);
    
    // Preparar datos de la tabla con más información
    const tableData = currentWeekReservations.map((res: any) => {
      const purpose = res.purpose === 'aprendizaje' ? 'Académico' : 'Institucional';
      const details = res.purpose === 'aprendizaje' 
        ? `${res.purposeDetails?.area || 'N/A'} - ${res.purposeDetails?.grade || 'N/A'}° ${res.purposeDetails?.section || 'N/A'}`
        : res.purposeDetails?.activityName || 'N/A';
      
      return [
        format(res.startTime, "EEEE dd/MM/yyyy", { locale: es }),
        res.purposeDetails?.timeSlot || res.purposeDetails?.activityName || 'N/A',
        res.user.name,
        purpose,
        details,
        res.status
      ];
    });
    
    // Título de la tabla
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Reservas', 14, yPos + 20);
    
    // Configuración de la tabla mejorada
    (doc as any).autoTable({
      startY: yPos + 28,
      head: [['Fecha', 'Horario', 'Docente', 'Propósito', 'Detalles', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 }, // Fecha (más ancho para día de semana)
        1: { halign: 'center', cellWidth: 25 }, // Horario
        2: { halign: 'left', cellWidth: 35 },   // Docente
        3: { halign: 'center', cellWidth: 25 }, // Propósito
        4: { halign: 'left', cellWidth: 45 },   // Detalles
        5: { halign: 'center', cellWidth: 25 }  // Estado
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      didParseCell: function(data: any) {
        // Colorear estados
        if (data.column.index === 5) { // Columna Estado
          const status = data.cell.text[0];
          switch(status) {
            case 'Confirmada':
              data.cell.styles.textColor = [46, 125, 50]; // Verde oscuro
              data.cell.styles.fontStyle = 'bold';
              break;
            case 'Completada':
              data.cell.styles.textColor = [56, 142, 60]; // Verde
              data.cell.styles.fontStyle = 'bold';
              break;
            case 'Cancelada':
              data.cell.styles.textColor = [211, 47, 47]; // Rojo
              data.cell.styles.fontStyle = 'bold';
              break;
          }
        }
        // Colorear propósito
        if (data.column.index === 3) { // Columna Propósito
          const purpose = data.cell.text[0];
          if (purpose === 'Académico') {
            data.cell.styles.textColor = [25, 118, 210]; // Azul
            data.cell.styles.fontStyle = 'bold';
          } else if (purpose === 'Institucional') {
            data.cell.styles.textColor = [156, 39, 176]; // Púrpura
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página ${i} de ${pageCount}`, 14, 285);
      doc.text('Sistema de Gestión - Aula de Innovación Pedagógica', 196, 285, { align: 'right' });
    }
    
    doc.save(`reporte_reservas_semana_${format(weekStart, 'yyyy-MM-dd')}.pdf`);
    setIsExportOpen(false);
    toast({
      title: "Exportación a PDF Exitosa",
      description: `Se ha generado un reporte completo con ${currentWeekReservations.length} reservas.`
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
        reservations={reservations}
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
        itemCount={currentWeekReservations.length}
        itemName={`Reservas de la Semana del ${format(weekStart, 'd')} al ${format(weekEnd, "d 'de' MMMM, yyyy", { locale: es })}`}
      />
    </>
  );
}

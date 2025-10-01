'use client';

import { useMemo } from 'react';
import { ExportDialog } from '@/components/export-dialog';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import type { Loan } from '@/domain/types';

type LoansExportDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  loans: Loan[];
  filterType?: 'all' | 'active' | 'overdue' | 'pending' | 'returned';
};

export function LoansExportDialog({
  isOpen,
  onOpenChange,
  loans,
  filterType = 'all'
}: LoansExportDialogProps) {

  // Filtrar préstamos según el tipo seleccionado
  const filteredLoans = useMemo(() => {
    switch (filterType) {
      case 'active':
        return loans.filter(loan => loan.status === 'active');
      case 'overdue':
        return loans.filter(loan =>
          loan.status === 'active' &&
          loan.returnDate &&
          isBefore(loan.returnDate, startOfDay(new Date()))
        );
      case 'pending':
        return loans.filter(loan => loan.status === 'pending');
      case 'returned':
        return loans.filter(loan => loan.status === 'returned');
      default:
        return loans;
    }
  }, [loans, filterType]);

  // Crear datos para Excel con información enriquecida de préstamos
  const handleExportExcel = () => {
    const dataToExport = filteredLoans.map(loan => {
      // Información básica
      const baseInfo = {
        'ID Préstamo': loan.id,
        'Usuario': loan.user.name,
        'DNI': loan.user.dni || 'N/A',
        'Rol': loan.user.role,
        'Estado': loan.status === 'active' ? 'Activo' :
                 loan.status === 'pending' ? 'Pendiente' :
                 loan.status === 'returned' ? 'Devuelto' : 'Rechazado',
        'Fecha Préstamo': format(loan.loanDate, "dd/MM/yyyy", { locale: es }),
        'Fecha Devolución': loan.returnDate ? format(loan.returnDate, "dd/MM/yyyy", { locale: es }) : 'N/A',
        'Propósito': loan.purpose === 'aprendizaje' ? 'Aprendizaje' : 'Institucional',
      };

      // Información detallada del propósito
      if (loan.purposeDetails) {
        if (loan.purpose === 'aprendizaje') {
          return {
            ...baseInfo,
            'Área': loan.purposeDetails.area || 'N/A',
            'Grado': loan.purposeDetails.grade || 'N/A',
            'Sección': loan.purposeDetails.section || 'N/A',
            'Actividad': 'N/A',
          };
        } else {
          return {
            ...baseInfo,
            'Área': 'N/A',
            'Grado': 'N/A',
            'Sección': 'N/A',
            'Actividad': loan.purposeDetails.activityName || 'N/A',
          };
        }
      }

      // Recursos prestados
      const resourcesText = loan.resources.map(r => `${r.name} (${r.brand || 'N/A'})`).join('; ');

      return {
        ...baseInfo,
        'Recursos': resourcesText,
        'Cantidad Recursos': loan.resources.length,
      };
    });

    // Crear hoja de resumen
    const summaryData = [
      { 'Métrica': 'Total Préstamos', 'Valor': filteredLoans.length },
      { 'Métrica': 'Préstamos Activos', 'Valor': filteredLoans.filter(l => l.status === 'active').length },
      { 'Métrica': 'Préstamos Vencidos', 'Valor': filteredLoans.filter(l => l.status === 'active' && l.returnDate && isBefore(l.returnDate, startOfDay(new Date()))).length },
      { 'Métrica': 'Préstamos Pendientes', 'Valor': filteredLoans.filter(l => l.status === 'pending').length },
      { 'Métrica': 'Préstamos Institucionales', 'Valor': filteredLoans.filter(l => l.purpose === 'institucional').length },
      { 'Métrica': 'Préstamos de Aprendizaje', 'Valor': filteredLoans.filter(l => l.purpose === 'aprendizaje').length },
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);

    // Configurar anchos de columna
    worksheet['!cols'] = [
      { wch: 12 }, // ID
      { wch: 25 }, // Usuario
      { wch: 12 }, // DNI
      { wch: 10 }, // Rol
      { wch: 10 }, // Estado
      { wch: 12 }, // Fecha Préstamo
      { wch: 12 }, // Fecha Devolución
      { wch: 12 }, // Propósito
      { wch: 20 }, // Área/Actividad
      { wch: 10 }, // Grado
      { wch: 10 }, // Sección
      { wch: 40 }, // Recursos
      { wch: 15 }, // Cantidad
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle Préstamos');

    // Nombre del archivo basado en el filtro
    const filterText = filterType === 'all' ? 'todos' :
                      filterType === 'active' ? 'activos' :
                      filterType === 'overdue' ? 'vencidos' :
                      filterType === 'pending' ? 'pendientes' : 'devueltos';

    XLSX.writeFile(workbook, `prestamos_${filterText}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

    onOpenChange(false);
    toast({
      title: "Exportación a Excel Exitosa",
      description: `Se han exportado ${filteredLoans.length} préstamos.`
    });
  };
  // Crear PDF con información detallada de préstamos
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Colores profesionales
    const primaryColor: [number, number, number] = [41, 128, 185]; // Azul
    const secondaryColor: [number, number, number] = [52, 152, 219]; // Azul claro
    const accentColor: [number, number, number] = [46, 204, 113]; // Verde
    const warningColor: [number, number, number] = [241, 196, 15]; // Amarillo
    const dangerColor: [number, number, number] = [231, 76, 60]; // Rojo
    const textColor: [number, number, number] = [44, 62, 80]; // Gris oscuro

    // Encabezado profesional
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE PRÉSTAMOS', 14, 20);

    // Subtítulo con información del filtro
    const filterText = filterType === 'all' ? 'Todos los Préstamos' :
                      filterType === 'active' ? 'Préstamos Activos' :
                      filterType === 'overdue' ? 'Préstamos Vencidos' :
                      filterType === 'pending' ? 'Préstamos Pendientes' : 'Préstamos Devueltos';

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(filterText, 14, 28);

    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`, 14, 32);

    // Estadísticas resumidas
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', 14, 50);

    const stats = {
      total: filteredLoans.length,
      activos: filteredLoans.filter(l => l.status === 'active').length,
      vencidos: filteredLoans.filter(l => l.status === 'active' && l.returnDate && isBefore(l.returnDate, startOfDay(new Date()))).length,
      pendientes: filteredLoans.filter(l => l.status === 'pending').length,
      aprendizaje: filteredLoans.filter(l => l.purpose === 'aprendizaje').length,
      institucional: filteredLoans.filter(l => l.purpose === 'institucional').length,
      totalRecursos: filteredLoans.reduce((sum, loan) => sum + loan.resources.length, 0)
    };

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let yPos = 58;

    // Estadísticas en dos columnas
    doc.text(`• Total de préstamos: ${stats.total}`, 14, yPos);
    doc.text(`• Préstamos activos: ${stats.activos}`, 110, yPos);
    yPos += 6;
    doc.text(`• Préstamos vencidos: ${stats.vencidos}`, 14, yPos);
    doc.text(`• Préstamos pendientes: ${stats.pendientes}`, 110, yPos);
    yPos += 6;
    doc.text(`• Propósito académico: ${stats.aprendizaje}`, 14, yPos);
    doc.text(`• Propósito institucional: ${stats.institucional}`, 110, yPos);
    yPos += 6;
    doc.text(`• Total recursos prestados: ${stats.totalRecursos}`, 14, yPos);

    // Preparar datos de tabla detallada
    const tableData = filteredLoans.map(loan => {
      const estado = loan.status === 'active' ? 'Activo' :
                    loan.status === 'pending' ? 'Pendiente' :
                    loan.status === 'returned' ? 'Devuelto' : 'Rechazado';

      const recursosText = loan.resources.map(r => `${r.name} (${r.brand || 'N/A'})`).join(', ');

      const diasVencido = loan.status === 'active' && loan.returnDate && isBefore(loan.returnDate, startOfDay(new Date()))
        ? Math.ceil((startOfDay(new Date()).getTime() - loan.returnDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return [
        loan.user.name,
        estado,
        format(loan.loanDate, "dd/MM/yyyy", { locale: es }),
        loan.returnDate ? format(loan.returnDate, "dd/MM/yyyy", { locale: es }) : 'N/A',
        diasVencido > 0 ? `${diasVencido} días` : 'A tiempo',
        loan.purpose === 'aprendizaje' ? 'Académico' : 'Institucional',
        recursosText.length > 50 ? recursosText.substring(0, 47) + '...' : recursosText
      ];
    });

    // Título de tabla
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Préstamos', 14, yPos + 15);

    // Crear tabla con colores condicionales
    (doc as any).autoTable({
      startY: yPos + 22,
      head: [['Usuario', 'Estado', 'Fecha Préstamo', 'Fecha Devolución', 'Días Vencido', 'Propósito', 'Recursos']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 35 },   // Usuario
        1: { halign: 'center', cellWidth: 20 }, // Estado
        2: { halign: 'center', cellWidth: 25 }, // Fecha Préstamo
        3: { halign: 'center', cellWidth: 25 }, // Fecha Devolución
        4: { halign: 'center', cellWidth: 20 }, // Días Vencido
        5: { halign: 'center', cellWidth: 20 }, // Propósito
        6: { halign: 'left', cellWidth: 45 }    // Recursos
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
        if (data.column.index === 1) { // Columna Estado
          const status = data.cell.text?.[0];
          if (status) {
            switch(status) {
              case 'Activo':
                data.cell.styles.textColor = [46, 125, 50]; // Verde oscuro
                data.cell.styles.fontStyle = 'bold';
                break;
              case 'Pendiente':
                data.cell.styles.textColor = [255, 193, 7]; // Amarillo
                data.cell.styles.fontStyle = 'bold';
                break;
              case 'Devuelto':
                data.cell.styles.textColor = [76, 175, 80]; // Verde
                data.cell.styles.fontStyle = 'bold';
                break;
            }
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

    const fileNameText = filterType === 'all' ? 'todos' :
                         filterType === 'active' ? 'activos' :
                         filterType === 'overdue' ? 'vencidos' :
                         filterType === 'pending' ? 'pendientes' : 'devueltos';

    doc.save(`reporte_prestamos_${fileNameText}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    onOpenChange(false);
    toast({
      title: "Exportación a PDF Exitosa",
      description: `Se ha generado un reporte detallado con ${filteredLoans.length} préstamos.`
    });
  };

  return (
    <ExportDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onExportExcel={handleExportExcel}
      onExportPDF={handleExportPDF}
      itemCount={filteredLoans.length}
      itemName={`Préstamos ${filterType === 'all' ? 'Registrados' :
                        filterType === 'active' ? 'Activos' :
                        filterType === 'overdue' ? 'Vencidos' :
                        filterType === 'pending' ? 'Pendientes' : 'Devueltos'}`}
    />
  );
}

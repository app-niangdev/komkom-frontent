import { Injectable } from '@angular/core';
import { ReportingResponse } from 'src/app/interfaces/ReportinData';
import { Expense } from 'src/app/interfaces/Expense';

type JsPdfModule = typeof import('jspdf').default;
type AutoTableFn = typeof import('jspdf-autotable').default;
type XlsxModule = typeof import('xlsx');

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private jsPdfPromise?: Promise<JsPdfModule>;
  private autoTablePromise?: Promise<AutoTableFn>;
  private xlsxPromise?: Promise<XlsxModule>;

  constructor() {}

  private loadJsPdf(): Promise<JsPdfModule> {
    if (!this.jsPdfPromise) {
      this.jsPdfPromise = import('jspdf').then((m) => m.default);
    }
    return this.jsPdfPromise;
  }

  private loadAutoTable(): Promise<AutoTableFn> {
    if (!this.autoTablePromise) {
      this.autoTablePromise = import('jspdf-autotable').then((m) => m.default);
    }
    return this.autoTablePromise;
  }

  private loadXlsx(): Promise<XlsxModule> {
    if (!this.xlsxPromise) {
      this.xlsxPromise = import('xlsx');
    }
    return this.xlsxPromise;
  }

  /**
   * Exporte les données du reporting en PDF
   */
  async exportToPDF(
    data: ReportingResponse,
    filters?: { start_date?: string; end_date?: string }
  ): Promise<void> {
    const jsPDF = await this.loadJsPdf();
    await this.loadAutoTable();
    const doc = new jsPDF() as InstanceType<JsPdfModule> & {
      lastAutoTable: { finalY: number };
    };

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de Tableau de Bord', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPosition = 30;

    if (filters?.start_date && filters?.end_date) {
      doc.text(
        `Période: Du ${this.formatDate(filters.start_date)} au ${this.formatDate(filters.end_date)}`,
        14,
        yPosition
      );
    } else if (filters?.start_date) {
      doc.text(`Date: ${this.formatDate(filters.start_date)}`, 14, yPosition);
    } else {
      doc.text(`Année: ${new Date().getFullYear()}`, 14, yPosition);
    }

    yPosition += 5;
    doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPosition);
    yPosition += 10;

    const globalStats = data.data.getAllStatistics;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques Globales', 14, yPosition);
    yPosition += 7;

    const autoTable = await this.loadAutoTable();
    autoTable(doc, {
      startY: yPosition,
      head: [['Catégorie', 'Valeur']],
      body: [
        ['Nombre de Clients', globalStats.customers.toString()],
        ['Nombre de Fournisseurs', globalStats.suppliers.toString()],
        ['Nombre de Produits', globalStats.products.toString()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques des Factures', 14, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Statut', 'Nombre']],
      body: [
        ['Total', globalStats.invoices.total.toString()],
        ['Payées', globalStats.invoices.paid.toString()],
        ['Non Payées', globalStats.invoices.no_paid.toString()],
        ['Partielles', globalStats.invoices.partial.toString()],
        ['Annulées', globalStats.invoices.cancelled.toString()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    if (globalStats.amounts) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Résumé des Montants', 14, yPosition);
      yPosition += 7;

      autoTable(doc, {
        startY: yPosition,
        head: [['Description', 'Montant (FCFA)']],
        body: [
          ["Chiffre d'Affaires", this.formatNumber(globalStats.amounts.total_amount)],
          ['Total Encaissé', this.formatNumber(globalStats.amounts.total_paid)],
          ['Créances en Cours', this.formatNumber(globalStats.amounts.total_unpaid)],
          ['Taux de Paiement', `${globalStats.amounts.payment_rate.toFixed(2)}%`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Détails par Période', 14, yPosition);
    yPosition += 7;

    const summaryData = data.data.invoiceStats.summary_data;
    const dataArray = Array.isArray(summaryData) ? summaryData : [summaryData];

    const tableData = dataArray.map((item) => [
      item.month || item.period || `${item.start_date} - ${item.end_date}`,
      this.formatNumber(item.total_amount),
      this.formatNumber(item.total_paid),
      this.formatNumber(item.total_unpaid),
      `${item.payment_rate.toFixed(2)}%`,
      item.invoice_count.toString()
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Période', 'Montant Total', 'Payé', 'Non Payé', 'Taux', 'Nb Factures']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 }
    });

    doc.save(this.generateFileName('rapport-dashboard', filters, 'pdf'));
  }

  /**
   * Exporte les données du reporting en Excel
   */
  async exportToExcel(
    data: ReportingResponse,
    filters?: { start_date?: string; end_date?: string }
  ): Promise<void> {
    const XLSX = await this.loadXlsx();
    const workbook = XLSX.utils.book_new();
    const globalStats = data.data.getAllStatistics;

    const globalStatsData = [
      ['RAPPORT DE TABLEAU DE BORD'],
      [],
      ['Période:', this.getFilterLabel(filters)],
      ['Date de génération:', new Date().toLocaleDateString('fr-FR')],
      [],
      ['STATISTIQUES GLOBALES'],
      ['Catégorie', 'Valeur'],
      ['Nombre de Clients', globalStats.customers],
      ['Nombre de Fournisseurs', globalStats.suppliers],
      ['Nombre de Produits', globalStats.products],
      [],
      ['STATISTIQUES DES FACTURES'],
      ['Statut', 'Nombre'],
      ['Total', globalStats.invoices.total],
      ['Payées', globalStats.invoices.paid],
      ['Non Payées', globalStats.invoices.no_paid],
      ['Partielles', globalStats.invoices.partial],
      ['Annulées', globalStats.invoices.cancelled],
      [],
      ['STATISTIQUES DES VENTES'],
      ['Statut', 'Nombre', 'Montant'],
      ['Confirmées', globalStats.sales.confirmed, globalStats.sales.confirmed_amount],
      ['En Attente', globalStats.sales.pending, globalStats.sales.pending_amount],
      ['Annulées', globalStats.sales.cancelled, 0]
    ];

    if (globalStats.amounts) {
      globalStatsData.push(
        [],
        ['RÉSUMÉ DES MONTANTS'],
        ['Description', 'Montant (FCFA)'],
        ["Chiffre d'Affaires", globalStats.amounts.total_amount],
        ['Total Encaissé', globalStats.amounts.total_paid],
        ['Créances en Cours', globalStats.amounts.total_unpaid],
        ['Taux de Paiement', `${globalStats.amounts.payment_rate.toFixed(2)}%`]
      );
    }

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(globalStatsData),
      'Statistiques Globales'
    );

    const summaryData = data.data.invoiceStats.summary_data;
    const dataArray = Array.isArray(summaryData) ? summaryData : [summaryData];

    const periodDetailsData: unknown[][] = [
      ['DÉTAILS PAR PÉRIODE'],
      [],
      [
        'Période',
        'Montant Total',
        'Montant Payé',
        'Montant Non Payé',
        'Montant Annulé',
        'Taux de Paiement',
        'Nb Factures',
        'Factures Actives',
        'Factures Annulées'
      ]
    ];

    dataArray.forEach((item) => {
      periodDetailsData.push([
        item.month || item.period || `${item.start_date} - ${item.end_date}`,
        item.total_amount,
        item.total_paid,
        item.total_unpaid,
        item.total_cancel,
        `${item.payment_rate.toFixed(2)}%`,
        item.invoice_count,
        item.active_invoice_count,
        item.cancelled_invoice_count
      ]);
    });

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(periodDetailsData),
      'Détails par Période'
    );

    XLSX.writeFile(
      workbook,
      this.generateFileName('rapport-dashboard', filters, 'xlsx')
    );
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }

  private getFilterLabel(filters?: {
    start_date?: string;
    end_date?: string;
  }): string {
    if (filters?.start_date && filters?.end_date) {
      return `Du ${this.formatDate(filters.start_date)} au ${this.formatDate(filters.end_date)}`;
    }
    if (filters?.start_date) {
      return `Le ${this.formatDate(filters.start_date)}`;
    }
    return `Année ${new Date().getFullYear()}`;
  }

  private generateFileName(
    baseName: string,
    filters?: { start_date?: string; end_date?: string },
    extension: string = 'pdf'
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    let filterSuffix = '';

    if (filters?.start_date && filters?.end_date) {
      filterSuffix = `_${filters.start_date}_${filters.end_date}`;
    } else if (filters?.start_date) {
      filterSuffix = `_${filters.start_date}`;
    } else {
      filterSuffix = `_${new Date().getFullYear()}`;
    }

    return `${baseName}${filterSuffix}_${timestamp}.${extension}`;
  }

  /**
   * Exporte les dépenses en PDF
   */
  async exportExpensesToPDF(
    expenses: Expense[],
    filters: { start_date: string; end_date?: string }
  ): Promise<void> {
    const jsPDF = await this.loadJsPdf();
    const autoTable = await this.loadAutoTable();
    const doc = new jsPDF() as InstanceType<JsPdfModule> & {
      lastAutoTable: { finalY: number };
    };

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport des Dépenses', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPosition = 30;

    if (filters.start_date && filters.end_date) {
      doc.text(
        `Période: Du ${this.formatDate(filters.start_date)} au ${this.formatDate(filters.end_date)}`,
        14,
        yPosition
      );
    } else if (filters.start_date) {
      doc.text(`Date de début: ${this.formatDate(filters.start_date)}`, 14, yPosition);
    }

    yPosition += 5;
    doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPosition);
    yPosition += 10;

    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Synthèse', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
      startY: yPosition,
      head: [['Catégorie', 'Valeur']],
      body: [
        ['Nombre de dépenses', expenses.length.toString()],
        ['Montant total', `${this.formatNumber(totalAmount)} FCFA`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69] }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Détails des Dépenses', 14, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Titre', 'Description', 'Montant']],
      body: expenses.map((expense) => [
        this.formatDate(expense.expense_date),
        expense.title,
        expense.description || '-',
        `${this.formatNumber(expense.amount)} FCFA`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 45 },
        2: { cellWidth: 70 },
        3: { cellWidth: 35, halign: 'right' }
      }
    });

    doc.save(this.generateFileName('depenses', filters, 'pdf'));
  }
}

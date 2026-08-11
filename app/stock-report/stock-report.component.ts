import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-stock-report',
  templateUrl: './stock-report.component.html',
  styleUrls: ['./stock-report.component.css']
})
export class StockReportComponent implements OnInit {

  Math = Math;
  allData: any[] = [];
  filteredRows: any[] = [];
  pagedRows: any[] = [];
  loading = true;

  fromDate = '';
  toDate = '';

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    this.http.get(`${this.apiUrl}/stock-history`).subscribe({
      next: (res: any) => {
        this.allData = res.data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Failed to load stock history');
        this.loading = false;
      }
    });
  }

  applyFilter() {
    if (!this.fromDate || !this.toDate) {
      this.toastr.warning('Please select both From and To dates');
      return;
    }

    this.filteredRows = this.allData.filter(row => {
      return row.date >= this.fromDate && row.date <= this.toDate;
    });

    this.currentPage = 1;
    this.applySorting();
    this.updatePagination();
  }

  resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.filteredRows = [...this.allData];
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.currentPage = 1;
    this.updatePagination();
  }

  get totalOpening(): number {
    return this.filteredRows.reduce((sum, r) => sum + (r.openingStock || 0), 0);
  }

  get totalSales(): number {
    return this.filteredRows.reduce((sum, r) => sum + (r.totalSales || 0), 0);
  }

  get totalPurchase(): number {
    return this.filteredRows.reduce((sum, r) => sum + ((r.purchaseQty || 0) + (r.stockAdded || 0)), 0);
  }

  get totalCurrent(): number {
    return this.filteredRows.reduce((sum, r) => sum + (r.currentStock || 0), 0);
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
    this.updatePagination();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  applySorting() {
    if (!this.sortColumn) return;
    this.filteredRows.sort((a: any, b: any) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRows = this.filteredRows.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  printReport() {
    const tableEl = document.getElementById('stock-report-table');
    if (!tableEl) return;

    const popupWindow = window.open('', '_blank', 'width=1200,height=900');
    popupWindow?.document.write(`
      <html>
      <head><title>Stock Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #2563eb; color: white; }
        tr:nth-child(even) { background: #f2f2f2; }
        h2 { text-align: center; margin-bottom: 10px; }
        .summary-row { display: flex; gap: 20px; margin-bottom: 20px; justify-content: center; }
        .summary-item { text-align: center; padding: 10px 20px; border: 1px solid #ddd; border-radius: 8px; }
        .summary-item h4 { margin: 0; color: #2563eb; }
        .summary-item p { margin: 4px 0 0; font-size: 12px; color: #666; }
        @media print { body { padding: 10px; } }
      </style>
      </head>
      <body>
        <h2>Stock Report</h2>
        <p style="text-align:center;">${this.fromDate} to ${this.toDate}</p>
        <div class="summary-row">
          <div class="summary-item"><h4>${this.totalOpening}</h4><p>Total Opening</p></div>
          <div class="summary-item"><h4>${this.totalSales}</h4><p>Total Sales</p></div>
          <div class="summary-item"><h4>${this.totalPurchase}</h4><p>Total Purchase</p></div>
          <div class="summary-item"><h4>${this.totalCurrent}</h4><p>Total Current</p></div>
        </div>
        ${tableEl.outerHTML}
      </body></html>
    `);
    popupWindow?.document.close();
    setTimeout(() => {
      popupWindow?.print();
      popupWindow?.close();
    }, 1000);
  }

  downloadPdf() {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Stock Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${this.fromDate} to ${this.toDate}`, 14, 22);
    doc.text(`Opening: ${this.totalOpening} | Sales: ${this.totalSales} | Purchase: ${this.totalPurchase} | Current: ${this.totalCurrent}`, 14, 29);

    const headers = ['Date', 'Product Name', 'Size', 'Opening Stock', 'Total Sales', 'Purchase', 'Stock Added', 'Current Stock', 'Change Reason'];
    const rows = this.filteredRows.map(r => [
      r.date || '',
      r.productName || '',
      r.productSize || '',
      (r.openingStock || 0).toString(),
      (r.totalSales || 0).toString(),
      (r.purchaseQty || 0).toString(),
      (r.stockAdded || 0).toString(),
      (r.currentStock || 0).toString(),
      r.changeReason || ''
    ]);

    const startY = 34;
    const cellPadding = 2;
    const colWidths = [25, 40, 20, 25, 25, 25, 25, 25, 30];
    const rowHeight = 7;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    let y = startY;
    let x = 14;
    doc.setFillColor(37, 99, 235);
    doc.rect(14, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    headers.forEach((h, i) => {
      doc.setTextColor(255, 255, 255);
      doc.text(h, x + cellPadding, y + 5);
      x += colWidths[i];
    });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    rows.forEach((row, ri) => {
      y += rowHeight;
      if (y > 190) {
        doc.addPage();
        y = 14;
      }
      if (ri % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
      }
      x = 14;
      row.forEach((cell, ci) => {
        const maxW = colWidths[ci] - cellPadding * 2;
        let text = cell;
        if (doc.getTextWidth(text) > maxW) {
          while (doc.getTextWidth(text + '...') > maxW && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(text, x + cellPadding, y + 5);
        x += colWidths[ci];
      });
    });

    doc.save(`Stock_Report_${this.fromDate}_to_${this.toDate}.pdf`);
  }

  exportExcel() {
    const headers = ['Date', 'Product Name', 'Size', 'Opening Stock', 'Total Sales', 'Purchase', 'Stock Added', 'Current Stock', 'Change Reason'];
    const rows = this.filteredRows.map(r => [
      r.date || '',
      r.productName || '',
      r.productSize || '',
      r.openingStock || 0,
      r.totalSales || 0,
      r.purchaseQty || 0,
      r.stockAdded || 0,
      r.currentStock || 0,
      r.changeReason || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Stock_Report_${this.fromDate}_to_${this.toDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  goBack() {
    const isAdmin = localStorage.getItem('role') === 'admin';
    this.router.navigate([isAdmin ? '/admin/stock-management' : '/stock-management']);
  }
}

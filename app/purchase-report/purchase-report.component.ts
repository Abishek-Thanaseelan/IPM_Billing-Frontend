import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PurchaseService } from '../core/services/purchase.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-purchase-report',
  templateUrl: './purchase-report.component.html',
  styleUrls: ['./purchase-report.component.css']
})
export class PurchaseReportComponent implements OnInit {

  Math = Math;
  allPurchases: any[] = [];
  filteredRows: any[] = [];
  pagedRows: any[] = [];
  loading = true;

  fromDate = '';
  toDate = '';
  searchQuery = '';
  filterSupplier = '';
  filterProduct = '';

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'desc';

  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  supplierSuggestions: string[] = [];
  productSuggestions: string[] = [];

  constructor(
    private purchaseService: PurchaseService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.loadPurchases();
  }

  loadPurchases() {
    this.loading = true;
    this.purchaseService.getAllPurchases().subscribe({
      next: (res: any) => {
        this.allPurchases = res || [];
        this.buildSuggestions();
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Failed to load purchase data');
        this.loading = false;
      }
    });
  }

  buildSuggestions() {
    const suppliers = new Set<string>();
    const products = new Set<string>();
    for (const p of this.allPurchases) {
      if (p.supplierName) suppliers.add(p.supplierName);
      for (const item of (p.items || [])) {
        if (item.productName) products.add(item.productName);
      }
    }
    this.supplierSuggestions = Array.from(suppliers).sort();
    this.productSuggestions = Array.from(products).sort();
  }

  flattenPurchases(purchases: any[]): any[] {
    const rows: any[] = [];
    for (const p of purchases) {
      for (const item of (p.items || [])) {
        const qty = Number(item.qty || 0);
        const rate = Number(item.rate || 0);
        const gstPercent = Number(item.gstPercent || 0);
        const gstAmount = Number(item.gstAmount || 0);
        const discount = Number(item.discount || 0);
        const netAmount = Number(item.netAmount || item.amount || rate * qty);

        rows.push({
          invoiceNo: p.invoiceNo || '',
          invoiceDate: p.invoiceDate || '',
          supplierName: p.supplierName || '',
          mobileNo: p.mobileNo || '',
          productName: item.productName || '',
          productSize: item.productSize || '',
          qty: qty,
          rate: rate,
          gstPercent: gstPercent,
          gstAmount: gstAmount,
          discount: discount,
          taxableAmount: rate * qty - gstAmount,
          netAmount: netAmount,
          totalAmount: Number(p.totalAmount || 0),
          paymentMethod: p.paymentMethod || 'N/A'
        });
      }
    }
    return rows;
  }

  applyFilter() {
    if (!this.fromDate || !this.toDate) {
      this.toastr.warning('Please select both From and To dates');
      return;
    }

    let filtered = this.allPurchases.filter(p => {
      const d = new Date(p.invoiceDate);
      const from = new Date(this.fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(this.toDate);
      to.setHours(23, 59, 59, 999);
      return d >= from && d <= to;
    });

    if (this.filterSupplier) {
      const q = this.filterSupplier.toLowerCase();
      filtered = filtered.filter(p =>
        p.supplierName && p.supplierName.toLowerCase().includes(q)
      );
    }

    if (this.filterProduct) {
      const q = this.filterProduct.toLowerCase();
      filtered = filtered.filter(p =>
        p.items && p.items.some((item: any) =>
          item.productName && item.productName.toLowerCase().includes(q)
        )
      );
    }

    this.filteredRows = this.flattenPurchases(filtered);

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      this.filteredRows = this.filteredRows.filter(r =>
        r.invoiceNo.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    }

    this.sortDirection = 'desc';
    this.sortColumn = 'invoiceDate';
    this.currentPage = 1;
    this.applySorting();
    this.updatePagination();
  }

  resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.searchQuery = '';
    this.filterSupplier = '';
    this.filterProduct = '';
    this.sortColumn = '';
    this.sortDirection = 'desc';
    this.currentPage = 1;
    this.filteredRows = this.flattenPurchases(this.allPurchases);
    this.updatePagination();
  }

  get totalQty(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.qty, 0);
  }

  get totalPurchaseAmount(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.netAmount, 0);
  }

  get totalGst(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.gstAmount, 0);
  }

  get totalDiscount(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.discount, 0);
  }

  get totalInvoices(): number {
    return new Set(this.filteredRows.map(r => r.invoiceNo)).size;
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
    const tableEl = document.getElementById('purchase-report-table');
    if (!tableEl) return;

    const popupWindow = window.open('', '_blank', 'width=1400,height=900');
    popupWindow?.document.write(`
      <html>
      <head><title>Purchase Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #2563eb; color: white; }
        tr:nth-child(even) { background: #f2f2f2; }
        h2 { text-align: center; margin-bottom: 10px; }
        .summary-row { display: flex; gap: 16px; margin-bottom: 20px; justify-content: center; }
        .summary-item { text-align: center; padding: 10px 20px; border: 1px solid #ddd; border-radius: 8px; }
        .summary-item h4 { margin: 0; color: #2563eb; }
        .summary-item p { margin: 4px 0 0; font-size: 12px; color: #666; }
        @media print { body { padding: 10px; } }
      </style>
      </head>
      <body>
        <h2>Purchase Report</h2>
        <p style="text-align:center;">${this.fromDate} to ${this.toDate}</p>
        <div class="summary-row">
          <div class="summary-item"><h4>${this.totalInvoices}</h4><p>Invoices</p></div>
          <div class="summary-item"><h4>${this.totalQty}</h4><p>Total Qty</p></div>
          <div class="summary-item"><h4>&#8377;${this.totalPurchaseAmount.toFixed(2)}</h4><p>Total Purchase</p></div>
          <div class="summary-item"><h4>&#8377;${this.totalGst.toFixed(2)}</h4><p>Total GST</p></div>
          <div class="summary-item"><h4>&#8377;${this.totalDiscount.toFixed(2)}</h4><p>Total Discount</p></div>
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
    doc.text('Purchase Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${this.fromDate} to ${this.toDate}`, 14, 22);
    doc.text(`Invoices: ${this.totalInvoices} | Qty: ${this.totalQty} | Purchase: Rs${this.totalPurchaseAmount.toFixed(2)} | GST: Rs${this.totalGst.toFixed(2)} | Discount: Rs${this.totalDiscount.toFixed(2)}`, 14, 29);

    const headers = ['Date', 'Invoice No', 'Supplier', 'Mobile', 'Product', 'Size', 'Qty', 'Rate', 'GST %', 'GST Amt', 'Discount', 'Taxable', 'Net Amt', 'Total', 'Payment'];
    const rows = this.filteredRows.map(r => [
      r.invoiceDate || '',
      r.invoiceNo,
      r.supplierName,
      r.mobileNo,
      r.productName,
      r.productSize,
      r.qty.toString(),
      'Rs' + r.rate.toFixed(2),
      r.gstPercent + '%',
      'Rs' + r.gstAmount.toFixed(2),
      'Rs' + r.discount.toFixed(2),
      'Rs' + r.taxableAmount.toFixed(2),
      'Rs' + r.netAmount.toFixed(2),
      'Rs' + r.totalAmount.toFixed(2),
      r.paymentMethod
    ]);

    const startY = 34;
    const cellPadding = 2;
    const colWidths = [22, 25, 35, 25, 30, 18, 12, 20, 15, 20, 20, 20, 20, 20, 20];
    const rowHeight = 7;

    doc.setFontSize(7);
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

    doc.save(`Purchase_Report_${this.fromDate}_to_${this.toDate}.pdf`);
  }

  exportExcel() {
    const headers = ['Date', 'Invoice No', 'Supplier Name', 'Mobile', 'Product Name', 'Product Size', 'Qty', 'Purchase Price', 'GST %', 'GST Amount', 'Discount', 'Taxable Amount', 'Net Amount', 'Total Amount', 'Payment Method'];
    const rows = this.filteredRows.map(r => [
      r.invoiceDate || '',
      r.invoiceNo,
      r.supplierName,
      r.mobileNo,
      r.productName,
      r.productSize,
      r.qty,
      r.rate,
      r.gstPercent,
      r.gstAmount.toFixed(2),
      r.discount.toFixed(2),
      r.taxableAmount.toFixed(2),
      r.netAmount.toFixed(2),
      r.totalAmount,
      r.paymentMethod
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Purchase_Report_${this.fromDate}_to_${this.toDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  goBack() {
    const isAdmin = localStorage.getItem('role') === 'admin';
    this.router.navigate([isAdmin ? '/admin/purchase' : '/purchase']);
  }
}

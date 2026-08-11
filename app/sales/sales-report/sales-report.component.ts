import { Component, OnInit } from '@angular/core';
import { SalesService } from '../../core/services/sales.service';
import { ProductService } from '../../core/services/product.service';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-sales-report',
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.css']
})
export class SalesReportComponent implements OnInit {

  allSales: any[] = [];
  filteredRows: any[] = [];
  pagedRows: any[] = [];
  loading = true;

  purchasePriceMap: any = {};

  fromDate = '';
  toDate = '';

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  constructor(
    private salesService: SalesService,
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.loadProducts();
    this.loadSales();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res.data || []);
        const map: any = {};
        for (const p of list) {
          const key = `${p.productName}_${p.productSize || ''}`;
          map[key] = Number(p.purchasePrice || 0);
        }
        this.purchasePriceMap = map;
      }
    });
  }

  getPurchasePrice(productName: string, productSize: string): number {
    const key = `${productName}_${productSize || ''}`;
    return this.purchasePriceMap[key] !== undefined ? this.purchasePriceMap[key] : 0;
  }

  isZeroGstSize(size: any): boolean {
    if (size === null || size === undefined) return false;
    const value = String(size).trim().toLowerCase().replace(/\s+/g, '');
    return value === '26' || value === '26kg';
  }

  loadSales() {
    this.loading = true;
    this.salesService.getSales().subscribe({
      next: (res: any) => {
        this.allSales = res || [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Failed to load sales data');
        this.loading = false;
      }
    });
  }

  flattenSales(sales: any[]): any[] {
    const rows: any[] = [];
    for (const sale of sales) {
      for (const item of (sale.items || [])) {
        const qty = Number(item.qty || 0);
        const rate = Number(item.rate || 0);
        const cgst = Number(item.cgst || 0);
        const sgst = Number(item.sgst || 0);
        const igst = Number(item.igst || 0);
        const gstAmount = this.isZeroGstSize(item.productSize)
          ? 0
          : ((cgst + sgst) / 100) * rate * qty;
        const taxableAmount = rate * qty - gstAmount;
        const purchasePrice = this.getPurchasePrice(item.productName, item.productSize);
        const profit = (rate - purchasePrice) * qty;

        rows.push({
          invoiceNo: sale.invoiceNo || '',
          invoiceDate: sale.invoiceDate || '',
          customerName: sale.customerName || '',
          mobileNo: sale.mobileNo || '',
          productName: item.productName || '',
          productSize: item.productSize || '',
          qty: qty,
          unitPrice: rate,
          purchasePrice: purchasePrice,
          profit: profit,
          gstAmount: gstAmount,
          discount: Number(item.discount || 0),
          taxableAmount: taxableAmount,
          netAmount: Number(item.netAmount || item.amount || rate * qty),
          paymentStatus: sale.paymentStatus || '',
          paymentMethod: sale.paymentMethod || 'N/A',
          totalAmount: Number(sale.totalAmount || 0),
          receivedAmount: Number(sale.receivedAmount || 0),
          balanceAmount: Number(sale.balanceAmount || 0),
          salesPerson: sale.salesPerson || ''
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

    const from = new Date(this.fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(this.toDate);
    to.setHours(23, 59, 59, 999);

    const filtered = this.allSales.filter(sale => {
      const d = new Date(sale.invoiceDate);
      return d >= from && d <= to;
    });

    this.filteredRows = this.flattenSales(filtered);
    this.currentPage = 1;
    this.applySorting();
    this.updatePagination();
  }

  resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.filteredRows = this.flattenSales(this.allSales);
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.currentPage = 1;
    this.updatePagination();
  }

  get totalSales(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.netAmount, 0);
  }

  get totalOrders(): number {
    const invoices = new Set(this.filteredRows.map(r => r.invoiceNo));
    return invoices.size;
  }

  get totalQuantity(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.qty, 0);
  }

  get totalGst(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.gstAmount, 0);
  }

  get totalProfit(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.profit, 0);
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
    const printContents = document.getElementById('sales-report-table')?.outerHTML;
    if (!printContents) return;

    const popupWindow = window.open('', '_blank', 'width=1200,height=900');
    popupWindow?.document.write(`
      <html>
      <head><title>Sales Report</title>
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
        <h2>Sales Report</h2>
        <p style="text-align:center;">${this.fromDate} to ${this.toDate}</p>
        <div class="summary-row">
          <div class="summary-item"><h4>₹${this.totalSales.toFixed(2)}</h4><p>Total Sales</p></div>
          <div class="summary-item"><h4>${this.totalOrders}</h4><p>Total Orders</p></div>
          <div class="summary-item"><h4>${this.totalQuantity}</h4><p>Total Qty</p></div>
          <div class="summary-item"><h4>₹${this.totalGst.toFixed(2)}</h4><p>Total GST</p></div>
          <div class="summary-item"><h4>₹${this.totalProfit.toFixed(2)}</h4><p>Total Profit</p></div>
        </div>
        ${printContents}
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
    doc.text('Sales Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${this.fromDate} to ${this.toDate}`, 14, 22);
    doc.text(`Total Sales: Rs${this.totalSales.toFixed(2)} | Orders: ${this.totalOrders} | Qty: ${this.totalQuantity} | GST: Rs${this.totalGst.toFixed(2)} | Profit: Rs${this.totalProfit.toFixed(2)}`, 14, 29);

    const headers = ['Invoice No', 'Date', 'Customer', 'Mobile', 'Product', 'Qty', 'Unit Price', 'Purchase Price', 'Profit', 'GST', 'Discount', 'Taxable', 'Net Amt', 'Status', 'Payment Method', 'Total'];
    const rows = this.filteredRows.map(r => [
      r.invoiceNo,
      r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString() : '',
      r.customerName,
      r.mobileNo,
      r.productName,
      r.qty.toString(),
      'Rs' + r.unitPrice.toFixed(2),
      'Rs' + r.purchasePrice.toFixed(2),
      'Rs' + r.profit.toFixed(2),
      'Rs' + r.gstAmount.toFixed(2),
      'Rs' + r.discount.toFixed(2),
      'Rs' + r.taxableAmount.toFixed(2),
      'Rs' + r.netAmount.toFixed(2),
      r.paymentStatus,
      r.paymentMethod,
      'Rs' + r.totalAmount.toFixed(2)
    ]);

    const startY = 34;
    const cellPadding = 2;
    const colWidths = [25, 22, 35, 25, 30, 12, 22, 22, 22, 22, 22, 22, 22, 18, 25, 22];
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

    doc.save(`Sales_Report_${this.fromDate}_to_${this.toDate}.pdf`);
  }

  exportExcel() {
    const headers = ['Invoice No', 'Invoice Date', 'Customer Name', 'Mobile', 'Product', 'Size', 'Qty', 'Unit Price', 'Purchase Price', 'Profit', 'GST Amount', 'Discount', 'Taxable Amount', 'Net Amount', 'Payment Status', 'Payment Method', 'Total Amount', 'Sales Person'];
    const rows = this.filteredRows.map(r => [
      r.invoiceNo,
      r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString() : '',
      r.customerName,
      r.mobileNo,
      r.productName,
      r.productSize,
      r.qty,
      r.unitPrice,
      r.purchasePrice,
      r.profit.toFixed(2),
      r.gstAmount.toFixed(2),
      r.discount.toFixed(2),
      r.taxableAmount.toFixed(2),
      r.netAmount.toFixed(2),
      r.paymentStatus,
      r.paymentMethod,
      r.totalAmount,
      r.salesPerson
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Report_${this.fromDate}_to_${this.toDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

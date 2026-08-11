import { Component, OnInit } from '@angular/core';
import { DeliveryChallanService } from '../core/services/delivery-challan.service';
import { ProductService } from '../core/services/product.service';
import { ToastrService } from 'ngx-toastr';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-delivery-challan',
  templateUrl: './delivery-challan.component.html',
  styleUrls: ['./delivery-challan.component.css']
})
export class DeliveryChallanComponent implements OnInit {

  Math = Math;
  view: 'form' | 'list' = 'list';

  challanNo = '';
  challanDate = '';
  deliveryDate = '';
  vehicleNumber = '';
  transporterName = '';
  driverName = '';
  driverMobile = '';
  ewayBillNo = '';
  purposeOfDelivery = '';

  companyName = 'IPMEGA ENTERPRISES';
  companyAddress = '';
  companyGstin = '';
  companyMobile = '';

  customerName = '';
  customerMobile = '';
  customerAddress = '';
  customerGstin = '';

  items: any[] = [];

  activeProducts: any[] = [];
  selectedProductId = '';
  itemProductName = '';
  itemProductSize = '';
  itemQty = 0;
  itemUnit = 'NOS';
  itemRemarks = '';

  allChallans: any[] = [];
  filteredChallans: any[] = [];
  pagedChallans: any[] = [];

  fromDate = '';
  toDate = '';
  searchQuery = '';

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'desc';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  isEditMode = false;
  editId = '';
  loading = false;

  purposeOptions = ['Sales Delivery', 'Branch Transfer', 'Job Work', 'Approval Basis', 'Sales Return', 'Others'];

  constructor(
    private dcService: DeliveryChallanService,
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.challanDate = new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.loadNextChallanNo();
    this.loadProducts();
    this.loadChallans();
  }

  loadNextChallanNo() {
    this.dcService.getNextChallanNo().subscribe({
      next: (res: any) => { this.challanNo = res.nextNo; }
    });
  }

  loadProducts() {
    this.productService.getActiveProducts().subscribe({
      next: (res: any) => { this.activeProducts = res.data || []; }
    });
  }

  onProductSelect() {
    const p = this.activeProducts.find(x => x._id === this.selectedProductId);
    if (p) {
      this.itemProductName = p.productName;
      this.itemProductSize = p.productSize || '';
    }
  }

  addItem() {
    if (!this.itemProductName || this.itemQty <= 0) {
      this.toastr.warning('Select a product and enter quantity');
      return;
    }
    this.items.push({
      productName: this.itemProductName,
      productSize: this.itemProductSize,
      qty: this.itemQty,
      unit: this.itemUnit,
      remarks: this.itemRemarks
    });
    this.clearItem();
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  clearItem() {
    this.selectedProductId = '';
    this.itemProductName = '';
    this.itemProductSize = '';
    this.itemQty = 0;
    this.itemUnit = 'NOS';
    this.itemRemarks = '';
  }

  saveChallan() {
    if (!this.customerName) { this.toastr.warning('Customer name is required'); return; }
    if (this.items.length === 0) { this.toastr.warning('Add at least one product'); return; }

    const payload = {
      challanNo: this.challanNo,
      challanDate: this.challanDate,
      deliveryDate: this.deliveryDate,
      vehicleNumber: this.vehicleNumber,
      transporterName: this.transporterName,
      driverName: this.driverName,
      driverMobile: this.driverMobile,
      ewayBillNo: this.ewayBillNo,
      purposeOfDelivery: this.purposeOfDelivery,
      companyName: this.companyName,
      companyAddress: this.companyAddress,
      companyGstin: this.companyGstin,
      companyMobile: this.companyMobile,
      customerName: this.customerName,
      customerMobile: this.customerMobile,
      customerAddress: this.customerAddress,
      customerGstin: this.customerGstin,
      items: this.items
    };

    if (this.isEditMode) {
      this.dcService.update(this.editId, payload).subscribe({
        next: () => {
          this.toastr.success('Challan updated successfully');
          this.resetForm();
          this.view = 'list';
          this.loadChallans();
        },
        error: () => this.toastr.error('Update failed')
      });
    } else {
      this.dcService.create(payload).subscribe({
        next: () => {
          this.toastr.success('Challan saved successfully');
          this.resetForm();
          this.view = 'list';
          this.loadChallans();
        },
        error: () => this.toastr.error('Save failed')
      });
    }
  }

  resetForm() {
    this.challanDate = new Date().toISOString().split('T')[0];
    this.deliveryDate = '';
    this.vehicleNumber = '';
    this.transporterName = '';
    this.driverName = '';
    this.driverMobile = '';
    this.ewayBillNo = '';
    this.purposeOfDelivery = '';
    this.customerName = '';
    this.customerMobile = '';
    this.customerAddress = '';
    this.customerGstin = '';
    this.items = [];
    this.clearItem();
  }

  openNewChallan() {
    this.view = 'form';
    this.isEditMode = false;
    this.editId = '';
    this.resetForm();
    this.loadNextChallanNo();
  }

  loadChallans() {
    this.loading = true;
    this.dcService.getAll().subscribe({
      next: (res: any) => {
        this.allChallans = res.data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter() {
    let filtered = [...this.allChallans];

    if (this.fromDate && this.toDate) {
      filtered = filtered.filter(c => c.challanDate >= this.fromDate && c.challanDate <= this.toDate);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.challanNo || '').toLowerCase().includes(q) ||
        (c.customerName || '').toLowerCase().includes(q)
      );
    }

    this.filteredChallans = filtered;
    this.currentPage = 1;
    this.applySorting();
    this.updatePagination();
  }

  resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.searchQuery = '';
    this.sortColumn = '';
    this.sortDirection = 'desc';
    this.currentPage = 1;
    this.filteredChallans = [...this.allChallans];
    this.applySorting();
    this.updatePagination();
  }

  sortBy(col: string) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.applySorting();
    this.updatePagination();
  }

  getSortIcon(col: string): string {
    if (this.sortColumn !== col) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  applySorting() {
    if (!this.sortColumn) return;
    this.filteredChallans.sort((a: any, b: any) => {
      let vA = a[this.sortColumn] || '';
      let vB = b[this.sortColumn] || '';
      if (typeof vA === 'string') vA = vA.toLowerCase();
      if (typeof vB === 'string') vB = vB.toLowerCase();
      if (vA < vB) return this.sortDirection === 'asc' ? -1 : 1;
      if (vA > vB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredChallans.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedChallans = this.filteredChallans.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  editChallan(challan: any) {
    this.isEditMode = true;
    this.editId = challan._id;
    this.challanNo = challan.challanNo;
    this.challanDate = challan.challanDate;
    this.deliveryDate = challan.deliveryDate || '';
    this.vehicleNumber = challan.vehicleNumber || '';
    this.transporterName = challan.transporterName || '';
    this.driverName = challan.driverName || '';
    this.driverMobile = challan.driverMobile || '';
    this.ewayBillNo = challan.ewayBillNo || '';
    this.purposeOfDelivery = challan.purposeOfDelivery || '';
    this.companyName = challan.companyName || '';
    this.companyAddress = challan.companyAddress || '';
    this.companyGstin = challan.companyGstin || '';
    this.companyMobile = challan.companyMobile || '';
    this.customerName = challan.customerName || '';
    this.customerMobile = challan.customerMobile || '';
    this.customerAddress = challan.customerAddress || '';
    this.customerGstin = challan.customerGstin || '';
    this.items = [...(challan.items || [])];
    this.view = 'form';
  }

  deleteChallan(id: string) {
    if (!confirm('Delete this challan?')) return;
    this.dcService.delete(id).subscribe({
      next: () => {
        this.toastr.success('Deleted successfully');
        this.loadChallans();
      },
      error: () => this.toastr.error('Delete failed')
    });
  }

  printChallan(challan: any) {
    const items = (challan.items || []).map((item: any, i: number) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
        <td style="padding:6px;border:1px solid #ddd;">${item.productName} ${item.productSize ? '- ' + item.productSize : ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.unit}</td>
        <td style="padding:6px;border:1px solid #ddd;">${item.remarks || ''}</td>
      </tr>
    `).join('');

    const html = `
      <html><head><title>Delivery Challan - ${challan.challanNo}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:6px;}th{background:#2563eb;color:#fff;}.section-title{font-weight:bold;margin:10px 0 5px;color:#333;}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin:5px 0;}.info-grid p{margin:2px 0;}.signature-section{display:flex;justify-content:space-between;margin-top:40px;}.signature-box{width:45%;text-align:center;border-top:1px solid #333;padding-top:8px;}</style>
      </head><body>
        <div style="text-align:center;border-bottom:2px solid #2563eb;padding-bottom:10px;">
          <h2 style="margin:0;color:#2563eb;">DELIVERY CHALLAN</h2>
          <p style="margin:2px 0;">(Not a Tax Invoice)</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin:10px 0;">
          <div><strong>${challan.companyName || 'IPMEGA ENTERPRISES'}</strong><br>${challan.companyAddress || ''}<br>GSTIN: ${challan.companyGstin || 'N/A'}<br>Ph: ${challan.companyMobile || 'N/A'}</div>
          <div style="text-align:right;"><strong>Challan No:</strong> ${challan.challanNo}<br><strong>Date:</strong> ${challan.challanDate}<br>${challan.deliveryDate ? '<strong>Delivery Date:</strong> ' + challan.deliveryDate + '<br>' : ''}${challan.ewayBillNo ? '<strong>E-Way Bill:</strong> ' + challan.ewayBillNo : ''}</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin:10px 0;">
          <div class="section-title" style="width:48%;"><strong>To:</strong><br>${challan.customerName}<br>${challan.customerAddress || ''}<br>Ph: ${challan.customerMobile || ''}<br>GSTIN: ${challan.customerGstin || 'N/A'}</div>
          <div class="section-title" style="width:48%;"><strong>Transport Details:</strong><br>Vehicle: ${challan.vehicleNumber || 'N/A'}<br>Transporter: ${challan.transporterName || 'N/A'}<br>Driver: ${challan.driverName || 'N/A'}<br>Driver Mobile: ${challan.driverMobile || 'N/A'}<br>Purpose: ${challan.purposeOfDelivery || 'N/A'}</div>
        </div>
        <table style="margin-top:10px;">
          <thead><tr><th>#</th><th>Product Description</th><th>Quantity</th><th>Unit</th><th>Remarks</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
        <p style="margin-top:15px;font-size:11px;color:#666;"><em>Declaration: This document is issued for delivery purposes only and is not a tax invoice. Goods are being delivered as per the terms agreed between the parties.</em></p>
        <div class="signature-section">
          <div class="signature-box"><br><br>Receiver Signature</div>
          <div class="signature-box"><br><br>Authorized Signatory</div>
        </div>
      </body></html>
    `;

    const w = window.open('', '_blank', 'width=800,height=900');
    w?.document.write(html);
    w?.document.close();
    setTimeout(() => { w?.print(); }, 500);
  }

  downloadPdf(challan: any) {
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY CHALLAN', 105, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('(Not a Tax Invoice)', 105, 21, { align: 'center' });

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(10, 24, 200, 24);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(challan.companyName || 'IPMEGA ENTERPRISES', 10, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(challan.companyAddress || '', 10, 35);
    doc.text(`GSTIN: ${challan.companyGstin || 'N/A'}`, 10, 40);
    doc.text(`Ph: ${challan.companyMobile || 'N/A'}`, 10, 45);

    doc.setFont('helvetica', 'bold');
    doc.text('Challan No: ' + challan.challanNo, 140, 30);
    doc.setFont('helvetica', 'normal');
    doc.text('Date: ' + challan.challanDate, 140, 35);
    if (challan.deliveryDate) doc.text('Delivery Date: ' + challan.deliveryDate, 140, 40);
    if (challan.ewayBillNo) doc.text('E-Way Bill: ' + challan.ewayBillNo, 140, 45);

    doc.setFont('helvetica', 'bold');
    doc.text('To: ' + challan.customerName, 10, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(challan.customerAddress || '', 10, 60);
    doc.text(`Ph: ${challan.customerMobile || ''}  |  GSTIN: ${challan.customerGstin || 'N/A'}`, 10, 65);

    doc.setFont('helvetica', 'bold');
    doc.text('Transport Details', 140, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vehicle: ${challan.vehicleNumber || 'N/A'}`, 140, 60);
    doc.text(`Transporter: ${challan.transporterName || 'N/A'}`, 140, 65);
    doc.text(`Driver: ${challan.driverName || 'N/A'}`, 140, 70);
    doc.text(`Driver Mobile: ${challan.driverMobile || 'N/A'}`, 140, 75);
    doc.text(`Purpose: ${challan.purposeOfDelivery || 'N/A'}`, 140, 80);

    const headers = ['#', 'Product Description', 'Qty', 'Unit', 'Remarks'];
    const colWidths = [10, 75, 20, 25, 60];
    let y = 88;
    doc.setFillColor(37, 99, 235);
    doc.rect(10, y, 190, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    let x = 12;
    headers.forEach((h, i) => {
      doc.text(h, x, y + 5);
      x += colWidths[i];
    });

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    (challan.items || []).forEach((item: any, i: number) => {
      y += 7;
      if (y > 260) { doc.addPage(); y = 15; }
      if (i % 2 === 1) { doc.setFillColor(248, 250, 252); doc.rect(10, y, 190, 7, 'F'); }
      x = 12;
      const row = [
        String(i + 1),
        `${item.productName} ${item.productSize ? '- ' + item.productSize : ''}`,
        String(item.qty),
        item.unit || '',
        item.remarks || ''
      ];
      row.forEach((cell, ci) => {
        doc.text(cell, x, y + 5);
        x += colWidths[ci];
      });
    });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Declaration: This document is issued for delivery purposes only and is not a tax invoice.', 10, Math.min(y + 12, 275));

    const sigY = Math.min(y + 25, 265);
    doc.line(15, sigY, 85, sigY);
    doc.text('Receiver Signature', 35, sigY + 4);
    doc.line(115, sigY, 185, sigY);
    doc.text('Authorized Signatory', 135, sigY + 4);

    doc.save(`Delivery_Challan_${challan.challanNo}.pdf`);
  }
}

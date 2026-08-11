import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';

import { SalesReturnService } from '../../core/services/sales-return.service';

import { StockUpdateService } from '../../core/services/stock-update.service';

import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sales-return-list',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './sales-return-list.component.html',

  styleUrls: ['./sales-return-list.component.css'],
})
export class SalesReturnListComponent {
  // SEARCH
  currentDate = new Date();
  searchText = '';

  // HEADER DETAILS
  invoiceNo: string = '';
  invoiceDate: string = '';
  customerName: string = '';
  mobileNo: string = '';
  gstin: string = '';

  // SALES INFO
  totalAmount: number = 0;
  paidAmount: number = 0;
  balanceAmount: number = 0;

  // RETURN INFO
  refundPaid: number = 0;

  // TABLE
  returnList: any[] = [];

  // EDIT
  selectedReturnId: string = '';
  isEditMode: boolean = false;

  // FORM (optional clean approach)
  returnForm: any = {
    invoiceNo: '',
    productId: '',
    productName: '',
    returnQty: 0,
    returnAmount: 0,
    refundPaid: 0,
  };

  totalReturnAmount: number = 0;
  refundBalance: number = 0;

  constructor(
    private service: SalesReturnService,

    private toastr: ToastrService,

    private stockUpdateService: StockUpdateService,

    private router: Router,
  ) {}

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }
  // SEARCH INVOICE

  searchInvoice() {
    if (!this.searchText) {
      this.toastr.warning('Enter Invoice / Customer / Mobile', 'Warning', {
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.service.getInvoice(this.searchText).subscribe({
      next: (res: any) => {
        console.log('FULL RESPONSE =>', res);
        console.log('PRODUCTS =>', res.products);

        if (res.products && res.products.length > 0) {
          console.log('FIRST PRODUCT =>', res.products[0]);
          console.log(
            'PRODUCT JSON =>',
            JSON.stringify(res.products[0], null, 2),
          );
        }

        // HEADER
        this.invoiceNo = res.invoiceNo;
        this.invoiceDate = res.invoiceDate;
        this.customerName = res.customerName;
        this.mobileNo = res.mobileNo;
        this.gstin = res.gstin;

        this.totalAmount = res.totalAmount || 0;
        this.paidAmount = res.paidAmount || 0;
        this.balanceAmount = res.balanceAmount || 0;

        this.totalReturnAmount = res.totalReturnAmount || 0;
        this.refundPaid = res.totalRefundPaid || 0;
        this.refundBalance = res.refundBalance || 0;
        // TABLE
        this.returnList = res.products.map((p: any, index: number) => {
          return {
            sno: index + 1,

            productName: p.productName || '',

            size: p.productSize || '',

            unit: p.unit || '',

            rate: Number(p.rate || 0),

            soldQty: Number(p.qty || 0),

            gst: Number((p.cgst || 0) + (p.sgst || 0) + (p.igst || 0)),

            amount: Number(p.amount || 0),

            total: Number(p.netAmount || p.amount || 0),

            returnQty: 0,

            _id: p._id,
          };
        });

        console.log('RETURN LIST =>', this.returnList);

        this.toastr.success('Invoice Loaded Successfully');
      },

      error: (err) => {
        console.log('FULL ERROR =>', err);

        this.returnList = [];

        this.toastr.error(err?.error?.message || 'Invoice Not Found');
      },
    });
  }

  // CALCULATE

  calculateTotal(item: any) {
    if (item.returnQty > item.soldQty) {
      this.toastr.warning('Return Qty Exceeds Sold Qty');

      item.returnQty = 0;

      item.amount = 0;

      item.total = 0;

      return;
    }

    const amount = item.rate * item.returnQty;

    const gstAmount = (amount * item.gst) / 100;

    item.amount = amount;

    item.total = amount + gstAmount;
  }

  // GRAND TOTAL

  getGrandTotal(): number {
    return this.returnList.reduce(
      (sum, item) => sum + (item.total || 0),

      0,
    );
  }

  // MORE RETURN

  moreReturn() {
    this.returnList.push({
      productName: '',

      size: '',

      unit: '',

      rate: 0,

      soldQty: 0,

      returnQty: 0,

      gst: 0,

      amount: 0,

      total: 0,
    });

    this.toastr.info('New Return Row Added');
  }

  // SAVE RETURN

  saveReturn() {

  const returnProducts = this.returnList.filter(x => x.returnQty > 0);

  if (returnProducts.length === 0) {
    this.toastr.warning('Enter Return Qty');
    return;
  }

  const data = {
    invoiceNo: this.invoiceNo,
    customerName: this.customerName,
    mobileNo: this.mobileNo,
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    returnAmount: this.getGrandTotal(),
    refundPaid: this.refundPaid || 0,
    products: returnProducts,
  };

  this.service.saveReturn(data).subscribe({

    next: (res: any) => {

      this.stockUpdateService.triggerUpdate();

      Swal.fire({
        icon: 'success',
        title: 'Sales Return Saved',
        text: 'Stock Updated Successfully',
        confirmButtonColor: '#198754',
      }).then(() => {

       
        this.resetReturnForm();

      });

    },

    error: (err) => {

      console.log(err);

      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err?.error?.message || 'Unable to save return',
      });

    }

  });

}
  resetReturnForm() {

  this.searchText = '';
  this.invoiceDate = '';
  this.customerName = '';
  this.mobileNo = '';
  this.invoiceNo = '';
  this.gstin = '';

  this.returnList = [];

  this.totalAmount = 0;
  this.paidAmount = 0;
  this.balanceAmount = 0;

  this.refundPaid = 0;

}

  deleteReturn(item: any) {
    this.service.deleteReturn(item._id).subscribe({
      next: () => {
        Swal.fire('Deleted', 'Return Deleted Successfully', 'success');

        // Refresh

        this.searchInvoice();
      },
    });
  }

  editReturn(item: any) {
    this.isEditMode = true;
    this.selectedReturnId = item._id;

    this.returnForm = { ...item };
  }
}

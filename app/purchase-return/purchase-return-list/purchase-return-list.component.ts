import { Component } from '@angular/core';
import { PurchaseService } from '../../core/services/purchase.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

import { Router } from '@angular/router';

@Component({
  selector: 'app-purchase-return',
  templateUrl: './purchase-return-list.component.html',
  styleUrls: ['./purchase-return-list.component.css'],
})
export class PurchaseReturnListComponent {
  currentDate = new Date();

  gstType = 'GST';

  partyType = 'Retailer';

  returnNo = '';

  supplierName = '';

  mobileNo = '';

  gstin = '';

  invoiceNo = '';

  hsnSac = '';

  searchText = '';

  productList: any[] = [];

  purchaseList: any[] = [];

  returnDate: string = new Date().toISOString().split('T')[0];

  totalAmount: number = 0;
  paidAmount: number = 0;
  balance: number = 0;

  // Top Form

  purchaseData = {
    gstType: 'Non-GST',
    partyType: 'Retailer',
    hsnSac: '',
    returnNo: '',
    returnDate: '',
    taxType: 'Local',
    stockPlace: 'IPMEGA-1',
    supplierName: '',
    mobileNo: '',
    gstin: '',
    invoiceNo: '',
    totalAmount: 0,
    paidAmount: 0,
    balance: 0,
  };

  // Product Form

  product = {
    productName: '',

    size: '',

    unit: '',

    rate: 0,

    qty: 0,

    gst: 0,
  };

  // Purchase Details
  purchaseAmount = 0;
  purchasePaidAmount = 0;
  purchaseBalance = 0;

  // Refund Details
  refundTotalAmount = 0;
  receivedRefundAmount = 0;
  refundBalance = 0;

  constructor(
    private purchaseService: PurchaseService,
    private toastr: ToastrService,
    private router: Router,
  ) {}

  calculateRefundBalance() {
    this.refundBalance =
      this.refundTotalAmount - (this.receivedRefundAmount || 0);
  }

  calculateRefundTotal() {
    this.refundTotalAmount = this.productList.reduce((sum, item) => {
      return sum + (item.returnTotal || 0);
    }, 0);

    this.calculateRefundBalance();
  }

  calcBalance() {
    this.balance = (this.totalAmount || 0) - (this.paidAmount || 0);
  }

  

  calcRow(item: any) {
      if (item.returnQty > item.qty) {
    item.returnQty = item.qty;
  }

  if (item.returnQty < 0) {
    item.returnQty = 0;
  }

    const availableQty = item.qty || 0;

    if (item.returnQty > availableQty) {
      item.returnQty = availableQty;
      this.toastr.warning(`Return qty cannot exceed ${availableQty}`);
    }

    //  RETURN AMOUNT CALC
    item.returnAmount = (item.rate || 0) * (item.returnQty || 0);

    item.returnGst = (item.returnAmount * (item.gstPercent || 0)) / 100;

    item.returnTotal = item.returnAmount + item.returnGst;

    //  AUTO REFUND UPDATE
    this.calculateRefundTotal();
  }

  calcTotal() {
    this.totalAmount = this.productList.reduce((sum, item) => {
      return sum + (item.total || 0);
    }, 0);

    this.calcBalance();
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // Add Product

  addProduct() {
    if (
      this.product.productName == '' ||
      this.product.qty <= 0 ||
      this.product.rate <= 0
    ) {
      alert('Please fill all required fields');
      return;
    }

    let amount = this.product.rate * this.product.qty;

    let gstAmount = (amount * this.product.gst) / 100;

    let total = amount + gstAmount;

    this.productList.push({
      productName: this.product.productName,
      size: this.product.size,
      unit: this.product.unit,
      rate: this.product.rate,
      qty: this.product.qty,
      gst: this.product.gst,
      amount: amount,
      gstAmount: gstAmount,
      total: total,
    });

    this.calcTotal();

    // Reset Form

    this.product = {
      productName: '',
      size: '',
      unit: '',
      rate: 0,
      qty: 0,
      gst: 0,
    };
  }

  // Delete Product

  deleteProduct(index: number) {
    this.productList.splice(index, 1);

    this.calcTotal();
  }

  // Calculate Total

  // Paid Amount Change

  paidAmountChange() {
    this.purchaseData.balance =
      this.purchaseData.totalAmount - this.purchaseData.paidAmount;
  }

  // Save

  savePurchaseReturn() {
    Swal.fire({
      title: 'Save Purchase Return?',

      icon: 'question',

      showCancelButton: true,

      confirmButtonText: 'Save',
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          gstType: this.purchaseData.gstType,

          partyType: this.purchaseData.partyType,

          returnNo: this.returnNo,

          hsnSac: this.purchaseData.hsnSac,

          supplierName: this.purchaseData.supplierName,

          mobileNo: this.purchaseData.mobileNo,

          gstin: this.purchaseData.gstin,

          invoiceNo: this.purchaseData.invoiceNo,

          totalAmount: this.purchaseData.totalAmount,

          paidAmount: this.purchaseData.paidAmount,

          balance: this.purchaseData.balance,

          items: this.productList,
        };

        console.log('SAVE PAYLOAD =>', payload);

        this.purchaseService.savePurchaseReturn(payload).subscribe({
          next: (res: any) => {
            this.toastr.success('Saved Successfully');

            Swal.fire('Success', 'Purchase Return Saved', 'success');
              this.resetForm();

          },
           

          error: (err: any) => {
            console.log(err);

            this.toastr.error('Save Failed');

            Swal.fire(
              'Error',
              err?.error?.message || 'Unable To Save',
              'error',
            );
          },
        });
      }
    });
  }

resetForm() {
  // Purchase data reset
  this.purchaseData = {
    gstType: '',
    partyType: '',
    hsnSac: '',
    returnNo: '',
    returnDate: '',
    taxType: '',
    stockPlace: '',
    supplierName: '',
    mobileNo: '',
    gstin: '',
    invoiceNo: '',
    totalAmount: 0,
    paidAmount: 0,
    balance: 0
  };

  // Table clear
  this.productList = [];

  // Return no reset
  this.returnNo = '';

  //  Payment section reset
  this.purchaseAmount = 0;
  this.purchasePaidAmount = 0;
  this.purchaseBalance = 0;

  //  Refund section reset
  this.refundTotalAmount = 0;
  this.receivedRefundAmount = 0;
  this.refundBalance = 0;
}

  saveToDatabase() {
    this.savePurchaseReturn();
  }

getPurchaseByInvoice() {
  if (!this.returnNo) return;

  this.purchaseService.getPurchaseByInvoice(this.returnNo).subscribe({
    next: (res: any) => {

      console.log('INVOICE RESPONSE:', res);

      const data = res?.data || res;

      //  MASTER DATA
      this.purchaseData = {
        ...this.purchaseData,
        supplierName: data.supplierName || '',
        mobileNo: data.mobileNo || '',
        gstin: data.gstin || '',
        invoiceNo: data.invoiceNo || '',
        totalAmount: data.totalAmount || 0,
        paidAmount: data.paidAmount || 0,
        balance: data.balance || 0,
      };

      //  PAYMENT DETAILS
      this.purchaseAmount = Number(data.totalAmount || 0);
      this.purchasePaidAmount = Number(data.paidAmount || 0);
      this.purchaseBalance = Number(data.balance || 0);

      // ITEMS
      this.productList = (data.items || []).map((item: any) => ({
        ...item,
        returnQty: 0,
        returnAmount: 0,
        returnGst: 0,
        returnTotal: 0,
        total: (item.amount || 0) + (item.gstAmount || 0),
      }));

      //  RESET REFUND
      this.refundTotalAmount = 0;
      this.receivedRefundAmount = 0;
      this.refundBalance = 0;

      this.calcTotal();
    },

    error: () => {
      alert('Invoice Not Found');
    }
  });
}

  getNextReturnNo() {
    this.purchaseService.getNextReturnNo().subscribe({
      next: (res: any) => {
        this.returnNo = res.returnNo;
      },

      error: (err: any) => {
        console.log(err);
      },
    });
  }

 searchPurchase() {
  if (!this.searchText) {
    this.toastr.warning('Enter Invoice No / Supplier Name / Mobile No');
    return;
  }

  this.purchaseService.getPurchase(this.searchText).subscribe({
    next: (res: any) => {

      this.productList = [];

      console.log('PURCHASE RESPONSE:', res);

      const data = res; //  IMPORTANT FIX

      //  PAYMENT FIX
      this.purchaseAmount = Number(data.totalAmount ?? 0);
      this.purchasePaidAmount = Number(data.paidAmount ?? 0);
      this.purchaseBalance = Number(data.balance ?? 0);

      console.log('PAYMENT CHECK:', {
        purchaseAmount: this.purchaseAmount,
        paid: this.purchasePaidAmount,
        balance: this.purchaseBalance,
      });

      //  MASTER DATA
      this.purchaseData = {
        ...this.purchaseData,
        gstType: data.gstType || '',
        partyType: data.partyType || '',
        hsnSac: data.hsnSac || '',
        supplierName: data.supplierName || '',
        mobileNo: data.mobileNo || '',
        gstin: data.gstin || '',
        invoiceNo: data.invoiceNo || '',
      };

      //  ITEMS
      this.productList = (data.items || []).map((item: any) => ({
        ...item,
        returnQty: 0,
        returnAmount: 0,
        returnGst: 0,
        returnTotal: 0,
        //  qty: Number(item.qty || 0)
        availableQty: Number(item.qty || 0) - Number(item.returnQty || 0),
        total: (item.amount || 0) + (item.gstAmount || 0),
      }));

      this.calcTotal();

      this.toastr.success('Purchase Loaded');
    },

    error: () => {
      this.productList = [];
      this.toastr.error('Purchase Not Found');
    },
  });
}
}

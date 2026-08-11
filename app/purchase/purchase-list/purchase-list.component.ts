import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PurchaseService } from 'src/app/core/services/purchase.service';
import { ProductService } from 'src/app/core/services/product.service';
import { StockUpdateService } from '../../core/services/stock-update.service';
import { SupplierService } from '../../core/services/supplier.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-purchase',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.css'],
})
export class PurchaseListComponent implements OnInit {
  editIndex = -1;
  editingId: string = '';
  isEditMode = false;
  showFilterSection: boolean = false;

  showPurchaseHistory: boolean = false;
  showPurchaseModal = false;
  purchaseHistory: any[] = [];
  filteredPurchaseList: any[] = [];

  fromDate: string = '';
  toDate: string = '';

  selectedPurchase: any = null;

  currentPage = 1;
  itemsPerPage = 10;

  paginatedPurchaseList: any[] = [];

  hsnSac: string = '';

  supplierAddress: string = '';

  showPaymentModal = false;

  currentDate = new Date();
  supplierName = '';
  supplierEmail = '';
  selectedSupplierId: string = '';
  selectedSupplier: any = null;
  filteredSuppliers: any[] = [];
  supplierSearching = false;
  private supplierSearchTimer: any;
  showAddSupplierModal = false;
  newSupplier: any = {
    supplierName: '',
    mobileNumber: '',
    address: '',
    gstNumber: '',
    email: '',
  };
  // Header Fields
  gstType: string = 'GST';
  partyType: string = 'Wholesale';
  stockPlace: string = '';

  customerName: string = '';
  mobileNo: string = '';
  gstin: string = '';

  invoiceNo: string = '';
  invoiceDate: string = '';

  // grnNo: string = '';
  // grnDate: string = '';

  // Product Form Object
  purchaseItem = {
    productName: '',
    size: '',
    unit: '',

    rate: 0,
    qty: 0,

    amount: 0,

    discountPercent: 0,
    discount: 0,

    gstPercent: 0,

    cgst: 0,
    sgst: 0,
    igst: 0,

    gstAmount: 0,

    netRate: 0,
    netAmount: 0,
  };

  // Table List
  purchaseList: any[] = [];

  totalAmount: number = 0;
  paidAmount: number = 0;
  balance: number = 0;

  paymentMethod = '';
  productList: any[] = [];


paymentEnabled = false;
searchText: string = '';
purchaseData: any = {};
returnNo: string = '';
returnDate: string = new Date().toISOString().split('T')[0];
  balanceAmount!: number;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private purchaseService: PurchaseService,
    private productService: ProductService,
    private stockUpdateService: StockUpdateService,
    private supplierService: SupplierService,
    private router: Router,
  ) {}

  activeProducts: any[] = [];
  selectedPurchaseProduct: any = null;
  selectedPurchaseProductId: string = '';



openPaymentModal(item: any) {
  this.selectedPurchase = item;
  this.showPaymentModal = true;

  //  SAFE MAP (MOST IMPORTANT FIX)
  this.productList = (item.items || []).map((x: any) => {
    const amount = Number(x.amount || (x.rate * x.qty) || 0);
    const gstAmount = Number(x.gstAmount || 0);

    return {
      ...x,
      amount,
      gstAmount,
      total: amount + gstAmount
    };
  });

  //  NOW TOTAL WILL WORK 100%
  this.totalAmount = this.productList.reduce(
    (sum, x) => sum + Number(x.total || 0),
    0
  );

  this.paidAmount = Number(item.paidAmount || 0);

  this.balance = this.totalAmount - this.paidAmount;

  this.supplierName = item.supplierName || '';
  this.mobileNo = item.mobileNo || '';
}

savePayment() {
  if (!this.paymentMethod) {
    this.toastr.error('Select Payment Method');
    return;
  }

  const payload = {
    paidAmount: this.paidAmount,
    balance: this.totalAmount - this.paidAmount,
    paymentMethod: this.paymentMethod
  };

  this.purchaseService
    .updatePayment(this.selectedPurchase._id, payload)
    .subscribe({
      next: (res: any) => {

        //  UPDATE UI ALSO
        this.selectedPurchase.paidAmount = this.paidAmount;
        this.selectedPurchase.balance = payload.balance;

        this.toastr.success('Payment Updated Successfully');
        this.showPaymentModal = false;

        // optional refresh
        this.searchPurchase();
      },
      error: (err) => {
        console.log(err);
        this.toastr.error('Payment Update Failed');
      }
    });
} 

  savePurchaseReturn() {
  console.log('Purchase Return Save Triggered');

  const payload = {
    items: this.productList,
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    balance: this.balance
  };

  // call API if needed
  console.log(payload);
}

searchPurchase() {
  if (!this.searchText) {
    this.toastr.warning('Enter search text');
    return;
  }

  this.purchaseService.getPurchase(this.searchText).subscribe({
    next: (res: any) => {

      this.productList = res.items || [];

      this.supplierName = res.supplierName || '';
      this.mobileNo = res.mobileNo || '';
      this.invoiceNo = res.invoiceNo || '';
      this.hsnSac = res.hsnSac || '';

      this.totalAmount = res.totalAmount || 0;
      this.paidAmount = res.paidAmount || 0;
      this.balance = res.balance || 0;

      this.paymentEnabled =
        this.productList.length > 0 &&
        !!this.supplierName &&
        !!this.mobileNo;
    }
  });
}



calcTotal() {
  this.totalAmount = this.productList.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  this.calcBalance();
}

calcBalance() {
  this.balanceAmount = this.totalAmount - this.paidAmount;
}

  closePaymentModal() {
    this.showPaymentModal = false;
  }

  viewPurchase(item: any) {
    this.selectedPurchase = item;

    this.showPurchaseModal = true;
  }

  closePurchaseModal() {
    this.showPurchaseModal = false;
  }

  ngOnInit(): void {
    // this.generateGRN();

    const today = new Date().toISOString().split('T')[0];

    // this.grnDate = today;
    this.fromDate = today;
    this.toDate = today;

    this.loadProducts();
    this.loadPurchaseHistory();
  }

  loadProducts() {
    this.productService.getActiveProducts().subscribe({
      next: (res: any) => { this.activeProducts = res.data; },
    });
  }

  // Auto GRN Generate
  // generateGRN() {
  //   this.purchaseService.getNextGrnNo().subscribe({
  //     next: (res: any) => {
  //       const now = new Date();

  //       const year = now.getFullYear().toString().slice(-2);

  //       const monthCodes = [
  //         'A',
  //         'B',
  //         'C',
  //         'D',
  //         'E',
  //         'F',
  //         'G',
  //         'H',
  //         'I',
  //         'J',
  //         'K',
  //         'L',
  //       ];

  //       const month = monthCodes[now.getMonth()];

  //       const day = String(now.getDate()).padStart(2, '0');

  //       const runningNo = String(res.nextNo).padStart(4, '0');

  //       this.grnNo = `IPMB${year}${month}${day}${runningNo}`;
  //     },
  //   });
  // }
  // Insert Product
  insertItem() {
    console.log('INSERT CLICKED');

    if (!this.gstType) {
      this.toastr.warning('Please Select GST Type');
      return;
    }

    if (!this.supplierName?.trim()) {
      this.toastr.warning('Please Enter Supplier Name');
      return;
    }

    if (!this.mobileNo?.toString().trim()) {
      this.toastr.warning('Please Enter Mobile Number');
      return;
    }

    if (!this.invoiceNo?.trim()) {
      this.toastr.warning('Please Enter Invoice Number');
      return;
    }

    if (!this.invoiceDate) {
      this.toastr.warning('Please Select Invoice Date');
      return;
    }
    // VALIDATION
    if (
      !this.purchaseItem.productName ||
      !this.purchaseItem.size ||
      this.purchaseItem.rate <= 0 ||
      this.purchaseItem.qty <= 0
    ) {
      this.toastr.warning('Please fill all product details', 'Validation');
      return;
    }

    // CREATE ITEM OBJECT

    const item: any = {
      productName: this.purchaseItem.productName.trim(),
      productSize: this.purchaseItem.size,
      unit: this.purchaseItem.unit,
      supplierName: this.supplierName,
      supplierAddress: this.supplierAddress,
      mobileNo: this.mobileNo,
      rate: Number(this.purchaseItem.rate),
      qty: Number(this.purchaseItem.qty),
      cgst: Number(this.purchaseItem.cgst || 0),
      sgst: Number(this.purchaseItem.sgst || 0),
      igst: Number(this.purchaseItem.igst || 0),

      discountPercent: Number(this.purchaseItem.discountPercent || 0),
    };

    // CALCULATIONS
    item.amount = item.rate * item.qty;

    item.discount = (item.amount * item.discountPercent) / 100;

    const afterDiscount = item.amount - item.discount;

    const totalGstPercent = item.cgst + item.sgst + item.igst;

    item.gstPercent = totalGstPercent;

    item.gstAmount = (afterDiscount * totalGstPercent) / 100;

    item.netAmount = afterDiscount + item.gstAmount;

    item.netRate = item.qty > 0 ? item.netAmount / item.qty : 0;

    // ADD TO TABLE
    if (this.editIndex > -1) {
      this.purchaseList[this.editIndex] = item;

      this.purchaseList = [...this.purchaseList];

      this.editIndex = -1;

      this.toastr.success('Item Updated Successfully');
    } else {
      this.purchaseList.push(item);

      this.purchaseList = [...this.purchaseList];
    }

    this.toastr.success('Product Added Successfully');

    console.log('ITEM ADDED:', item);
    console.log('PURCHASE LIST:', this.purchaseList);

    this.clearProductForm();
  }

  // Clear Product Form
  clearForm() {
    this.gstType = '';
    this.partyType = '';

    // this.grnNo = '';
    // this.grnDate = '';

    this.supplierName = '';
    this.supplierAddress = '';
    this.mobileNo = '';
    this.gstin = '';
    this.supplierEmail = '';
    this.selectedSupplierId = '';
    this.selectedSupplier = null;
    this.filteredSuppliers = [];

    this.invoiceNo = '';
    this.invoiceDate = '';
    this.clearProductForm();
  }

  onProductSelect() {
    const product = this.activeProducts.find(p => p._id === this.selectedPurchaseProductId);
    if (product) {
      this.selectedPurchaseProduct = product;
      this.purchaseItem.productName = product.productName;
      this.purchaseItem.size = product.productSize || '';
      this.purchaseItem.unit = product.unit || '';
      this.purchaseItem.rate = product.purchasePrice || 0;
      this.purchaseItem.gstPercent = product.gstPercent || 0;
      this.purchaseItem.cgst = (product.gstPercent || 0) / 2;
      this.purchaseItem.sgst = (product.gstPercent || 0) / 2;
    }
  }

  clearProductForm() {
    this.purchaseItem = {
      productName: '',
      size: '',
      unit: '',

      rate: 0,
      qty: 0,

      amount: 0,

      discountPercent: 0,
      discount: 0,

      gstPercent: 0,

      cgst: 0,
      sgst: 0,
      igst: 0,

      gstAmount: 0,

      netRate: 0,
      netAmount: 0,
    };
    this.selectedPurchaseProduct = null;
    this.selectedPurchaseProductId = '';
  }
getGrandTotal(): number {
  console.log(this.purchaseList);

  return this.purchaseList.reduce((sum, item) => {
    console.log(item.netAmount);
    return sum + Number(item.netAmount || 0);
  }, 0);
}

  savePurchase() {
    // VALIDATIONS
    if (!this.supplierName?.trim()) {
      this.toastr.warning('Please Enter Supplier Name');
      return;
    }

    if (!this.mobileNo?.toString().trim()) {
      this.toastr.warning('Please Enter Mobile Number');
      return;
    }

    if (!this.invoiceNo?.trim()) {
      this.toastr.warning('Please Enter Invoice Number');
      return;
    }

    if (!this.invoiceDate) {
      this.toastr.warning('Please Select Invoice Date');
      return;
    }

    if (!this.purchaseList || this.purchaseList.length === 0) {
      this.toastr.warning('Please Add At Least One Product');
      return;
    }

    Swal.fire({
      title: 'Save Purchase?',
      text: 'Do you want to save this purchase entry?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#198754',
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          gstType: this.gstType,
          partyType: this.partyType,

          hsnSac: this.hsnSac,

          supplierName: this.supplierName,
          supplierAddress: this.supplierAddress,
          mobileNo: this.mobileNo,
          gstin: this.gstin,
          supplierId: this.selectedSupplierId,
          supplierEmail: this.supplierEmail,
          invoiceNo: this.invoiceNo,
          invoiceDate: this.invoiceDate,
           totalAmount: this.getGrandTotal(),   //  Add
  paidAmount: this.paidAmount,         //  Add
  balance: this.getGrandTotal() - this.paidAmount,

          items: this.purchaseList,
        };

        console.log('PURCHASE PAYLOAD:', payload);

        this.purchaseService.savePurchase(payload).subscribe({
          next: (res: any) => {
            console.log('STEP 1: Save Success');
            console.log('API RESPONSE:', res);

            Swal.fire({
              icon: 'success',
              title: 'Saved Successfully',
              text: 'Purchase stored successfully',
            });
            this.loadPurchaseHistory();

            this.purchaseList = [];

            console.log('STEP 2: Before Trigger');

            this.stockUpdateService.triggerUpdate();

            console.log('STEP 3: After Trigger');

            this.clearForm();
          },

          error: (err) => {
            console.error('SAVE ERROR:', err);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to save purchase.',
            });
          },
        });
      }
    });
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which || event.keyCode;

    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  allowOnlyLetters(event: KeyboardEvent) {
    const regex = /^[a-zA-Z ]$/;

    if (!regex.test(event.key)) {
      event.preventDefault();
    }
  }

  // ===========================
  // SUPPLIER AUTO SUGGESTION
  // ===========================

  get showNoSupplier(): boolean {
    return (
      !this.supplierSearching &&
      this.filteredSuppliers.length === 0 &&
      (this.supplierName || '').trim().length >= 2
    );
  }

  onSupplierInput() {
    this.supplierName = (this.supplierName || '').replace(/[^a-zA-Z ]/g, '');

    const name = (this.supplierName || '').trim();

    if (
      this.selectedSupplier &&
      name.toLowerCase() !== (this.selectedSupplier.supplierName || '').toLowerCase()
    ) {
      this.selectedSupplier = null;
      this.selectedSupplierId = '';
      this.supplierEmail = '';
    }

    if (name.length < 2) {
      this.filteredSuppliers = [];
      this.supplierSearching = false;
      return;
    }

    clearTimeout(this.supplierSearchTimer);

    this.supplierSearchTimer = setTimeout(() => {
      this.searchSuppliers(name);
    }, 300);
  }

  searchSuppliers(name: string) {
    this.supplierSearching = true;

    this.supplierService.searchSuppliers(name).subscribe({
      next: (res: any) => {
        this.filteredSuppliers = res.data || [];
        this.supplierSearching = false;
      },
      error: () => {
        this.filteredSuppliers = [];
        this.supplierSearching = false;
      },
    });
  }

  onSupplierSelected(event: any) {
    const supplier = this.filteredSuppliers.find(
      (s) => s.supplierName === event.option.value,
    );

    if (supplier) {
      this.applySupplier(supplier);
    }
  }

  applySupplier(supplier: any) {
    this.selectedSupplier = supplier;
    this.selectedSupplierId = supplier._id || '';
    this.supplierName = supplier.supplierName || '';
    this.supplierAddress = supplier.address || '';
    this.mobileNo = supplier.mobileNumber || '';
    this.gstin = supplier.gstNumber || '';
    this.supplierEmail = supplier.email || '';
    this.filteredSuppliers = [];
  }

  clearSupplier() {
    this.selectedSupplier = null;
    this.selectedSupplierId = '';
    this.supplierName = '';
    this.supplierAddress = '';
    this.mobileNo = '';
    this.gstin = '';
    this.supplierEmail = '';
    this.filteredSuppliers = [];
  }

  openAddSupplierModal() {
    this.newSupplier = {
      supplierName: (this.supplierName || '').trim(),
      mobileNumber: this.mobileNo || '',
      address: this.supplierAddress || '',
      gstNumber: this.gstin || '',
      email: this.supplierEmail || '',
    };

    this.showAddSupplierModal = true;
  }

  closeAddSupplierModal() {
    this.showAddSupplierModal = false;
  }

  saveNewSupplier() {
    const name = (this.newSupplier.supplierName || '').trim();

    if (name.length < 3) {
      this.toastr.error('Supplier Name must be at least 3 characters');
      return;
    }

    if (
      this.newSupplier.mobileNumber &&
      !/^[6789]\d{9}$/.test(this.newSupplier.mobileNumber)
    ) {
      this.toastr.error('Enter a valid 10 digit mobile number');
      return;
    }

    this.supplierService.addSupplier(this.newSupplier).subscribe({
      next: (res: any) => {
        this.applySupplier(res.data);
        this.showAddSupplierModal = false;

        if (res.existing) {
          this.toastr.info('Supplier already exists - using existing record');
        } else {
          this.toastr.success('New Supplier Saved');
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to save supplier');
      },
    });
  }

  applyHistoryFilter() {
    if (!this.fromDate || !this.toDate) {
      this.filteredPurchaseList = [...this.purchaseHistory];
      this.showPurchaseHistory = true;
      return;
    }

    this.filteredPurchaseList = this.purchaseHistory.filter((item: any) => {
      if (!item.invoiceDate) return false;

      const invoiceDate = item.invoiceDate.substring(0, 10);

      return invoiceDate >= this.fromDate && invoiceDate <= this.toDate;
    });

    this.showPurchaseHistory = true;

    console.log('FILTER RESULT', this.filteredPurchaseList);

    this.currentPage = 1;

    this.updatePagination();
  }

  clearHistoryFilter() {
    this.fromDate = '';
    this.toDate = '';

    this.showFilterSection = false;
    this.showPurchaseHistory = false;

    this.filteredPurchaseList = [...this.purchaseHistory];
  }

  printPurchase(purchase: any) {
    this.selectedPurchase = purchase;

    setTimeout(() => {
      this.downloadPdf();
    }, 1000);
  }

  downloadPdf() {
    const data = document.getElementById('purchaseBill');

    if (!data) {
      return;
    }

    html2canvas(data, {
      scale: 2,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;

      const pageHeight = 295;

      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

        heightLeft -= pageHeight;
      }

      pdf.save(`Purchase_${this.selectedPurchase.grnNo}.pdf`);
    });
  }

  loadPurchaseHistory() {
    this.purchaseService.getAllPurchases().subscribe((res: any) => {
      console.log('API DATA', res);
      console.log('LENGTH', res.length);

      this.purchaseHistory = res;
      this.filteredPurchaseList = [...res];
      this.updatePagination();

      console.log('purchaseHistory', this.purchaseHistory);
    });
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;

    const end = start + this.itemsPerPage;

    this.paginatedPurchaseList = this.filteredPurchaseList.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPurchaseList.length / this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;

      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;

      this.updatePagination();
    }
  }

  deletePurchase(id: string) {
    if (!confirm('Are you sure you want to delete this purchase?')) {
      return;
    }

    this.purchaseService.deletePurchase(id).subscribe({
      next: () => {
        this.toastr.success('Purchase Deleted Successfully');

        this.loadPurchaseHistory();
      },

      error: (err) => {
        console.log(err);

        this.toastr.error('Delete Failed');
      },
    });
  }

  editPurchase(item: any) {
    this.isEditMode = true;

    this.editingId = item._id;

    this.gstType = item.gstType;
    this.partyType = item.partyType;

    this.hsnSac = item.hsnSac || '';

    // this.grnNo = item.grnNo;
    // this.grnDate = item.grnDate;

    this.supplierName = item.supplierName;
    this.supplierAddress = item.supplierAddress || '';
    this.mobileNo = item.mobileNo;
    this.gstin = item.gstin;
    this.supplierEmail = item.supplierEmail || '';
    this.selectedSupplierId = item.supplierId || '';
    this.selectedSupplier = item.supplierId
      ? { _id: item.supplierId, supplierName: item.supplierName || '' }
      : null;

    this.invoiceNo = item.invoiceNo;
    this.invoiceDate = item.invoiceDate;

    this.purchaseList = [...item.items];

    this.showPurchaseHistory = false;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  updatePurchase() {
    const payload = {
      gstType: this.gstType,
      partyType: this.partyType,

      hsnSac: this.hsnSac,

      supplierName: this.supplierName,
      supplierAddress: this.supplierAddress,
      mobileNo: this.mobileNo,

      gstin: this.gstin,

      supplierId: this.selectedSupplierId,
      supplierEmail: this.supplierEmail,

      invoiceNo: this.invoiceNo,
      invoiceDate: this.invoiceDate,

      items: this.purchaseList,
    };

    this.purchaseService.updatePurchase(this.editingId, payload).subscribe({
      next: () => {
        this.toastr.success('Purchase Updated Successfully');

        this.isEditMode = false;

        this.editingId = '';

        this.clearForm();

        this.loadPurchaseHistory();
      },

      error: () => {
        this.toastr.error('Update Failed');
      },
    });
  }
  editItem(index: number) {
    this.editIndex = index;

    this.purchaseItem = {
      ...this.purchaseList[index],
    };
  }

  removeItem(index: number) {
    this.purchaseList.splice(index, 1);
  }

  navigateToPurchaseReport() {
    const isAdmin = localStorage.getItem('role') === 'admin';
    this.router.navigate([isAdmin ? '/admin/purchase-report' : '/purchase-report']);
  }
}

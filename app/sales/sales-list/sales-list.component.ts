import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SalesService } from 'src/app/core/services/sales.service';
import { ProductService } from 'src/app/core/services/product.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { StockUpdateService } from '../../core/services/stock-update.service';
import { InvoiceService } from 'src/app/core/services/invoice.service';
import { CustomerService } from 'src/app/core/services/customer.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.css'],
})
export class SalesListComponent implements OnInit, OnDestroy {
  selectedDate: string = '';
  private clockInterval: any;

  get salesReportLink(): string {
    const role = localStorage.getItem('role');
    return role === 'admin' ? '/admin/sales-report' : '/sales-report';
  }

  showStockList = false;
  stockList: any[] = [];

  receivedAmount: number = 0;
  receiveAmount: number = 0;
  balanceAmount: number = 0;

  showPaymentPopup = false;
  selectedSale: any = {};

  isFilterMode = false;

  salesPerson: string = '';
  // amountInWords: string = '';

  salesCurrentPage = 1;
  salesItemsPerPage = 10;
  paginatedSalesList: any[] = [];

  customerAddress: string = '';
  state: string = '';

  openPaymentPopup(sale: any) {
    console.log('OPEN PAYMENT', sale);

    this.selectedSale = sale;

    this.receiveAmount = 0;

    this.showPaymentPopup = true;

    console.log('showPaymentPopup:', this.showPaymentPopup);
  }

  closePaymentPopup() {
    this.showPaymentPopup = false;

    this.receiveAmount = 0;
  }
  savePayment() {
    const paid = Number(this.receiveAmount || 0);

    const balance =
      this.selectedSale.balanceAmount - paid < 0
        ? 0
        : this.selectedSale.balanceAmount - paid;

    const payload = {
      saleId: this.selectedSale._id,
      paidAmount: paid,
      balanceAmount: balance,
      paymentStatus:
        this.selectedSale.balanceAmount - paid <= 0 ? 'Paid' : 'Partial',
    };

    this.http
      .put('http://localhost:5000/api/sales/receive-payment', payload)
      .subscribe({
        next: (res: any) => {
          this.toastr.success('Payment Saved');

          // update selected
          this.selectedSale.receivedAmount =
            (this.selectedSale.receivedAmount || 0) + paid;

          this.selectedSale.balanceAmount = balance;
          this.selectedSale.paymentStatus = payload.paymentStatus;

          // 🔥 IMPORTANT: update table list
          const index = this.paginatedSalesList.findIndex(
            (s) => s._id === this.selectedSale._id,
          );

          if (index !== -1) {
            this.paginatedSalesList[index] = { ...this.selectedSale };
          }

          this.updateSalesPagination();
          this.closePaymentPopup();
          this.receiveAmount = 0;
        },
        error: (err) => {
          this.toastr.error('Payment Failed');
        },
      });
  }

  getSalesByDate(date: string) {
    this.http
      .get<any[]>(`http://localhost:5000/api/sales?date=${date}`)
      .subscribe({
        next: (res) => {
          this.salesList = res;
        },
        error: (err) => console.log(err),
      });
  }

  openStockList() {
    this.showStockList = true;

    this.http.get('http://localhost:5000/api/get-opening-stock').subscribe({
      next: (res: any) => {
        console.log(res);

        this.stockList = res.data;
      },

      error: (err) => {
        console.log(err);
      },
    });
  }

  gstType = '';
  partyType = '';
  invoiceNo = '';

  onGstTypeChange() {
    if (this.gstType === 'GST') {
      this.partyType = 'Business';
      this.generateInvoice();
    } else if (this.gstType === 'Non GST') {
      this.partyType = 'Retailer';
      this.generateInvoice();
    } else {
      this.partyType = '';
      this.invoiceNo = '';
    }
  }

  customerName: string = '';
  customerPhone: string = '';
  customerGST: string = '';
  customerEmail: string = '';
  selectedCustomerId: string = '';
  selectedCustomer: any = null;
  filteredCustomers: any[] = [];
  customerSearching = false;
  private customerSearchTimer: any;
  showAddCustomerModal = false;
  newCustomer: any = {
    customerName: '',
    mobileNumber: '',
    address: '',
    gstNumber: '',
    email: '',
  };

  invoiceDate: string = new Date().toISOString().split('T')[0];

  stockPlace: string = 'IPMEGA-1';

  showPopup = false;

  productList: any[] = [];
  salesList: any[] = [];
  allSalesList: any[] = [];

  isEditMode = false;
  editingSaleId = '';

  fromDate = '';
  toDate = '';

  currentDate: Date = new Date();

  showFilter = false;

  currentDateTime: Date = new Date();

  salesData: any = {
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    customerName: '',
    mobileNo: '',
    gstin: '',
    gstType: '',
    partyType: '',
    subtotal: 0,
    gst: 0,
    totalAmount: 0,
    receivedAmount: 0,
    balanceAmount: 0,
  };

  companyName = 'IPMEGA ENTERPRISES';
  companyAddress = '3rd Street 72/24, Sengottai road Surandai';
  companyGST = '33ABVPI8552P1ZR';
  companyState = 'TAMIL NADU';
  companyPhone = '9976786607';
  companyEmail = 'ipmegasurandai@gmail.com';

  billNo = 'INV-1001';
  billDate: string = new Date().toISOString().split('T')[0];
  userName = 'ADMIN';

  customerState = 'TAMIL NADU';

  invoiceData: any = {
    customerName: '',
    mobileNo: '',
    gstin: '',
    invoiceNo: 'INV-001',
    items: [],
    subtotal: 0,
    gst: 0,
    totalAmount: 0,
  };

  popupData: any = {
    productName: '',
    productSize: '',
    unit: '',
    rate: 0,
    qty: 0,
    amount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    netAmount: 0,
  };

  activeProducts: any[] = [];
  selectedSalesProduct: any = null;
  selectedProductId: string = '';

  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private salesService: SalesService,
    private stockService: StockUpdateService,
    private toastr: ToastrService,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    private router: Router,
  ) {}

  getStockDetails() {
    this.http.get('http://localhost:5000/api/stock').subscribe((res: any) => {
      this.stockList = res;

      console.log(this.stockList);
    });
  }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.fromDate = today;
    this.toDate = today;

    this.loadProducts();
    this.generateInvoice();
    this.getSales();

    this.clockInterval = setInterval(() => {
      this.currentDateTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  loadProducts() {
    this.productService.getActiveProducts().subscribe({
      next: (res: any) => {
        this.activeProducts = res.data;
      },
    });
  }

  // ===========================
  // GET SALES
  // ===========================

  getSales() {
    this.salesService.getSales().subscribe({
      next: (res: any) => {
        this.allSalesList = res;
        this.salesList = [...res];

        this.salesCurrentPage = 1;
        this.updateSalesPagination();
      },

      error: (err: any) => {
        console.log(err);
      },
    });
  }

  resetSalesView() {
    this.isFilterMode = false;

    this.getSales();

    this.fromDate = '';
    this.toDate = '';
  }
  // ===========================
  // POPUP FUNCTIONS
  // ===========================

  openPopup() {
    if (!this.validateForm()) {
      return;
    }
    this.showPopup = true;
  }

  isPopupValid(): boolean {
    return (
      this.popupData.productName &&
      this.popupData.productSize &&
      this.popupData.rate > 0 &&
      this.popupData.qty > 0
    );
  }

  closePopup() {
    this.showPopup = false;
  }

  isZeroGst(size: string): boolean {
    const value = (size || '').trim().toLowerCase().replace(/\s+/g, '');
    return value === '26' || value === '26kg';
  }

  onProductSelect() {
    const product = this.activeProducts.find(
      (p) => p._id === this.selectedProductId,
    );
    if (product) {
      const isZero = this.isZeroGst(product.productSize);
      this.selectedSalesProduct = product;
      this.popupData.productName = product.productName;
      this.popupData.productSize = product.productSize || '';
      this.popupData.unit = product.unit || '';
      this.popupData.rate = product.sellingPrice || 0;
      this.popupData.cgst = isZero ? 0 : (product.gstPercent || 0) / 2;
      this.popupData.sgst = isZero ? 0 : (product.gstPercent || 0) / 2;
      this.popupData.igst = 0;
      this.calculatePopup();
    }
  }

  clearPopup() {
    this.popupData = {
      productName: '',
      productSize: '',
      unit: '',
      rate: 0,
      qty: 0,
      amount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      netAmount: 0,
    };
    this.selectedSalesProduct = null;
    this.selectedProductId = '';
  }

  // ===========================
  // CALCULATE PRODUCT
  // ===========================

  calculatePopup() {
    const amount = (this.popupData.rate || 0) * (this.popupData.qty || 0);
    this.popupData.amount = amount;
    this.popupData.netAmount = amount;
  }

  // ===========================
  // INSERT PRODUCT
  // ===========================
insertProduct() {
  if (!this.isPopupValid()) {
    this.toastr.warning('Please fill all required fields', 'Validation');
    return;
  }

  this.calculatePopup();

  const product = {
    productName: this.popupData.productName,
    productSize: this.popupData.productSize,
    unit: this.popupData.unit,

    rate: Number(this.popupData.rate),
    qty: Number(this.popupData.qty),
    amount: Number(this.popupData.amount),

    //  ADD THESE
    gstPercent: this.isZeroGst(this.popupData.productSize)
      ? 0
      : this.selectedSalesProduct?.gstPercent || 5,

    cgst: this.isZeroGst(this.popupData.productSize) ? 0 : Number(this.popupData.cgst),
    sgst: this.isZeroGst(this.popupData.productSize) ? 0 : Number(this.popupData.sgst),
    igst: this.isZeroGst(this.popupData.productSize) ? 0 : Number(this.popupData.igst),

    netAmount: Number(this.popupData.netAmount),
  };

  this.productList.push(product);

  console.log(product); // Check gstPercent here

  this.closePopup();
  this.clearPopup();
}

  // ===========================
  calculateInvoice() {
    let subtotal = 0;
    let totalGst = 0;

    this.productList.forEach((p: any) => {
      const price = Number(p.rate || 0);
      const qty = Number(p.qty || 1);

      const totalPrice = price * qty;

      subtotal += totalPrice;

      // 26 KG → NO GST
      if (this.isZeroGst(p.productSize)) {
        p.gstPercent = 0;
        p.taxableRate = price;
        p.cgst = 0;
        p.sgst = 0;
        p.igst = 0;
        p.netAmount = totalPrice;

        return;
      }

      // GST Included (defaults to 5% for 5 KG / 10 KG)
      const gstRate = (Number(p.gstPercent) || 5) / 100;

      const taxableRate = price / (1 + gstRate);
      const gstAmount = price - taxableRate;

      totalGst += gstAmount * qty;

      p.gstPercent = Number(p.gstPercent) || 5;
      p.taxableRate = taxableRate;

      p.cgst = gstAmount / 2;
      p.sgst = gstAmount / 2;
      p.igst = 0;

      p.netAmount = totalPrice;
    });

    this.invoiceData.subtotal = subtotal;
    this.invoiceData.gst = totalGst;

    // customer paid amount already GST included
    this.invoiceData.totalAmount = subtotal;

    this.balanceAmount =
      this.invoiceData.totalAmount - (this.receivedAmount || 0);

    if (this.balanceAmount < 0) {
      this.balanceAmount = 0;
    }
  }
  calculateBalance() {
    this.calculateInvoice();

    this.balanceAmount =
      this.invoiceData.totalAmount - (this.receivedAmount || 0);

    console.log('PRODUCT', this.productList);
    console.log('SALES', this.salesList);
  }

  // =======================================================================
  generateInvoice() {
    console.log('Party Type:', this.partyType);

    if (!this.partyType) {
      return;
    }

    this.http
      .get(
        `http://localhost:5000/api/sales/generate-invoice?partyType=${this.partyType}`,
      )
      .subscribe({
        next: (res: any) => {
          this.invoiceNo = res.invoiceNo;
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  items: any[] = [];
  totalAmount: number = 0;
  subTotal: number = 0;

  resetForm() {
    this.gstType = '';
    this.partyType = '';
    this.invoiceNo = '';
    // this.invoiceDate = '';
    this.stockPlace = '';
    this.customerName = '';
    this.customerPhone = '';
    this.customerGST = '';
    this.customerEmail = '';
    this.selectedCustomerId = '';
    this.selectedCustomer = null;
    this.filteredCustomers = [];

    this.items = [];
    this.totalAmount = 0;
    this.subTotal = 0;
    this.salesPerson = '';
  }

  clearAfterSave() {
    // input fields clear
    this.gstType = '';
    this.partyType = '';
    this.invoiceNo = '';
    this.invoiceDate = '';
    this.stockPlace = '';
    this.customerName = '';
    this.customerPhone = '';
    this.customerGST = '';
    this.customerEmail = '';
    this.selectedCustomerId = '';
    this.selectedCustomer = null;
    this.filteredCustomers = [];

    // table clear
    this.items = [];

    // totals clear (if any)
    this.totalAmount = 0;
    this.subTotal = 0;
  }

  // SAVE INVOICE
  saveInvoice() {
    if (!this.validateForm()) return;

    this.calculateInvoice();

    const payload = {
      gstType: this.gstType,
      partyType: this.partyType,

      invoiceNo: this.invoiceNo,
      invoiceDate: this.invoiceDate,

      customerName: this.customerName,
      customerAddress: this.customerAddress,
      state: this.state,
      mobileNo: this.customerPhone,
      gstin: this.customerGST,
      customerId: this.selectedCustomerId,
      customerEmail: this.customerEmail,

      salesPerson: this.salesPerson,

      subtotal: this.invoiceData.subtotal,
      gst: this.invoiceData.gst,
      totalAmount: this.invoiceData.totalAmount,

      receivedAmount: this.receivedAmount,
      balanceAmount: this.balanceAmount,

      items: this.productList.map((item) => {
        if (this.isZeroGst(item.productSize)) {
          return {
            ...item,
            cgst: 0,
            sgst: 0,
            igst: 0,
            netAmount: item.amount,
          };
        }

        return item;
      }),
    };

    const wasEditMode = this.isEditMode;

    const onSuccess = () => {
      this.resetForm();
      this.productList = [];
      this.isEditMode = false;
      this.editingSaleId = '';
      this.getSales();
      this.stockService.triggerUpdate();
      if (!wasEditMode) {
        this.generateInvoice();
      }
    };

    if (this.isEditMode && this.editingSaleId) {
      this.salesService.updateSales(this.editingSaleId, payload).subscribe({
        next: (res: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: 'Sale Updated Successfully',
            timer: 2000,
            showConfirmButton: false,
          });
          onSuccess();
        },
        error: (err: any) => {
          if (
            err.error?.message?.toLowerCase().includes('insufficient stock')
          ) {
            Swal.fire({
              icon: 'error',
              title: 'Stock Not Available',
              text: err.error.message || 'Not enough stock available',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: err.error?.message || 'Update failed',
            });
          }
        },
      });
    } else {
      this.salesService.addSales(payload).subscribe({
        next: (res: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Sales Saved Successfully',
            timer: 2000,
            showConfirmButton: false,
          });
          onSuccess();
          this.generateInvoice();
        },
        error: (err: any) => {
          if (
            err.error?.message?.toLowerCase().includes('insufficient stock')
          ) {
            Swal.fire({
              icon: 'error',
              title: 'Stock Not Available',
              text: err.error.message || 'Not enough stock available',
            });
          } else if (
            err.error?.message?.toLowerCase().includes('product not found')
          ) {
            Swal.fire({
              icon: 'error',
              title: 'Product Not Found',
              text: err.error.message,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: err.error?.message || 'Something went wrong',
            });
          }
        },
      });
    }
  }

  validateCustomerName() {
    this.customerName = (this.customerName || '').replace(/[^a-zA-Z ]/g, '');

    if (this.customerName && this.customerName.length < 3) {
      this.toastr.warning('Minimum 3 characters required');
    }
  }

  // ===========================
  // CUSTOMER AUTO SUGGESTION
  // ===========================

  get showNoCustomer(): boolean {
    return (
      !this.customerSearching &&
      this.filteredCustomers.length === 0 &&
      (this.customerName || '').trim().length >= 2
    );
  }

  onCustomerInput() {
    this.customerName = (this.customerName || '').replace(/[^a-zA-Z ]/g, '');

    const name = (this.customerName || '').trim();

    if (this.selectedCustomer && name.toLowerCase() !== (this.selectedCustomer.customerName || '').toLowerCase()) {
      this.selectedCustomer = null;
      this.selectedCustomerId = '';
      this.customerEmail = '';
    }

    if (name.length < 2) {
      this.filteredCustomers = [];
      this.customerSearching = false;
      return;
    }

    clearTimeout(this.customerSearchTimer);

    this.customerSearchTimer = setTimeout(() => {
      this.searchCustomers(name);
    }, 300);
  }

  searchCustomers(name: string) {
    this.customerSearching = true;

    this.customerService.searchCustomers(name).subscribe({
      next: (res: any) => {
        this.filteredCustomers = res.data || [];
        this.customerSearching = false;
      },
      error: () => {
        this.filteredCustomers = [];
        this.customerSearching = false;
      },
    });
  }

  onCustomerSelected(event: any) {
    const customer = this.filteredCustomers.find(
      (c) => c.customerName === event.option.value,
    );

    if (customer) {
      this.applyCustomer(customer);
    }
  }

  applyCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.selectedCustomerId = customer._id || '';
    this.customerName = customer.customerName || '';
    this.customerAddress = customer.address || '';
    this.customerPhone = customer.mobileNumber || '';
    this.customerGST = customer.gstNumber || '';
    this.customerEmail = customer.email || '';
    this.filteredCustomers = [];
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.selectedCustomerId = '';
    this.customerName = '';
    this.customerEmail = '';
    this.filteredCustomers = [];
  }

  openAddCustomerModal() {
    this.newCustomer = {
      customerName: (this.customerName || '').trim(),
      mobileNumber: this.customerPhone || '',
      address: this.customerAddress || '',
      gstNumber: this.customerGST || '',
      email: this.customerEmail || '',
    };

    this.showAddCustomerModal = true;
  }

  closeAddCustomerModal() {
    this.showAddCustomerModal = false;
  }

  saveNewCustomer() {
    const name = (this.newCustomer.customerName || '').trim();

    if (name.length < 3) {
      this.toastr.error('Customer Name must be at least 3 characters');
      return;
    }

    if (
      this.newCustomer.mobileNumber &&
      !/^[6789]\d{9}$/.test(this.newCustomer.mobileNumber)
    ) {
      this.toastr.error('Enter a valid 10 digit mobile number');
      return;
    }

    this.customerService.addCustomer(this.newCustomer).subscribe({
      next: (res: any) => {
        this.applyCustomer(res.data);
        this.showAddCustomerModal = false;

        if (res.existing) {
          this.toastr.info('Customer already exists - using existing record');
        } else {
          this.toastr.success('New Customer Saved');
        }
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to save customer');
      },
    });
  }

  validateMobileNumber() {
    this.customerPhone = (this.customerPhone || '').replace(/\D/g, '');

    if (this.customerPhone.length > 10) {
      this.customerPhone = this.customerPhone.substring(0, 10);
    }

    if (this.customerPhone && !/^[6789]/.test(this.customerPhone)) {
      this.toastr.warning('Must start with 6,7,8,9');
    }
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which || event.keyCode;

    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  validateForm(): boolean {
    if (!this.gstType) {
      this.toastr.error('Please Select GST Type');
      return false;
    }

    if (!this.invoiceDate) {
      this.toastr.error('Please Select Invoice Date');
      return false;
    }

    if (!this.customerName || this.customerName.trim().length < 3) {
      this.toastr.error('Customer Name must be at least 3 characters');
      return false;
    }

    if (!/^[A-Za-z ]+$/.test(this.customerName)) {
      this.toastr.error('Customer Name should contain only letters');
      return false;
    }

    if (!this.customerAddress || this.customerAddress.trim().length < 3) {
      this.toastr.error('Customer Address is required');
      return false;
    }

    if (!this.state || this.state.trim().length === 0) {
      this.toastr.error('Please Select State');
      return false;
    }

    if (!/^[6789]\d{9}$/.test(this.customerPhone)) {
      this.toastr.error('Enter valid 10 digit mobile number');
      return false;
    }

    return true;
  }

  // ===========================
  // DELETE ITEM
  // ===========================

  deleteItem(saleIndex: number, itemIndex: number) {
    this.salesList[saleIndex].items.splice(itemIndex, 1);
  }

  // ===========================
  // EDIT ITEM
  // ===========================

  editItem(saleIndex: number, itemIndex: number) {
    const selectedItem = this.salesList[saleIndex].items[itemIndex];

    console.log(selectedItem);

    this.popupData = { ...selectedItem };

    if (this.isZeroGst(this.popupData.productSize)) {
      this.popupData.cgst = 0;
      this.popupData.sgst = 0;
      this.popupData.igst = 0;
    }

    this.showPopup = true;
  }

  // ===========================
  // EDIT SALE (LOAD INTO FORM)
  // ===========================

  editSale(sale: any) {
    this.isEditMode = true;
    this.editingSaleId = sale._id;

    this.gstType = sale.gstType || '';
    this.partyType = sale.partyType || '';
    this.invoiceNo = sale.invoiceNo || '';
    this.invoiceDate = sale.invoiceDate
      ? sale.invoiceDate.substring(0, 10)
      : '';
    this.customerName = sale.customerName || '';
    this.customerPhone = sale.mobileNo || '';
    this.customerGST = sale.gstin || '';
    this.customerEmail = sale.customerEmail || '';
    this.selectedCustomerId = sale.customerId || '';
    this.selectedCustomer = sale.customerId ? { _id: sale.customerId, customerName: sale.customerName || '' } : null;
    this.state = sale.state || '';
    this.salesPerson = sale.salesPerson || '';
    this.receivedAmount = sale.receivedAmount || 0;
    this.balanceAmount = sale.balanceAmount || 0;

    this.productList = [...(sale.items || [])];
    this.calculateInvoice();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingSaleId = '';
    this.resetForm();
    this.productList = [];
    this.generateInvoice();
  }

  // ===========================
  // FILTER SALES
  filterSales() {
    if (!this.fromDate || !this.toDate) {
      this.toastr.warning('Please select both From and To dates');
      return;
    }

    this.salesService.getSalesByDate(this.fromDate, this.toDate).subscribe({
      next: (res: any) => {
        this.salesList = res;
        this.isFilterMode = true;
        this.salesCurrentPage = 1;
        this.updateSalesPagination();
      },
      error: (err: any) => {
        console.log(err);
        this.toastr.error('Failed to filter sales');
      },
    });
  }
  // ===========================

  // SAVE SALE

  // ===========================
  // PRINT BILL
  // ===========================
  selectedInvoice: any = null;

  printHistoryBill(sale: any) {
    console.log('History Sale:', sale);

    this.selectedInvoice = sale;

    setTimeout(() => {
      this.downloadPdf(sale);
    }, 1500);
  }

  printBill() {
    this.companyState = this.state;
    //  this.amountInWords = this.convertNumberToWords(this.getTotalAmount());
    const printContents = document.getElementById('print-section')?.outerHTML;

    const popupWindow = window.open('', '_blank', 'width=1000,height=900');

    popupWindow?.document.write(`
<html>
<head>
<title>Invoice Preview</title>

<style>

@page {
  size: A5 portrait;
  margin: 0;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 148mm;
  height: 210mm;
  font-family: Arial, sans-serif;
}

.invoice-container {
  width: 148mm !important;
  min-height: 210mm !important;
  padding: 5mm !important;
  box-sizing: border-box !important;
  transform: scale(2);
  transform-origin: top left;
}

body {
  background: red !important;
}

@media print {
  #print-section {
    width: 100%;
    min-height: auto;
    padding: 5mm;
    box-sizing: border-box;
  }
}

</style>

</head>
<body>

${printContents}

</body>
</html>
`);

    popupWindow?.document.close();

    // Temporary-a comment pannunga

    setTimeout(() => {
      popupWindow?.print();
      popupWindow?.close();
    }, 10000);
  }

  // ===========================
  // DOWNLOAD PDF

  // ===========================
  downloadPdf(sale: any) {
    this.selectedInvoice = sale;

    console.log('Selected Invoice:', sale.invoiceNo);

    const data = document.getElementById('pdf-container');

    if (!data) {
      this.toastr.error('Print Section Not Found', 'Error');
      return;
    }

    data.style.display = 'block';
    data.style.visibility = 'visible';
    data.style.position = 'absolute';
    data.style.left = '0';
    data.style.top = '0';

    html2canvas(data, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    }).then((canvas) => {
      console.log('Canvas Width:', canvas.width);
      console.log('Canvas Height:', canvas.height);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pageWidth = 148;
      const pageHeight = 210;

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const printWindow = window.open(pdfUrl);

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }

      data.style.display = 'none';
    });
  }

  getRemainingBalance(): number {
    const balance =
      Number(this.selectedSale.balanceAmount || 0) -
      Number(this.receiveAmount || 0);

    return balance < 0 ? 0 : balance;
  }

  updateSalesPagination() {
    const start = (this.salesCurrentPage - 1) * this.salesItemsPerPage;

    const end = start + this.salesItemsPerPage;

    this.paginatedSalesList = this.salesList.slice(start, end);
  }

  get salesTotalPages(): number {
    return Math.ceil(this.salesList.length / this.salesItemsPerPage);
  }

  nextSalesPage() {
    if (this.salesCurrentPage < this.salesTotalPages) {
      this.salesCurrentPage++;

      this.updateSalesPagination();
    }
  }

  previousSalesPage() {
    if (this.salesCurrentPage > 1) {
      this.salesCurrentPage--;

      this.updateSalesPagination();
    }
  }
}

// ----------------------------

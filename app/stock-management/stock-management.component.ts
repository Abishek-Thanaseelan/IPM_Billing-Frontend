import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OpeningStockService } from '../../app/core/services/opening-stock.service';
import { StockUpdateService } from '.././core/services/stock-update.service';
import { ProductService } from '../core/services/product.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stock-management',
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css'],
})
export class StockManagementComponent implements OnInit, OnDestroy {
  private stockSub!: Subscription;

  isEditMode = false;
  editId = '';
  stockPlace = '';
  stockDate = '';
  selectedProductId = '';
  productName = '';
  productSize = '';
  qty = 0;
  activeProducts: any[] = [];
  sizeList = ['26 KG', '10 KG', '5 KG'];
  stockList: any[] = [];
  todayDate = new Date().toLocaleDateString('en-GB');

  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private stockService: StockUpdateService,
    private openingStockService: OpeningStockService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.stockDate = new Date().toISOString().split('T')[0];
    this.loadProducts();
    this.loadStock();
    this.stockSub = this.stockService.stockUpdated$.subscribe(() => {
      this.loadStock();
    });
  }

  ngOnDestroy(): void {
    if (this.stockSub) {
      this.stockSub.unsubscribe();
    }
  }

  loadProducts() {
    this.productService.getActiveProducts().subscribe({
      next: (res: any) => {
        this.activeProducts = res.data || [];
      }
    });
  }

  onProductSelect() {
    const product = this.activeProducts.find(p => p._id === this.selectedProductId);
    if (product) {
      this.productName = product.productName;
      this.productSize = product.productSize || '';
    }
  }

insertStock() {
  const payload = {
    productName: this.productName,
    productSize: this.productSize,
    qty: this.qty,
    stockDate: this.stockDate,
  };

  this.openingStockService.addStock(payload).subscribe((res: any) => {

    this.toastr.success('Stock Added Successfully');
    this.stockService.triggerUpdate();
    this.clearForm();
    this.loadStock();
  });
}

  loadStock() {
    this.http
      .get('http://localhost:5000/api/stock-daily')
      .subscribe((res: any) => {
        this.stockList = res.data || [];

        const sizeOrder: any = {
          '5 KG': 1,
          '10 KG': 2,
          '26 KG': 3,
        };

        this.stockList.sort((a: any, b: any) => {
          const productCompare = a.productName.localeCompare(b.productName);
          if (productCompare !== 0) {
            return productCompare;
          }
          return (sizeOrder[a.productSize] || 0) - (sizeOrder[b.productSize] || 0);
        });
      });
  }

  clearForm() {
    this.selectedProductId = '';
    this.productName = '';
    this.productSize = '';
    this.qty = 0;
    this.stockDate = new Date().toISOString().split('T')[0];
  }

editStock(item: any) {
  this.isEditMode = true;
  this.editId = item._id;
  this.productName = item.productName;
  this.productSize = item.productSize;
  this.qty = item.openingStock;
  this.stockDate = new Date().toISOString().split('T')[0];
}

updateStock() {
  if (!this.editId) {
    this.toastr.warning('No stock record to update');
    return;
  }

  const payload = {
    productName: this.productName,
    productSize: this.productSize,
    qty: this.qty,
    stockDate: this.stockDate,
  };

  this.http.put(
    `http://localhost:5000/api/update-opening-stock/${this.editId}`,
    payload
  ).subscribe((res: any) => {
    this.toastr.success('Updated Successfully');
    this.loadStock();
    this.clearForm();
    this.isEditMode = false;
  });
}

deleteStock(item: any) {
  if (!item._id) {
    this.toastr.warning('No stock record to delete');
    return;
  }
  if(confirm('Delete opening stock for this product?')) {
    this.http.delete(
      `http://localhost:5000/api/delete-opening-stock/${item._id}`
    ).subscribe((res: any) => {
      this.toastr.success('Deleted Successfully');
      this.loadStock();
    });
  }
}

navigateToStockReport() {
  const isAdmin = localStorage.getItem('role') === 'admin';
  this.router.navigate([isAdmin ? '/admin/stock-report' : '/stock-report']);
}
}

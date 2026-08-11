import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  products: any[] = [];
  loading = true;
  showForm = false;
  editMode = false;
  selectedId = '';

  formData = {
    productName: '',
    category: '',
    productSize: '',
    unit: 'KG',
    purchasePrice: 0,
    sellingPrice: 0,
    gstPercent: 5,
    description: '',
    status: 'Active'
  };

  constructor(
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit() { this.loadProducts(); }

  isZeroGstSize(size: any): boolean {
    if (size === null || size === undefined) return false;
    const value = String(size).trim().toLowerCase().replace(/\s+/g, '');
    return value === '26' || value === '26kg';
  }

  onSizeChange() {
    const size = String(this.formData.productSize || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');

    if (size === '26' || size === '26kg') {
      this.formData.gstPercent = 0;
    } else if (size === '5' || size === '5kg' || size === '10' || size === '10kg') {
      this.formData.gstPercent = 5;
    }
  }

  loadProducts() {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (res: any) => { this.products = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openAdd() {
    this.editMode = false;
    this.selectedId = '';
    this.formData = { productName: '', category: '', productSize: '', unit: 'KG', purchasePrice: 0, sellingPrice: 0, gstPercent: 5, description: '', status: 'Active' };
    this.showForm = true;
  }

  openEdit(p: any) {
    this.editMode = true;
    this.selectedId = p._id;
    this.formData = { ...p };
    this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  save() {
    if (!this.formData.productName) {
      this.toastr.warning('Product name is required');
      return;
    }
    if (this.editMode) {
      this.productService.updateProduct(this.selectedId, this.formData).subscribe({
        next: () => { this.toastr.success('Product updated'); this.closeForm(); this.loadProducts(); },
        error: (err) => { this.toastr.error(err.error?.message || 'Update failed'); }
      });
    } else {
      this.productService.addProduct(this.formData).subscribe({
        next: () => { this.toastr.success('Product added'); this.closeForm(); this.loadProducts(); },
        error: (err) => { this.toastr.error(err.error?.message || 'Add failed'); }
      });
    }
  }

  deleteProduct(id: string) {
    if (confirm('Delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => { this.toastr.success('Product deleted'); this.loadProducts(); },
        error: (err) => { this.toastr.error(err.error?.message || 'Delete failed'); }
      });
    }
  }
}

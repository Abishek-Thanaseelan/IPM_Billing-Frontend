
import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-add-purchase',
  templateUrl: './add-purchase.component.html',
  styleUrls: ['./add-purchase.component.css']
})
export class AddPurchaseComponent implements OnInit {

  activeProducts: any[] = [];
  selectedProduct: any = null;
  selectedProductId: string = '';

  // Form Object
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
    gstAmount: 0,
    netRate: 0,
    netAmount: 0
  };

  // Table List
  purchaseList: any[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getActiveProducts().subscribe({
      next: (res: any) => { this.activeProducts = res.data; },
    });
  }

  onProductSelect() {
    const product = this.activeProducts.find(p => p._id === this.selectedProductId);
    if (product) {
      this.selectedProduct = product;
      this.purchaseItem.productName = product.productName;
      this.purchaseItem.size = product.productSize || '';
      this.purchaseItem.unit = product.unit || '';
      this.purchaseItem.rate = product.purchasePrice || 0;
      this.purchaseItem.gstPercent = product.gstPercent || 0;
    }
  }

  // Insert Row
  insertItem() {

    this.purchaseItem.amount =
      this.purchaseItem.rate * this.purchaseItem.qty;

    this.purchaseItem.discount =
      (this.purchaseItem.amount *
        this.purchaseItem.discountPercent) / 100;

    const afterDiscount =
      this.purchaseItem.amount - this.purchaseItem.discount;

    this.purchaseItem.gstAmount =
      (afterDiscount * this.purchaseItem.gstPercent) / 100;

    this.purchaseItem.netAmount =
      afterDiscount + this.purchaseItem.gstAmount;

    this.purchaseItem.netRate =
      this.purchaseItem.netAmount / this.purchaseItem.qty;

    this.purchaseList.push({
      ...this.purchaseItem
    });

    this.clearForm();

  }

  // Clear Form
  clearForm() {

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
      gstAmount: 0,
      netRate: 0,
      netAmount: 0
    };
    this.selectedProduct = null;
    this.selectedProductId = '';

  }

}


import { Component, OnInit, OnDestroy } from '@angular/core';

import { SalesService } from 'src/app/core/services/sales.service';

import { HttpClient } from '@angular/common/http';

import { StockUpdateService } from '../../core/services/stock-update.service';

import { Subscription } from 'rxjs';

import { ChangeDetectorRef } from '@angular/core';

import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',

  templateUrl: './dashboard.component.html',

  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private stockSub!: Subscription;

  totalPurchase = 0;

  totalStock = 0;

  totalExpense = 0;

  totalSalesAmount = 0;

  totalPurchaseAmount = 0;

  // LIVE STOCK

  stockItems: any[] = [];

  dashboardData: Object | undefined;

  constructor(
    private http: HttpClient,
    private salesService: SalesService,
    private stockUpdateService: StockUpdateService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {
    console.log('DASHBOARD LOADED');
  }

  // =========================
  // INIT
  // =========================
  ngOnInit() {
    console.log('SUBSCRIBE START');

    this.stockSub = this.stockUpdateService.stockUpdated$
      .pipe(debounceTime(100))
      .subscribe(() => {
        console.log('REFRESH STOCK');

        this.loadStock();
        this.loadTotalSales();
        this.loadTotalPurchase();
      });

    this.loadStock();
    this.loadTotalSales();
    this.loadTotalPurchase();
  }

  ngOnDestroy() {
    if (this.stockSub) {
      this.stockSub.unsubscribe();
    }
  }

  loadStock() {
    this.http.get('http://localhost:5000/api/dashboard-stock').subscribe({
      next: (res: any) => {
        console.log('STOCK API RESPONSE:', res);
        console.log('STOCK DATA:', res.data);

        this.stockItems = res.data;
      },
    });
  }
  // =========================
  // TOTAL SALES
  // =========================

  loadTotalSales() {
    this.salesService
      .getSales()

      .subscribe({
        next: (res: any) => {
          let total = 0;

          res.forEach((sale: any) => {
            total += Number(sale.totalAmount || 0);
          });

          this.totalSalesAmount = total;

          console.log('TOTAL SALES:', this.totalSalesAmount);
        },

        error: (err: any) => {
          console.log(err);
        },
      });
  }

loadTotalPurchase() {
  this.http
    .get('http://localhost:5000/api/dashboard-purchase-total')
    .subscribe({
      next: (res: any) => {
        console.log('PURCHASE API RESPONSE:', res);

        this.totalPurchaseAmount = res.totalPurchaseAmount || 0;

        console.log('TOTAL PURCHASE:', this.totalPurchaseAmount);
      }
    });
}

}

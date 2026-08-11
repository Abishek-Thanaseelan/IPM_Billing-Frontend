import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';
import { StockUpdateService } from '../../core/services/stock-update.service';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: any = {};
  profit: any = {};
  loading = true;
  private stockSub!: Subscription;

  constructor(
    private adminService: AdminService,
    private stockUpdateService: StockUpdateService
  ) {}

  ngOnInit() {
    this.loadData();
    this.stockSub = this.stockUpdateService.stockUpdated$
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.loadData();
      });
  }

  ngOnDestroy() {
    if (this.stockSub) {
      this.stockSub.unsubscribe();
    }
  }

  loadData() {
    this.loading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (res: any) => { this.stats = res.data; },
      error: () => {}
    });
    this.adminService.getProfit().subscribe({
      next: (res: any) => { this.profit = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ReportsService } from '../../core/services/reports.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dailyChart') dailyChartRef!: ElementRef;
  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef;
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef;

  daily: any = null;
  weekly: any = null;
  monthly: any = null;

  loading = { daily: true, weekly: true, monthly: true };
  error = { daily: false, weekly: false, monthly: false };

  // FILTER STATE
  fromDate = '';
  toDate = '';
  filterApplied = false;
  filterLoading = false;
  filterError = '';
  filteredData: any = null;

  private charts: Chart[] = [];
  private refreshTimer: any;

  constructor(private reportsService: ReportsService) {}

  ngOnInit() {
    this.loadAll();
    this.refreshTimer = setInterval(() => {
      if (!this.filterApplied) this.loadAll();
    }, 60000);
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.destroyCharts();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadAll() {
    this.loadDaily();
    this.loadWeekly();
    this.loadMonthly();
  }

  loadDaily() {
    this.loading.daily = true;
    this.error.daily = false;
    this.reportsService.getDailySales().subscribe({
      next: (res: any) => {
        this.daily = res;
        this.loading.daily = false;
        this.scheduleDailyChart();
      },
      error: () => {
        this.loading.daily = false;
        this.error.daily = true;
      },
    });
  }

  loadWeekly() {
    this.loading.weekly = true;
    this.error.weekly = false;
    this.reportsService.getWeeklySales().subscribe({
      next: (res: any) => {
        this.weekly = res;
        this.loading.weekly = false;
        this.scheduleWeeklyChart();
      },
      error: () => {
        this.loading.weekly = false;
        this.error.weekly = true;
      },
    });
  }

  loadMonthly() {
    this.loading.monthly = true;
    this.error.monthly = false;
    this.reportsService.getMonthlySales().subscribe({
      next: (res: any) => {
        this.monthly = res;
        this.loading.monthly = false;
        this.scheduleMonthlyChart();
      },
      error: () => {
        this.loading.monthly = false;
        this.error.monthly = true;
      },
    });
  }

  // ================= FILTER =================

  applyFilter() {
    this.filterError = '';

    if (!this.fromDate || !this.toDate) {
      this.filterError = 'Please select both From Date and To Date.';
      return;
    }

    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);

    if (from > to) {
      this.filterError = 'From Date cannot be greater than To Date.';
      return;
    }

    this.filterLoading = true;
    this.filterApplied = false;

    this.reportsService.getFilteredSales(this.fromDate, this.toDate).subscribe({
      next: (res: any) => {
        this.filteredData = res;
        this.filterLoading = false;
        this.filterApplied = true;
        this.scheduleFilteredCharts();
      },
      error: () => {
        this.filterLoading = false;
        this.filterError = 'Failed to fetch filtered data. Please try again.';
      },
    });
  }

  resetFilter() {
    this.fromDate = '';
    this.toDate = '';
    this.filterApplied = false;
    this.filterError = '';
    this.filteredData = null;
    this.loadAll();
  }

  // ================= CHART RENDERING =================

  private scheduleDailyChart() {
    setTimeout(() => this.renderDailyChart(), 100);
  }

  private scheduleWeeklyChart() {
    setTimeout(() => this.renderWeeklyChart(), 100);
  }

  private scheduleMonthlyChart() {
    setTimeout(() => this.renderMonthlyChart(), 100);
  }

  private scheduleFilteredCharts() {
    setTimeout(() => this.renderFilteredCharts(), 150);
  }

  private getProductLabels(data: any) {
    if (!data?.products) return [];
    return data.products.map((p: any) => `${p._id.productName} (${p._id.productSize})`);
  }

  private getProductQty(data: any) {
    if (!data?.products) return [];
    return data.products.map((p: any) => p.qty);
  }

  private renderDailyChart() {
    if (!this.dailyChartRef || !this.daily?.products) return;
    this.destroyChart(0);

    const ctx = this.dailyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts[0] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.getProductLabels(this.daily),
        datasets: [{
          label: 'Qty Sold',
          data: this.getProductQty(this.daily),
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderColor: '#2563eb',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private renderWeeklyChart() {
    if (!this.weeklyChartRef || !this.weekly?.weekDays) return;
    this.destroyChart(1);

    const labels = this.weekly.weekDays.map((d: any) => d.day);
    const amounts = this.weekly.weekDays.map((d: any) => d.amount);
    const counts = this.weekly.weekDays.map((d: any) => d.count);

    const ctx = this.weeklyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts[1] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Sales Amount',
            data: amounts,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 1,
          },
          {
            label: 'Invoices',
            data: counts,
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderColor: '#f59e0b',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private renderMonthlyChart() {
    if (!this.monthlyChartRef || !this.monthly?.monthlyTrend) return;
    this.destroyChart(2);

    const trend = this.monthly.monthlyTrend;
    const labels = trend.map((m: any) => m.label);
    const amounts = trend.map((m: any) => m.totalSalesAmount);

    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts[2] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Monthly Sales',
          data: amounts,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private renderFilteredCharts() {
    if (!this.filteredData) return;

    // RE-RENDER DAILY (PRODUCT QTY) CHART WITH FILTERED DATA
    if (this.dailyChartRef && this.filteredData.products) {
      this.destroyChart(0);
      const ctx = this.dailyChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts[0] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: this.getProductLabels(this.filteredData),
            datasets: [{
              label: 'Qty Sold',
              data: this.getProductQty(this.filteredData),
              backgroundColor: 'rgba(37, 99, 235, 0.7)',
              borderColor: '#2563eb',
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          },
        });
      }
    }

    // RE-RENDER WEEKLY CHART WITH FILTERED DATA (DAY-WISE)
    if (this.weeklyChartRef && this.filteredData.sales) {
      this.destroyChart(1);
      const dayGroups: any = {};
      this.filteredData.sales.forEach((s: any) => {
        const d = new Date(s.invoiceDate).toISOString().split('T')[0];
        if (!dayGroups[d]) dayGroups[d] = { amount: 0, count: 0 };
        dayGroups[d].amount += s.totalAmount || 0;
        dayGroups[d].count += 1;
      });
      const sortedDays = Object.keys(dayGroups).sort();
      const labels = sortedDays;
      const amounts = sortedDays.map((d) => dayGroups[d].amount);
      const counts = sortedDays.map((d) => dayGroups[d].count);

      const ctx = this.weeklyChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts[1] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Sales Amount',
                data: amounts,
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: '#10b981',
                borderWidth: 1,
              },
              {
                label: 'Invoices',
                data: counts,
                backgroundColor: 'rgba(245, 158, 11, 0.7)',
                borderColor: '#f59e0b',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } },
          },
        });
      }
    }

    // RE-RENDER MONTHLY CHART WITH FILTERED DATA
    if (this.monthlyChartRef && this.filteredData.sales) {
      this.destroyChart(2);
      const monthGroups: any = {};
      this.filteredData.sales.forEach((s: any) => {
        const d = new Date(s.invoiceDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthGroups[key]) monthGroups[key] = 0;
        monthGroups[key] += s.totalAmount || 0;
      });
      const sortedMonths = Object.keys(monthGroups).sort();
      const labels = sortedMonths;
      const amounts = sortedMonths.map((m) => monthGroups[m]);

      const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts[2] = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Filtered Sales',
              data: amounts,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#8b5cf6',
              pointRadius: 4,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          },
        });
      }
    }
  }

  getItemTotalQty(sale: any): number {
    if (!sale?.items) return 0;
    return sale.items.reduce((sum: number, item: any) => sum + (Number(item.qty) || 0), 0);
  }

  formatDateDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getWeeklyTitle(): string {
    if (this.weekly) {
      return `Weekly Report (Up to ${this.formatDateDDMMYYYY(this.weekly.weekEnd)})`;
    }
    return 'Weekly Report';
  }

  getMonthlyTitle(): string {
    if (this.monthly) {
      return `Monthly Report (Up to ${this.formatDateDDMMYYYY(this.monthly.monthEnd)})`;
    }
    return 'Monthly Report';
  }

  getWeeklyPeriod(): string {
    if (this.weekly) {
      return `Period: ${this.formatDateDDMMYYYY(this.weekly.weekStart)} to ${this.formatDateDDMMYYYY(this.weekly.weekEnd)}`;
    }
    return '';
  }

  getMonthlyPeriod(): string {
    if (this.monthly) {
      return `Period: ${this.formatDateDDMMYYYY(this.monthly.monthStart)} to ${this.formatDateDDMMYYYY(this.monthly.monthEnd)}`;
    }
    return '';
  }

  getFilterPeriod(): string {
    if (this.filteredData) {
      const from = this.filteredData.from ? this.formatDateDDMMYYYY(this.filteredData.from) : '';
      const to = this.filteredData.to ? this.formatDateDDMMYYYY(this.filteredData.to) : '';
      if (from && to) return `Period: ${from} to ${to}`;
    }
    return '';
  }

  private destroyChart(index: number) {
    if (this.charts[index]) {
      this.charts[index].destroy();
      this.charts[index] = null as any;
    }
  }

  private destroyCharts() {
    this.charts.forEach((c) => {
      if (c) c.destroy();
    });
    this.charts = [];
  }
}

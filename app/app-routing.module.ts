import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { AddPurchaseComponent } from './purchase/add-purchase/add-purchase.component';
import { PurchaseListComponent } from './purchase/purchase-list/purchase-list.component';
import { SalesListComponent } from './sales/sales-list/sales-list.component';
import { PurchaseReturnListComponent } from './purchase-return/purchase-return-list/purchase-return-list.component';
import { SalesReturnListComponent } from './sales-return/sales-return-list/sales-return-list.component';
import { StockManagementComponent } from './stock-management/stock-management.component';
import { ReportsComponent } from './reports/reports/reports.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/role.guard';

import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { ProductManagementComponent } from './admin/product-management/product-management.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { AdminNotificationsComponent } from './admin/admin-notifications/admin-notifications.component';
import { SalesReportComponent } from './sales/sales-report/sales-report.component';
import { StockReportComponent } from './stock-report/stock-report.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { DeliveryChallanComponent } from './delivery-challan/delivery-challan.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ADMIN LAYOUT
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'sales', component: SalesListComponent },
      { path: 'purchase', component: PurchaseListComponent },
      { path: 'add-purchase', component: AddPurchaseComponent },
      { path: 'sales-return', component: SalesReturnListComponent },
      { path: 'purchase-return', component: PurchaseReturnListComponent },
      { path: 'stock-management', component: StockManagementComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'products', component: ProductManagementComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'notifications', component: AdminNotificationsComponent },
      { path: 'sales-report', component: SalesReportComponent },
      { path: 'stock-report', component: StockReportComponent },
      { path: 'purchase-report', component: PurchaseReportComponent },
      { path: 'delivery-challan', component: DeliveryChallanComponent }
    ]
  },

  // SALESPERSON / COMMON LAYOUT
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'purchase', component: PurchaseListComponent },
      { path: 'add-purchase', component: AddPurchaseComponent },
      { path: 'sales', component: SalesListComponent },
      { path: 'purchase-return', component: PurchaseReturnListComponent },
      { path: 'sales-return', component: SalesReturnListComponent },
      { path: 'stock-management', component: StockManagementComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'sales-report', component: SalesReportComponent },
      { path: 'stock-report', component: StockReportComponent },
      { path: 'purchase-report', component: PurchaseReportComponent },
      { path: 'delivery-challan', component: DeliveryChallanComponent }
    ]
  },

  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

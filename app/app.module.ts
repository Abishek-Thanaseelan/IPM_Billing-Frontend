import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { LayoutComponent } from './layout/layout.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoginComponent } from './auth/login/login.component';

import { AddPurchaseComponent } from './purchase/add-purchase/add-purchase.component';
import { PurchaseListComponent } from './purchase/purchase-list/purchase-list.component';
import { SalesListComponent } from './sales/sales-list/sales-list.component';
import { PrintBillComponent } from './sales/print-bill/print-bill.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { StockManagementComponent } from './stock-management/stock-management.component';
import { ReportsComponent } from './reports/reports/reports.component';
import { PurchaseReturnModule } from './purchase-return/purchase-return.module';

import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { RegisterComponent } from './auth/register/register.component';
import { TokenInterceptor } from './core/interceptors/token.interceptor';

import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { ProductManagementComponent } from './admin/product-management/product-management.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { AdminNotificationsComponent } from './admin/admin-notifications/admin-notifications.component';
import { SalesReportComponent } from './sales/sales-report/sales-report.component';
import { StockReportComponent } from './stock-report/stock-report.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { DeliveryChallanComponent } from './delivery-challan/delivery-challan.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    AddPurchaseComponent,
    PurchaseListComponent,
    SalesListComponent,
    PrintBillComponent,
    StockManagementComponent,
    RegisterComponent,
    LayoutComponent,
    ReportsComponent,
    AdminLayoutComponent,
    AdminDashboardComponent,
    ProductManagementComponent,
    UserManagementComponent,
    AdminNotificationsComponent,
    SalesReportComponent,
    StockReportComponent,
    PurchaseReportComponent,
    DeliveryChallanComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    PurchaseReturnModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

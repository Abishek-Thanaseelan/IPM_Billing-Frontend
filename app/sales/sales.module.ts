import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { AddSalesComponent } from './add-sales/add-sales.component';
import { SalesListComponent } from './sales-list/sales-list.component';
import { FormsModule } from '@angular/forms';
import { PrintBillComponent } from './print-bill/print-bill.component';




@NgModule({
  declarations: [
    // AddSalesComponent,
    SalesListComponent,
    PrintBillComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class SalesModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddPurchaseComponent } from './add-purchase/add-purchase.component';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    AddPurchaseComponent,
    PurchaseListComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class PurchaseModule { }

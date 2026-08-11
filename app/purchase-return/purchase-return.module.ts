import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseReturnListComponent } from './purchase-return-list/purchase-return-list.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    PurchaseReturnListComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class PurchaseReturnModule { }

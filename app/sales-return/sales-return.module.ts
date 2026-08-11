import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesReturnListComponent } from './sales-return-list/sales-return-list.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    SalesReturnListComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class SalesReturnModule { }

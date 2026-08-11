import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseReturnService {

  constructor(private http: HttpClient) {}

 
  getPurchase(search: string) {
    return this.http.get(
      `${environment.apiUrl}/purchase/search/${search}`
    );
  }

  savePurchaseReturn(data: any) {
    return this.http.post(
      `${environment.apiUrl}/purchase-return/save`,
      data
    );
  }

  getNextReturnNo() {
    return this.http.get(
      `${environment.apiUrl}/purchase-return/next-return-no`
    );
  }

  getAllReturns() {
    return this.http.get(
      `${environment.apiUrl}/purchase-return`
    );
  }

  deleteReturn(id: string) {
    return this.http.delete(
      `${environment.apiUrl}/purchase-return/${id}`
    );
  }
}
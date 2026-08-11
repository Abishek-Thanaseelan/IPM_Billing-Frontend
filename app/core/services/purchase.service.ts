import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

    apiUrl = 'http://localhost:5000/api/purchase';

  constructor(private http: HttpClient) {}

  savePurchase(data:any){
    return this.http.post(this.apiUrl, data);
  }

  getAllPurchases() {
  return this.http.get(this.apiUrl);
}

getPurchaseByInvoice(invoiceNo: string) {
  return this.http.get(
    `http://localhost:5000/api/purchase/invoice/${invoiceNo}`
  );
}
getPurchaseByGrnNo(grnNo: string) {

  return this.http.get(
    `http://localhost:5000/api/purchase/grn/${grnNo}`
  );

}

savePurchaseReturn(data: any) {

  return this.http.post(
    'http://localhost:5000/api/purchase-return/save',
    data
  );

}

getNextReturnNo() {
  return this.http.get(
    `http://localhost:5000/api/purchase-return/next-return-no`
  );
}

getNextGrnNo() {

  return this.http.get(
    'http://localhost:5000/api/purchase/next-grn'
  );

}

private refreshSubject = new BehaviorSubject<boolean>(false);
refresh$ = this.refreshSubject.asObservable();

triggerRefresh() {
  this.refreshSubject.next(true);
}


deletePurchase(id: string) {

  return this.http.delete(
    `http://localhost:5000/api/purchase/${id}`
  );

}

updatePurchase(
  id: string,
  data: any
) {

  return this.http.put(
    `http://localhost:5000/api/purchase/${id}`,
    data
  );

}

getPurchase(searchText: string) {

  return this.http.get(
    `http://localhost:5000/api/purchase/search/${searchText}`
  );

}


updatePayment(id: string, data: any) {
  return this.http.put(
    `http://localhost:5000/api/purchase/payment/${id}`,
    data
  );
}
}
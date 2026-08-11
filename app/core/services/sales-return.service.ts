import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class SalesReturnService {

  apiUrl =
  'http://localhost:5000/api/sales-return';

  constructor(
    private http: HttpClient
  ) {}

getInvoice(invoiceNo: string) {
  return this.http.get(
    `${environment.apiUrl}/sales-return/GetInvoice/${invoiceNo}`
  );
}

saveReturn(data: any) {
  return this.http.post(
    `${environment.apiUrl}/sales-return/save-return`,
    data
  );
}

  updateReturn(id: string, data: any) {
  return this.http.put(
    `${environment.apiUrl}/sales-return/update-return/${id}`,
    data
  );
}

deleteReturn(id: string) {
  return this.http.delete(
    `${environment.apiUrl}/sales-return/delete-return/${id}`
  );
}

}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class SalesService {

  // Backend API URL
  private apiUrl = 'http://localhost:5000/api/sales';

  constructor(private http: HttpClient) {}

  // ADD SALES
  addSales(data: any): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/add`,
      data
    );
  }

  // GET ALL SALES
  getSales(): Observable<any> {

    return this.http.get(
      `${this.apiUrl}`
    );
  }

  // GET SINGLE SALE
  getSalesById(id: string): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/${id}`
    );
  }

  // UPDATE SALES
  updateSales(id: string, data: any): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  // DELETE SALES
  deleteSales(id: string): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }

  // FILTER SALES
  getSalesByDate(from: any, to: any): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/filter/date?from=${from}&to=${to}`
    );
  }

}
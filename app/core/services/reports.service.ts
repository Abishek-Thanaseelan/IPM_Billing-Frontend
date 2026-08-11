import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = 'http://localhost:5000/api/reports';

  constructor(private http: HttpClient) {}

  getDailySales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/daily-sales`);
  }

  getWeeklySales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/weekly-sales`);
  }

  getMonthlySales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/monthly-sales`);
  }

  getFilteredSales(from: string, to: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/filtered-sales?from=${from}&to=${to}`);
  }
}

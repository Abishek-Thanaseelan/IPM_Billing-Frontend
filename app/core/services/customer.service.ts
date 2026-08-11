import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private apiUrl = 'http://localhost:5000/api/customers';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  searchCustomers(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?name=${encodeURIComponent(name)}`);
  }

  getCustomer(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  addCustomer(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}

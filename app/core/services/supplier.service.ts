import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private apiUrl = 'http://localhost:5000/api/suppliers';

  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  searchSuppliers(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?name=${encodeURIComponent(name)}`);
  }

  getSupplier(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  addSupplier(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}

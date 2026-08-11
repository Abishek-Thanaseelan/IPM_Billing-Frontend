import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:5000/api/admin';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  approveUser(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/approve`, {});
  }

  declineUser(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/decline`, {});
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  getProfit(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profit`);
  }

  getNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications`);
  }
}

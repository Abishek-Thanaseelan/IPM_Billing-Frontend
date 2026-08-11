import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(data:any){
    return this.http.post(`${this.api}/auth/login`, data);
  }

  saveToken(token:string){
    localStorage.setItem('token', token);
  }

  getToken(){
    return localStorage.getItem('token');
  }

  logout(){
    localStorage.clear();
    sessionStorage.clear();
  }
}
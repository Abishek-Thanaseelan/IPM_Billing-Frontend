import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class OpeningStockService {

  constructor(private http: HttpClient) { }

  addStock(data:any){

    return this.http.post(

      'http://localhost:5000/api/add-opening-stock',
      data

    );

  }

  checkStock(data:any){

    return this.http.post(

      'http://localhost:5000/api/check-stock',
      data

    );

  }

}
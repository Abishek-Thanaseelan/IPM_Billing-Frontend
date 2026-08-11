import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockUpdateService {

  private stockSubject = new Subject<void>();

  stockUpdated$ = this.stockSubject.asObservable();

  triggerUpdate() {
    console.log("SERVICE TRIGGERED");
    this.stockSubject.next();
  }
}
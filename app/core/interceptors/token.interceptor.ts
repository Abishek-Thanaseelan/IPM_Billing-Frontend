import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler
} from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable()
export class TokenInterceptor
implements HttpInterceptor {

  intercept(req:HttpRequest<any>, next:HttpHandler){

    const token = localStorage.getItem('token');

    if(token){

      req = req.clone({
        setHeaders:{
          Authorization:`Bearer ${token}`
        }
      });

    }

    return next.handle(req);

  }

}
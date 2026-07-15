import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../storage.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/subscription`;

  constructor(private http: HttpClient, private storageService: StorageService) { }

  private getHeaders() {
    const token = this.storageService.getItem('authToken');
    return {
      Authorization: `Bearer ${token}`
    };
  }

  getStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/status`, { headers: this.getHeaders() });
  }

  createOrder(): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-order`, {}, { headers: this.getHeaders() });
  }

  verifyPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify`, paymentData, { headers: this.getHeaders() });
  }
}

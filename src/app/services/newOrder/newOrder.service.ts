import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../storage.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class newOrderService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient, private storageService: StorageService) { }

    getById(id: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.get(this.apiUrl + '/order/' + id, { headers });
    }

    newOrder(data: any): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        }
        return this.http.post(this.apiUrl + '/order', data, { headers })
    }

    getAllOrders(status: string, page: number, limit: number, filters?: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        // const headers = {
        //     Authorization: `Bearer ${token}`
        // };
        let params = new HttpParams().set('page', page).set('limit', limit).set('status', status);
        if (filters) {
            if (filters.customerName) params = params.set('customerName', filters.customerName);
            if (filters.mobile) params = params.set('mobile', filters.mobile);
            if (filters.date) params = params.set('date', filters.date);
            if (filters.month) params = params.set('month', filters.month);
            if (filters.year) params = params.set('year', filters.year);
        }
        return this.http.get(`${this.apiUrl}/order`, { params });
    }
    deleteOrder(id: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.delete(this.apiUrl + '/order/' + id, { headers })
    }

    updateOrder(data: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.put(this.apiUrl + '/order', data, { headers })
    }

    bulkUpdate(data: any, status: string): Observable<any> {
        let payload = { orderIds: data, status }
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        }
        return this.http.put(this.apiUrl + '/order/bulkUpdate', payload, { headers })
    }

    changePassword(data: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.post(this.apiUrl + '/change_pass', data, { headers });
    }

    overallsearch(data: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.post(this.apiUrl + '/order/search', data, { headers });
    }

    getBill(data: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.post(this.apiUrl + `/order/generate-invoice/${data.orderId}`, { headers }, { responseType: 'blob' })
    }

    getDashboardMetrics(): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.get(this.apiUrl + '/order/dashboard-metrics', { headers });
    }

    barcodeUpdate(payload: { bill: string, status?: string }): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.put(this.apiUrl + '/order/barcode-update', payload, { headers });
    }

    recordPayment(data: { orderId: string, paymentMethod: string, paidAmount: number, discount: number }): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.post(this.apiUrl + '/order/record-payment', data, { headers });
    }

    createPaymentLink(orderId: string): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };
        return this.http.post(this.apiUrl + '/order/create-payment-link', { orderId }, { headers });
    }

    checkPaymentLinkStatus(orderId: string): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };
        return this.http.get(`${this.apiUrl}/order/check-payment-link/${orderId}`, { headers });
    }

    simulateLinkPayment(orderId: string): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };
        return this.http.post(`${this.apiUrl}/order/simulate-link-payment`, { orderId }, { headers });
    }

    updateOrderServiceStatus(orderId: string, serviceId: string, status: string): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.put(`${this.apiUrl}/order/${orderId}/service-status`, { serviceId, status }, { headers });
    }

    getGarmentTagsPdf(orderId: string, options: any = {}): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.post(`${this.apiUrl}/order/generate-tags/${orderId}`, options, { headers, responseType: 'blob' });
    }

    getThermalBillPdf(orderId: string, options: any = {}): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.post(`${this.apiUrl}/order/generate-thermal-invoice/${orderId}`, options, { headers, responseType: 'blob' });
    }
}

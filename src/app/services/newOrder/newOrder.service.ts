import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class newOrderService {
    private apiUrl = 'https://laundry-fju0.onrender.com'; // Change to your actual API URL
    // private apiUrl = 'http://localhost:5000'

    constructor(private http: HttpClient) { }

    getAllItems(): Observable<any> {
        const token = localStorage.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.get(this.apiUrl+'/items', {headers});
    }
    
    newOrder(data: any): Observable<any>{
        const token = localStorage.getItem('authToken');
        const headers={
            Authorization: `Bearer ${token}`
        }
        return this.http.post(this.apiUrl+'/order', data, {headers})
    }
    
    getAllOrders(status:string, page: number, limit: number): Observable<any>{
        const token = localStorage.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        const params=new HttpParams().set('page', page).set('limit', limit).set('status', status)
        return this.http.get(`${this.apiUrl}/order`, {headers, params});
    }
    deleteOrder(id:any):Observable<any>{
        const token = localStorage.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.delete(this.apiUrl+'/order/'+id, {headers})
    }
    
    updateOrder(data:any):Observable<any>{
        const token = localStorage.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.put(this.apiUrl+'/order', data, {headers})
    }
}

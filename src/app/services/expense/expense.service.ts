import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../storage.service';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
    // private apiUrl = 'https://laundry-fju0.onrender.com'; // Change to your actual API URL
    private apiUrl = 'http://localhost:5000'

    constructor(private http: HttpClient, private storageService: StorageService) { }
    
    create(data: any): Observable<any>{
        const token = this.storageService.getItem('authToken');
        const headers={
            Authorization: `Bearer ${token}`
        }
        return this.http.post(this.apiUrl+'/expense', data, {headers})
    }
    
    getAllExpense(page: number, limit: number, type: string): Observable<any>{
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        const params=new HttpParams().set('page', page).set('limit', limit).set('type', type)
        return this.http.get(`${this.apiUrl}/expense`, {headers, params});
    }
    deleteOrder(id:any):Observable<any>{
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.delete(this.apiUrl+'/expense/'+id, {headers})
    }
    
    updateOrder(data:any):Observable<any>{
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.put(this.apiUrl+'/expense', data, {headers})
    }
}

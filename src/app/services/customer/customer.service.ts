import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerService {
    private apiUrl = 'https://laundry-fju0.onrender.com/customer'; // Change to your actual API URL
    // private apiUrl='http://localhost:5000/customer'

    constructor(private http: HttpClient) { }

    getAll(search:any): Observable<any> {
        const token = localStorage.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.get(`${this.apiUrl}?search=${encodeURIComponent(search)}`, {headers});
    }
    getById(id:any):Observable<any>{
        const token = localStorage.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.get(this.apiUrl+`/${id}`, {headers})
    }
}

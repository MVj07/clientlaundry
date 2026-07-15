import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../storage.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
    private apiUrl = `${environment.apiUrl}/customer`;

    constructor(private http: HttpClient, private storageService: StorageService) { }

    getAll(search: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.get(`${this.apiUrl}?search=${encodeURIComponent(search)}`, { headers });
    }
    getById(id: any): Observable<any> {
        const token = this.storageService.getItem('authToken'); // or sessionStorage
        const headers = {
            Authorization: `Bearer ${token}`
        };
        return this.http.get(this.apiUrl + `/${id}`, { headers })
    }
}

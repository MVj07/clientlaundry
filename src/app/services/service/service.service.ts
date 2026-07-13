import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../storage.service';

@Injectable({ providedIn: 'root' })
export class ServiceService {
    // private apiUrl = 'http://localhost:5000/service';
    private apiUrl = 'https://laundry-fju0.onrender.com/service'

    constructor(private http: HttpClient, private storageService: StorageService) { }

    private getHeaders() {
        const token = this.storageService.getItem('authToken');
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }

    getAll(): Observable<any> {
        return this.http.get(this.apiUrl, this.getHeaders());
    }

    create(data: { name: string, description?: string }): Observable<any> {
        return this.http.post(this.apiUrl, data, this.getHeaders());
    }

    update(id: string, data: { name: string, description?: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data, this.getHeaders());
    }

    delete(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
    }
}

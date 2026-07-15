import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../storage.service';

@Injectable({ providedIn: 'root' })
export class BusinessService {
    // private apiUrl = 'https://laundry-fju0.onrender.com/business'; // Change to your actual API URL
    private apiUrl = 'http://localhost:5000/business'

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
    create(data: any): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        }
        return this.http.post(this.apiUrl + '/setup', data, { headers })
    }

    createWorkflow(data: any): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        }
        return this.http.post(this.apiUrl + '/create-workflow', data, { headers })
    }

    getOne(): Observable<any> {
        const token = this.storageService.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`
        }
        return this.http.get(this.apiUrl + '/view', { headers })
    }
}

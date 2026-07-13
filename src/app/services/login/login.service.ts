import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';

@Injectable({ providedIn: 'root' })
export class LoginService {
  // private apiUrl = 'https://laundry-fju0.onrender.com/login';
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient, private router: Router, private storageService: StorageService) { }

  signup(data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/create', data)
  }

  loginUser(data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/login', data);
  }

  logOut(): void {
    this.storageService.removeItem('authToken')
    this.router.navigate(['/'])
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && localStorage) {
      return localStorage.getItem('authToken'); // or sessionStorage, depending on your implementation
    }
    return null;
  }

}

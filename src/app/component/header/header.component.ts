import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  constructor(
    private router: Router,
    private storageService: StorageService
  ){}
  logout():void{
    this.storageService.removeItem('authToken')
    this.router.navigate(['/login'])
  }
}

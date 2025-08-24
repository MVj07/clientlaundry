import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
export class authService{
    constructor(
        private router: Router,
        private storageService: StorageService
    ){}
    logout(){
        this.storageService.removeItem('authToken')
        this.router.navigate(['/login'])
    }
}
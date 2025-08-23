import { Router } from '@angular/router';
export class authService{
    constructor(
        private router: Router
    ){}
    logout(){
        localStorage.removeItem('authToken')
        this.router.navigate(['/login'])
    }
}
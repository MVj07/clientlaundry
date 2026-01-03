import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const customerhistoryGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  
    let token = null
    if (typeof window !== 'undefined' && localStorage) {
      token = localStorage.getItem('authToken');
    }
  
    const profileCompleted = localStorage.getItem("profile");
  
    // 1. If no token → redirect to login
    if (!token) {
      router.navigate(['/']);
      return false;
    }
  
    // 2. If profile not completed → redirect to business setup
    if (profileCompleted !== "true") {
      router.navigate(['/business_setup']);
      return false;
    }
  return true;
};

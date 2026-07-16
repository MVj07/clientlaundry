import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const settingsGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  
    let token = null
    let profileCompleted = null
    let role = null
    if (typeof window !== 'undefined' && localStorage) {
      token = localStorage.getItem('authToken');
      profileCompleted = localStorage.getItem("profile");
      role = localStorage.getItem("role");
    }
  
    // 1. If no token → redirect to login
    if (!token) {
      router.navigate(['/']);
      return false;
    }

    if (role === 'employee') {
      router.navigate(['/savepannel']);
      return false;
    }
  
    // 2. If profile not completed → redirect to business setup
    if (profileCompleted !== "true") {
      router.navigate(['/business_setup']);
      return false;
    }
  return true;
};

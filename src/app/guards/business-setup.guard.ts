import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const businessSetupGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const token = typeof window !== 'undefined'
      ? localStorage.getItem('authToken')
      : null;

  const profileCompleted = typeof window !== 'undefined' && localStorage
      ? localStorage.getItem("profile")
      : null;

  const role = typeof window !== 'undefined' && localStorage
      ? localStorage.getItem("role")
      : null;

  // 1️⃣ If no token → redirect to login
  if (!token) {
    router.navigate(['/']);
    return false;
  }

  // 2️⃣ If employee → block setup page and redirect to savepannel
  if (role === "employee") {
    router.navigate(['/savepannel']);
    return false;
  }

  // 3️⃣ If profile completed → redirect to HOME
  if (profileCompleted === "true") {
    router.navigate(['/home']);
    return false;
  }

  return true;
};

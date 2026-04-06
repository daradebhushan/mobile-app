import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.getToken()) {
        const user = authService.currentUserValue;
        const requiredRoles = route.data['roles'] as Array<string>;

        if (requiredRoles && user) {
            const userRoles = user.roles.map(r => r.toUpperCase().replace('ROLE_', ''));
            const normalizedRequired = requiredRoles.map(r => r.toUpperCase().replace('ROLE_', ''));

            const hasRole = userRoles.some(role => normalizedRequired.includes(role));

            if (!hasRole) {
                const msg = `Access Denied: You do not have the required role to access this page. Required: [${normalizedRequired}], You have: [${userRoles}]`;
                console.warn(`AuthGuard: ${msg}`);
                alert(msg);
                return false;
            }
        }
        return true;
    }

    console.warn('AuthGuard: No token found. Redirecting to home (login).');
    // In mobile, home is login.
    router.navigate(['/login']);
    return false;
};

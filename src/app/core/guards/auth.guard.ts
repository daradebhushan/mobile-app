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
            // Backend returns roles like "ROLE_ADMIN".
            // We should check if user has any of the required roles.
            // Also handling simple role names if stripped.
            const hasRole = user.roles.some(role =>
                requiredRoles.includes(role) || requiredRoles.includes(role.replace('ROLE_', ''))
            );

            if (!hasRole) {
                console.warn('AuthGuard: Role mismatch. Required:', requiredRoles, 'User roles:', user.roles);
                // Role mismatch - maybe redirect to a generic unauthorized page or home
                // For now, return false
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

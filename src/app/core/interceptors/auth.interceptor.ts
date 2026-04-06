import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private authService: AuthService) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.authService.getToken();

        if (token) {
            console.log('Mobile Interceptor: Attaching token');
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
        } else {
            console.log('Mobile Interceptor: Skipping token (not found) but adding ngrok header');
            request = request.clone({
                setHeaders: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    console.error('Mobile Interceptor: 401 Unauthorized detected. Session likely expired. Logging out.');
                    this.authService.logout();
                } else if (error.status === 403) {
                    console.warn('Mobile Interceptor: 403 Forbidden. Access denied for this resource, but NOT logging out.');
                }
                return throwError(() => error);
            })
        );
    }
}

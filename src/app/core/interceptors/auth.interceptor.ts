import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
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

        return next.handle(request);
    }
}

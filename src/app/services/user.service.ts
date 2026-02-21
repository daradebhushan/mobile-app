import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    department?: { id: number; name: string };
    designation?: { id: number; name: string };
    admin?: User; // Reports To
    mobile?: string;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/api/admin/users`;

    constructor(private http: HttpClient) { }

    getAllUsers(params?: any): Observable<any> {
        let queryString = '';
        if (params) {
            const queryParams = new URLSearchParams();
            for (const key in params) {
                if (params[key] !== null && params[key] !== undefined) {
                    queryParams.append(key, params[key]);
                }
            }
            queryString = `?${queryParams.toString()}`;
        }
        return this.http.get<any>(`${this.apiUrl}${queryString}`).pipe(
            tap(res => console.log('DEBUG: User API Response:', res))
        );
    }

    createUser(user: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, user);
    }

    updateUser(id: number, user: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, user);
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    getProfile(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/api/user/profile`);
    }

    updateProfile(user: any): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}/api/user/profile`, user);
    }

    getUserById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }
}

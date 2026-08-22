import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class OwnerService {
    private apiUrl = `${environment.apiUrl}/api/owner`;

    constructor(private http: HttpClient) { }

    getDashboardStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard-stats`);
    }

    getAdmins(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/admins`);
    }

    createAdmin(admin: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/admins`, admin);
    }

    toggleAdminStatus(adminId: number, active: boolean): Observable<any> {
        let params = new HttpParams().set('active', active);
        return this.http.put<any>(`${this.apiUrl}/admins/${adminId}/status`, {}, { params });
    }

    resetAdminPassword(email: string, newPassword: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/users/reset-password`, { email, newPassword });
    }

    getWhatsappGatewayStatus(adminId: number = 1): Observable<any> {
        let params = new HttpParams().set('adminId', adminId);
        return this.http.get<any>(`${this.apiUrl}/whatsapp/gateway`, { params });
    }

    unlinkWhatsappGateway(adminId: number = 1): Observable<any> {
        let params = new HttpParams().set('adminId', adminId);
        return this.http.post<any>(`${this.apiUrl}/whatsapp/gateway/unlink`, {}, { params });
    }

    getAdminWhatsappConfig(adminId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/admins/${adminId}/whatsapp`);
    }

    updateAdminWhatsappConfig(adminId: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/admins/${adminId}/whatsapp`, data);
    }
}

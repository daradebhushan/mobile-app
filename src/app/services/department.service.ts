import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Department {
    id: number;
    name: string;
    adminId: number;
    active: boolean;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class DepartmentService {
    private apiUrl = `${environment.apiUrl}/api/admin/departments`;

    constructor(private http: HttpClient) { }

    getAllDepartments(): Observable<any> {
        return this.http.get<any>(this.apiUrl);
    }

    createDepartment(department: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, department);
    }

    deleteDepartment(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    updateDepartment(id: number, department: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, department);
    }

    getDepartmentById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    seedDefaultDepartments(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/seed-defaults`, {});
    }

    cleanupInactiveDepartments(): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/cleanup`);
    }
}

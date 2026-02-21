import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
    totalDepartments?: number;
    totalUsers?: number;
    totalTasks: number;
    toDoTasks: number;
    inProgressTasks: number;
    onHoldTasks: number;
    completedTasks: number;
    criticalTasks?: number;
    directToDoTasks?: number;
    myAssignedTasks?: number;
    tasksFromCo?: number;
    departmentStats?: { id: number; name: string; count: number }[];
    employeeStats?: { id: number; name: string; designation: string; totalTasks: number; completedTasks: number }[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiUrl}/api/stats`;

    constructor(private http: HttpClient) { }

    getAdminStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard`);
    }

    getOwnerStats(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/api/owner/dashboard-stats`);
    }

    getDeptHeadStats(deptId?: number): Observable<DashboardStats> {
        // Backend handles filtering based on Token Role usually
        return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
    }

    getStaffStats(staffId?: number): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
    }

    // Helper for generating reports if needed
    getEmployeeReport(employeeId: number): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/api/admin/users/${employeeId}/report`);
    }

    emailAdminReport(): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/api/admin/report/email`, {});
    }
}

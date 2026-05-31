import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ComplaintType {
    id: number;
    departmentId?: number;
    departmentName?: string;
    nameMr?: string;
    nameEn?: string;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ComplaintTypeService {
    private apiUrl = `${environment.apiUrl}/api/admin/complaint-types`;

    constructor(private http: HttpClient) { }

    getAllComplaintTypes(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}`);
    }

    getComplaintTypeById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    createComplaintType(type: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}`, type);
    }

    updateComplaintType(id: number, type: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, type);
    }

    deleteComplaintType(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}

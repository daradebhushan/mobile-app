import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Designation {
    id: number;
    name: string;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class DesignationService {
    private apiUrl = `${environment.apiUrl}/api/admin/designations`;

    constructor(private http: HttpClient) { }

    getAllDesignations(): Observable<any> {
        return this.http.get<any>(this.apiUrl);
    }

    createDesignation(name: string): Observable<any> {
        return this.http.post<any>(this.apiUrl, { name });
    }

    deleteDesignation(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}

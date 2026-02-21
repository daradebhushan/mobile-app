import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Complaint {
    id: number;
    complaintNo: string;
    citizenName: string;
    citizenMobile: string;
    departmentId?: number;
    departmentName?: string;
    complaintTypeId?: number;
    complaintTypeName?: string;
    subComplaintType?: string;
    description: string;
    photoUrl?: string; // URL from Twilio
    location?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED_TO_TASK';
    rejectionReason?: string;
    relatedTaskId?: number;
    relatedTaskTitle?: string;
    createdAt: string;
    comments?: ComplaintComment[];
    attachments?: ComplaintAttachment[];
}

export interface ComplaintComment {
    id: number;
    text: string;
    userName: string;
    timestamp: string;
}

export interface ComplaintAttachment {
    id: number;
    fileName: string;
    filePath: string;
    fileType: string;
    uploadedBy: string;
}

@Injectable({
    providedIn: 'root'
})
export class ComplaintService {
    private apiUrl = `${environment.apiUrl}/api/admin/complaints`;

    constructor(private http: HttpClient) { }

    getComplaints(filters: any = {}): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    }

    getComplaintById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    }

    updateStatus(id: number, status: string, reason?: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status, reason }, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    }

    createTaskFromComplaint(id: number, taskRequest: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${id}/create-task`, taskRequest, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    }

    addComment(id: number, text: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${id}/comments`, { text }, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    }

    addAttachment(id: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        // Do NOT add content-type header for FormData, browser does it (multipart/form-data)
        // But do add ngrok header
        return this.http.post<any>(`${this.apiUrl}/${id}/attachments`, formData, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    }

    downloadAttachment(attachmentId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/attachments/${attachmentId}/download`, {
            responseType: 'blob',
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
    }

    getImage(url: string): Observable<Blob> {
        return this.http.get(url, {
            responseType: 'blob',
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
    }
}

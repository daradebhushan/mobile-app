import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: 'TO_DO' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
    priority: 'MINOR' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dueDate?: string;
    department?: { id: number; name: string };
    assignedStaff?: { id: number; name: string };
    assignedStaffName?: string;
    createdDate: string;
    type?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = `${environment.apiUrl}/api/tasks`;

    constructor(private http: HttpClient) { }

    createTask(task: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/create`, task);
    }

    notifyTaskCreated(taskId: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${taskId}/notify`, {});
    }

    getTasks(filters: any = {}): Observable<any> {
        let params = new HttpParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params = params.set(key, filters[key]);
            }
        });

        return this.http.get<any>(`${this.apiUrl}`, { params });
    }

    getTaskById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    updateTaskStatus(id: number, status: string): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status });
    }

    updateTask(id: number, task: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, task);
    }

    // Comments
    addComment(taskId: number, text: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${taskId}/comments`, { text });
    }

    getComments(taskId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${taskId}/comments`);
    }

    updateComment(taskId: number, commentId: number, text: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${taskId}/comments/${commentId}`, { text });
    }

    deleteComment(taskId: number, commentId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${taskId}/comments/${commentId}`);
    }

    // Attachments
    uploadAttachments(taskId: number, files: FileList): Observable<any> {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        return this.http.post<any>(`${this.apiUrl}/${taskId}/attachments/batch`, formData);
    }

    uploadCommentAttachments(taskId: number, commentId: number, files: FileList): Observable<any> {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        return this.http.post<any>(`${this.apiUrl}/${taskId}/comments/${commentId}/attachments/batch`, formData);
    }

    getAttachments(taskId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${taskId}/attachments`);
    }

    downloadAttachment(attachmentId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/attachments/${attachmentId}/download`, { responseType: 'blob' });
    }

    deleteTask(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    deleteAttachment(attachmentId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/attachments/${attachmentId}`);
    }

    emailAdminReport(): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/api/admin/report/email`, {});
    }
}

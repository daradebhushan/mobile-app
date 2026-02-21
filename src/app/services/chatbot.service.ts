import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatbotSettings {
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    welcomeMsgEn?: string;
    welcomeMsgMr?: string;
    welcomeMsgHi?: string;
    chatbotFlow?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChatbotService {
    private apiUrl = `${environment.apiUrl}/api/admin/chatbot/settings`;

    constructor(private http: HttpClient) { }

    getSettings(): Observable<ChatbotSettings> {
        return this.http.get<ChatbotSettings>(this.apiUrl);
    }

    saveSettings(settings: ChatbotSettings): Observable<string> {
        return this.http.post(this.apiUrl, settings, { responseType: 'text' });
    }

    simulateChat(message: string, adminId: number = 1, mediaUrl?: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/api/admin/bot-sim/interact`, {
            mobile: 'SIM_USER',
            message: message,
            adminId: adminId,
            mediaUrl: mediaUrl,
            numMedia: mediaUrl ? 1 : 0
        });
    }

    uploadFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${environment.apiUrl}/api/admin/bot-sim/upload`, formData);
    }
}

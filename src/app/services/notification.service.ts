import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, lastValueFrom } from 'rxjs';
import { switchMap, tap, take } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface Notification {
    id: number;
    message: string;
    type: 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED';
    relatedTaskId: number;
    read: boolean;
    createdAt: string;
    senderName: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiUrl}/api/notifications`;
    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(private http: HttpClient) {
        // Start polling every 30 seconds
        interval(30000).pipe(
            switchMap(() => this.getUnreadCount())
        ).subscribe();
    }

    getNotifications(): Observable<any> {
        return this.http.get<any>(this.apiUrl);
    }

    getUnreadCount(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/unread-count`).pipe(
            tap(async (res: any) => {
                if (res.success) {
                    const newCount = res.data;
                    const oldCount = this.unreadCountSubject.value;

                    if (newCount > oldCount) {
                        // Triger local notification if new ones arrived
                        await this.showSystemNotification(newCount - oldCount);
                    }

                    this.unreadCountSubject.next(newCount);
                }
            })
        );
    }

    private async showSystemNotification(increment: number) {
        // Functionality Check: Task Alerts Toggle
        const alertsEnabled = localStorage.getItem('taskAlerts');
        if (alertsEnabled !== null && JSON.parse(alertsEnabled) === false) {
            return;
        }

        if (Capacitor.getPlatform() === 'web') {
            // Visual feedback for Browser Verification
            console.log('WEB NOTIFICATION SIMULATION:', increment, 'New Notifications');
            // We can dispatched a custom event or rely on console for playwright
            return;
        }

        try {
            const isGranted = await LocalNotifications.checkPermissions();
            if (isGranted.display === 'granted') {
                // Fetch the latest notification to show its message
                const notifications = await lastValueFrom(this.getNotifications().pipe(take(1)));
                const latest = notifications.data && notifications.data.length > 0 ? notifications.data[0] : null;

                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: increment === 1 ? 'New Notification' : `${increment} New Notifications`,
                            body: latest ? latest.message : 'You have new updates in Nagar Parishad App',
                            id: Math.floor(Math.random() * 10000),
                            schedule: { at: new Date(Date.now() + 1000) },
                            sound: 'default',
                            actionTypeId: '',
                            extra: latest ? { taskId: latest.relatedTaskId } : null
                        }
                    ]
                });
            }
        } catch (error) {
            console.error('Error showing local notification:', error);
        }
    }

    markAsRead(id: number): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}/read`, {}).pipe(
            tap(() => {
                // Decrease count locally for instant feedback
                const current = this.unreadCountSubject.value;
                if (current > 0) this.unreadCountSubject.next(current - 1);
            })
        );
    }

    markAllAsRead(): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/read-all`, {}).pipe(
            tap(() => {
                this.unreadCountSubject.next(0);
                this.getNotifications().subscribe(); // Refresh list to update UI state
            })
        );
    }

    refreshCount() {
        this.getUnreadCount().subscribe();
    }
}

import { Component, ViewChild, OnDestroy } from '@angular/core';
import { IonTabs } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { AuthService } from '../services/auth/auth.service';
import { map, Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    standalone: true,
    imports: [IonicModule, CommonModule, TranslatePipe]
})
export class TabsPage {
    isOwner$: Observable<boolean>;
    isAdmin$: Observable<boolean>;
    isStaff$: Observable<boolean>;

    @ViewChild('tabs', { static: false }) tabs!: IonTabs;

    constructor(private authService: AuthService) {
        this.isOwner$ = this.authService.user$.pipe(
            map(user => {
                if (!user) return false;
                const roles = user.roles || [];
                const role = (user as any).role;
                return roles.includes('ROLE_OWNER') || roles.includes('OWNER') ||
                    roles.includes('SYSTEM_OWNER') || roles.includes('ROLE_SYSTEM_OWNER') ||
                    role === 'OWNER' || role === 'ROLE_OWNER' ||
                    role === 'SYSTEM_OWNER' || role === 'ROLE_SYSTEM_OWNER';
            })
        );
        this.isAdmin$ = this.authService.user$.pipe(
            map(user => {
                if (!user) return false;
                const roles = user.roles || [];
                const role = (user as any).role;
                return roles.includes('ROLE_ADMIN') || roles.includes('ADMIN') || 
                       roles.includes('CHIEF_OFFICER') || roles.includes('ROLE_CHIEF_OFFICER') ||
                       role === 'ADMIN' || role === 'ROLE_ADMIN' ||
                       role === 'CHIEF_OFFICER' || role === 'ROLE_CHIEF_OFFICER';
            })
        );
        // Default others to view standard tabs for now
        this.isStaff$ = this.authService.user$.pipe(
            map(user => !!user && (user.roles.includes('ROLE_STAFF') || user.roles.includes('STAFF')))
        );
    }
}

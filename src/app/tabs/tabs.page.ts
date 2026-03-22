import { Component, ViewChild } from '@angular/core';
import { IonTabs } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { AuthService } from '../services/auth/auth.service';
import { map, Observable } from 'rxjs';

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

    constructor(private authService: AuthService, private platform: Platform) {
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
                return roles.includes('ROLE_ADMIN') || roles.includes('ADMIN') || role === 'ADMIN' || role === 'ROLE_ADMIN';
            })
        );
        // Default others to view standard tabs for now
        this.isStaff$ = this.authService.user$.pipe(
            map(user => !!user && (user.roles.includes('ROLE_STAFF') || user.roles.includes('STAFF')))
        );
    }

    ionViewDidEnter() {
        this.platform.backButton.subscribeWithPriority(-1, async () => {
            const selectedTab = this.tabs.getSelected();

            // If we are NOT on home/dashboard tab (and at root of that tab), go to home.
            // Note: Router Outlet handles depth within a tab properly by default (priority > -1).
            // This -1 priority only catches when Router Outlet didn't handle it (i.e. at root of tab).

            if (selectedTab !== 'home' && selectedTab !== 'owner/dashboard') {
                // Check if user is owner or regular to redirect to correct dashboard
                // We can simply try to navigate to home first if permitted, logic can be inferred
                // But simpler: just switch tab
                const isOwner = await this.isOwnerPromise();
                if (isOwner) {
                    if (selectedTab !== 'owner/dashboard') {
                        this.tabs.select('owner/dashboard');
                    } else {
                        App.exitApp();
                    }
                } else {
                    if (selectedTab !== 'home') {
                        this.tabs.select('home');
                    } else {
                        App.exitApp();
                    }
                }
            } else {
                // Already on home/dashboard, exit app
                App.exitApp();
            }
        });
    }

    // Helper to get owner status as promise
    private async isOwnerPromise(): Promise<boolean> {
        let isOwner = false;
        this.isOwner$.subscribe(val => isOwner = val).unsubscribe();
        return isOwner;
    }
}

import { Component, OnInit, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Location } from '@angular/common';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';

import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private menu: MenuController,
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private themeService: ThemeService,
    private zone: NgZone
  ) { }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.initPushNotifications();
      this.themeService.initTheme();
      this.initDeepLinking();
      this.initFallbackBackButton();
    });
  }

  initFallbackBackButton() {
    this.platform.backButton.subscribeWithPriority(-10, () => {
      const rawUrl = this.router.url || '';
      const currentUrl = rawUrl.split('?')[0].split('#')[0];
      console.log('App backbutton handler fired. Current URL:', currentUrl);

      // 1. Root Landing & Primary Home pages -> Exit app
      const isRootHome = currentUrl === '/login' ||
                         currentUrl === '/tabs/home' ||
                         currentUrl === '/tabs/owner/dashboard' ||
                         currentUrl === '/' ||
                         currentUrl === '';

      if (isRootHome) {
        console.log('At primary root home, exiting app.');
        App.exitApp();
        return;
      }

      // 2. Secondary Root Tabs (Tasks, Complaints, Users, Settings, Owner Admin Management)
      // When at the root list of these tabs, back button returns to the home dashboard
      const isSecondaryRootTab = currentUrl === '/tabs/tasks' ||
                                 currentUrl === '/tabs/complaints' ||
                                 currentUrl === '/tabs/admin/users' ||
                                 currentUrl === '/tabs/admin/departments' ||
                                 currentUrl === '/tabs/settings' ||
                                 currentUrl === '/tabs/admin/settings' ||
                                 currentUrl === '/tabs/owner/admin-management';

      if (isSecondaryRootTab) {
        console.log('At secondary root tab, returning to home dashboard...');
        const user = this.authService.currentUserValue;
        if (user) {
          const roles = user.roles || [];
          if (roles.includes('ROLE_OWNER') || roles.includes('OWNER') || (user as any).role === 'OWNER') {
            this.router.navigate(['/tabs/owner/dashboard']);
          } else {
            this.router.navigate(['/tabs/home']);
          }
        } else {
          this.router.navigate(['/login']);
        }
        return;
      }

      // 3. Sub-pages (Task Detail, Task Form, Complaint Detail, User Form, etc.)
      // Pop the history stack to return to previous screen
      console.log('At sub-page, navigating back in history...');
      if (window.history.length > 1) {
        this.location.back();
      } else {
        // Fallback if no history exists (e.g. opened directly from notification or deep link)
        if (currentUrl.includes('/tasks')) {
          this.router.navigate(['/tabs/tasks']);
        } else if (currentUrl.includes('/complaint')) {
          this.router.navigate(['/tabs/complaints']);
        } else if (currentUrl.includes('/admin/users')) {
          this.router.navigate(['/tabs/admin/users']);
        } else if (currentUrl.includes('/admin/departments')) {
          this.router.navigate(['/tabs/admin/departments']);
        } else if (currentUrl.includes('/admin/complaint-types')) {
          this.router.navigate(['/tabs/admin/complaint-types']);
        } else {
          this.router.navigate(['/tabs/home']);
        }
      }
    });
  }

  initDeepLinking() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        // Example URL: https://townseva.in/magic-login?token=xyz123&target=/tasks/456
        const url = new URL(event.url);
        
        if (url.pathname === '/magic-login') {
          const token = url.searchParams.get('token');
          const target = url.searchParams.get('target');
          
          if (token) {
            // Ideally, pass this token to authService to set session
            console.log('Intercepted Magic Login Token!', token);
            // Example: this.authService.loginWithToken(token).subscribe(...)
            
            // Navigate to target route
            if (target) {
              this.router.navigateByUrl(target);
            }
          }
        }
      });
    });
  }

  async initPushNotifications() {
    if (Capacitor.getPlatform() !== 'web') {
      try {
        const result = await LocalNotifications.requestPermissions();
        if (result.display === 'granted') {
          console.log('Local notifications permission granted');

          // Setup listener for downloaded files (from complaints/tasks)
          this.setupLocalNotificationListener();
        }
      } catch (error) {
        console.error('Error requesting notifications permissions', error);
      }
      // Push notifications registration can be added here if needed in future
      // this.registerPush();
    }
  }

  setupLocalNotificationListener() {
    LocalNotifications.addListener('localNotificationActionPerformed', async (notificationEvent) => {
      console.log('Local notification action performed', notificationEvent);

      const extra = notificationEvent.notification.extra;
      if (extra && extra.filePath) {
        console.log('Attempting to open file from notification:', extra.filePath);
        try {
          console.log('Notification opening file:', extra.filePath, 'type:', extra.contentType);
          await FileOpener.open({
            filePath: extra.filePath,
            contentType: extra.contentType || 'application/octet-stream', // Fallback
            openWithDefault: false
          });
          console.log('FileOpener resolved successfully from notification');
        } catch (e) {
          console.error('Error opening file from notification', e);
        }
      }
    });
  }

  closeMenu() {
    this.menu.close();
  }

  logout() {
    this.authService.logout();
    this.menu.close();
    this.router.navigate(['/login']);
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  get isAdmin(): boolean {
    const user = this.currentUser;
    return user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN') || false;
  }

  get isOwner(): boolean {
    const user = this.currentUser;
    return user?.roles?.includes('OWNER') || user?.roles?.includes('ROLE_OWNER') || false;
  }

  get isDeptHead(): boolean {
    const user = this.currentUser;
    return user?.roles?.includes('DEPARTMENT_HEAD') || user?.roles?.includes('ROLE_DEPARTMENT_HEAD') || false;
  }

  get isStaff(): boolean {
    const user = this.currentUser;
    return user?.roles?.includes('STAFF') || user?.roles?.includes('ROLE_STAFF') || false;
  }

  private registerPush() {
    PushNotifications.requestPermissions().then((result) => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else {
        // Show some error or fallback
      }
    });

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.log('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });
  }
}

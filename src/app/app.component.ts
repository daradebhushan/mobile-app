import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';

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
    private authService: AuthService,
    private themeService: ThemeService
  ) { }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.initPushNotifications();
      this.themeService.initTheme();
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

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoadingController, ToastController, Platform, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';
  showPassword = false;
  isBiometricAvailable = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router,
    private authService: AuthService,
    private platform: Platform,
    private navCtrl: NavController,
    public themeService: ThemeService
  ) { }

  async ionViewWillEnter() {
    // Check if user is already logged in for persistent session redirect
    const user = this.authService.currentUserValue;
    if (user && this.authService.getToken()) {
      if (this.platform.is('hybrid')) {
        const isEnabled = await this.authService.isBiometricEnabled();
        if (isEnabled) {
          console.log('Biometric enabled, challenging user...');
          const verified = await this.authService.verifyBiometricAccessOnly();
          if (verified) {
            console.log('Biometric verified, proceeding to home');
            this.handleRoleRouting(user);
          } else {
            console.log('Biometric failed or cancelled. Stay on login page.');
            // Optional: Show a button to retry easier? 
            // The "Login with Biometrics" button is already there but simpler text might help.
            this.showToast('Authentication required to unlock', 'warning');
          }
          return; // Stop here in either case (verified -> routed, failed -> stay)
        }
      }

      console.log('LoginPage: User already logged in, redirecting to home');
      this.handleRoleRouting(user);
      return;
    }

    // Check Biometrics (only on device)
    if (this.platform.is('hybrid')) {
      const available = await this.authService.isBiometricAvailable();
      const enabled = await this.authService.isBiometricEnabled();
      this.isBiometricAvailable = available && enabled;
    }
  }

  toggleTheme() {
    const isDark = this.themeService.isDarkMode();
    this.themeService.toggleDarkTheme(!isDark);
  }

  async loginWithBiometrics() {
    const loginObservable = await this.authService.performBiometricLogin();
    if (loginObservable) {
      const loading = await this.loadingCtrl.create({
        message: 'Verifying...',
      });
      await loading.present();

      loginObservable.subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          this.handleLoginSuccess();
        },
        error: async (err) => {
          await loading.dismiss();
          this.showToast('Biometric Login Failed', 'danger');
        }
      });
    } else {
      this.showToast('Biometric authentication failed or cancelled', 'medium');
    }
  }

  async login() {
    this.errorMessage = '';
    const loading = await this.loadingCtrl.create({
      message: 'Authenticating...',
    });
    await loading.present();

    const credentials = {
      email: this.email,
      password: this.password
    };

    console.log('Attempting login via AuthService');

    this.authService.login(credentials)
      .subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          console.log('Login success:', res);
          this.handleLoginSuccess();
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Login error full object:', err);

          if (err.status === 0) {
            this.errorMessage = 'Connection failed. Check network or server status.';
          } else if (err.status === 401) {
            this.errorMessage = err.error?.message || 'Wrong credentials.';
          } else {
            this.errorMessage = err.error?.message || `Server Error (${err.status})`;
          }
          this.showToast(this.errorMessage, 'danger');
        }
      });
  }

  handleLoginSuccess() {
    const user = this.authService.currentUserValue;
    this.handleRoleRouting(user);
  }

  handleRoleRouting(user: any) {
    const roles = user ? user.roles : [];
    if (roles.includes('ROLE_OWNER') || roles.includes('OWNER')) {
      this.showToast('Welcome, System Owner!', 'success');
      this.navCtrl.navigateRoot(['/tabs/owner/dashboard']);
    } else if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN') || 
               roles.includes('CHIEF_OFFICER') || roles.includes('ROLE_CHIEF_OFFICER')) {
      this.showToast('Welcome, Chief!', 'success');
      this.navCtrl.navigateRoot(['/tabs/home']);
    } else if (roles.includes('ROLE_DEPARTMENT_HEAD') || roles.includes('DEPARTMENT_HEAD')) {
      this.showToast('Welcome Dept Head!', 'success');
      this.navCtrl.navigateRoot(['/tabs/home']);
    } else if (roles.includes('ROLE_STAFF') || roles.includes('STAFF')) {
      this.showToast('Welcome Staff!', 'success');
      this.navCtrl.navigateRoot(['/tabs/home']);
    } else {
      this.showToast('Login Successful', 'warning');
      this.navCtrl.navigateRoot(['/tabs/home']);
    }
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}

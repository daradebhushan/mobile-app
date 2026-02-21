import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false
})
export class ForgotPasswordPage implements OnInit {
  email: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
  }

  async onSubmit() {
    if (!this.email) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const loading = await this.loadingCtrl.create({
      message: 'Sending OTP...',
    });
    await loading.present();

    this.http.post(`${environment.apiUrl}/api/auth/forgot-password`, { email: this.email })
      .subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          this.loading = false;
          this.success = 'OTP sent to email! Check your inbox.';
          await this.showToast('OTP sent to email', 'success');
          setTimeout(() => {
            this.router.navigate(['/reset-password'], { queryParams: { email: this.email } });
          }, 1000);
        },
        error: async (err) => {
          await loading.dismiss();
          this.loading = false;
          console.error('Forgot password error', err);
          this.error = (err.error?.message) || `Error: ${err.status} - ${err.statusText} | ${JSON.stringify(err)}`;
          await this.showToast(this.error, 'danger');
        }
      });
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

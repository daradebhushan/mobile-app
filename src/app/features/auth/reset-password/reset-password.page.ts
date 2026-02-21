import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: false
})
export class ResetPasswordPage implements OnInit {
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  loading: boolean = false;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      if (!this.email) {
        this.error = 'Invalid Request. Email missing.';
      }
    });
  }

  async onSubmit() {
    if (!this.email || !this.otp || !this.newPassword) return;

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;
    this.error = '';

    const loading = await this.loadingCtrl.create({
      message: 'Resetting Password...',
    });
    await loading.present();

    const body = {
      email: this.email,
      otp: this.otp,
      newPassword: this.newPassword
    };

    this.http.post(`${environment.apiUrl}/api/auth/reset-password`, body)
      .subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          this.loading = false;

          const toast = await this.toastCtrl.create({
            message: 'Password reset successfully! Login now.',
            duration: 3000,
            color: 'success',
            position: 'bottom'
          });
          toast.present();

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1000);
        },
        error: async (err) => {
          await loading.dismiss();
          this.loading = false;
          console.error('Reset error', err);
          this.error = err.error?.message || 'Failed to reset password. Invalid OTP?';
        }
      });
  }

}

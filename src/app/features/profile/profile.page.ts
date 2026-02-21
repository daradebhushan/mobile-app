import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth/auth.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { IonicModule, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule],
    templateUrl: './profile.page.html'
})
export class ProfilePageComponent implements OnInit {
    user: any = null;
    loading = false;
    errorMessage: string | null = null;

    formData = {
        name: '',
        mobile: '',
        email: '',
        password: '',
        role: '',
        department: '',
        designation: ''
    };

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private toastController: ToastController
    ) { }

    ngOnInit() {
        this.fetchProfile();
    }

    fetchProfile() {
        this.loading = true;
        this.userService.getProfile()
            .pipe(finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.user = res.data;
                        this.formData = {
                            name: this.user.name || '',
                            mobile: this.user.mobile || '',
                            email: this.user.email || '',
                            password: '',
                            role: this.user.role,
                            department: this.user.department?.name || 'N/A',
                            designation: this.user.designation?.name || 'N/A'
                        };
                    }
                },
                error: (err) => {
                    this.errorMessage = 'Failed to load profile.';
                }
            });
    }

    async onSubmit() {
        this.loading = true;
        this.errorMessage = null;

        const updateData: any = {
            name: this.formData.name,
            mobile: this.formData.mobile,
            email: this.formData.email
        };

        if (this.formData.password) {
            updateData.password = this.formData.password;
        }

        this.userService.updateProfile(updateData)
            .pipe(finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: async (res: any) => {
                    if (res.success) {
                        const toast = await this.toastController.create({
                            message: 'Profile updated successfully!',
                            duration: 2000,
                            color: 'success'
                        });
                        toast.present();

                        this.user = res.data;
                        this.formData.password = '';
                    } else {
                        this.errorMessage = res.message;
                    }
                },
                error: async (err) => {
                    this.errorMessage = 'Update failed.';
                    const toast = await this.toastController.create({
                        message: 'Failed to update profile.',
                        duration: 2000,
                        color: 'danger'
                    });
                    toast.present();
                }
            });
    }
}

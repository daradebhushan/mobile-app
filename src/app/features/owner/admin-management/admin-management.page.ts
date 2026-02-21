import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { OwnerService } from '../../../services/owner.service';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { FileSizePipe } from '../../../core/pipes/file-size.pipe';

@Component({
    selector: 'app-admin-management',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, IonicModule, TranslatePipe, FileSizePipe],
    templateUrl: './admin-management.page.html'
})
export class AdminManagementPageComponent implements OnInit {
    admins: any[] = [];
    showModal = false;
    createForm: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private alertController: AlertController,
        private toastController: ToastController,
        private ownerService: OwnerService
    ) {
        this.createForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            mobile: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.fetchAdmins();
    }

    fetchAdmins() {
        this.loading = true;
        this.ownerService.getAdmins().subscribe({
            next: (data) => {
                this.admins = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error fetching admins', err);
                this.loading = false;
            }
        });
    }

    openCreateModal() {
        this.createForm.reset();
        this.showModal = true;
    }

    async createAdmin() {
        if (this.createForm.invalid) return;

        this.loading = true;
        this.ownerService.createAdmin(this.createForm.value).subscribe({
            next: () => {
                this.showModal = false;
                this.fetchAdmins();
                this.showToast('Admin created successfully');
            },
            error: (err) => {
                this.loading = false;
                this.showToast(err.error?.message || 'Failed to create admin', 'danger');
            }
        });
    }

    async toggleStatus(admin: any) {
        const alert = await this.alertController.create({
            header: 'Confirm Status Change',
            message: `Are you sure you want to ${admin.active ? 'block' : 'unblock'} this admin?`,
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: admin.active ? 'Block' : 'Unblock',
                    role: admin.active ? 'destructive' : '',
                    handler: () => {
                        this.ownerService.toggleAdminStatus(admin.id, !admin.active).subscribe({
                            next: () => this.fetchAdmins(),
                            error: (err) => console.error('Failed to update status', err)
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    async resetPassword(admin: any) {
        const alert = await this.alertController.create({
            header: 'Reset Password',
            inputs: [
                { name: 'newPassword', type: 'password', placeholder: 'New Password' }
            ],
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Reset',
                    handler: (data) => {
                        if (!data.newPassword) return false;
                        this.ownerService.resetAdminPassword(admin.email, data.newPassword).subscribe({
                            next: () => this.showToast('Password reset successfully'),
                            error: (err) => this.showToast('Failed to reset password', 'danger')
                        });
                        return true;
                    }
                }
            ]
        });
        await alert.present();
    }

    async showToast(message: string, color: string = 'success') {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            color
        });
        toast.present();
    }
}

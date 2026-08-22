import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { OwnerService } from '../../../services/owner.service';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { FileSizePipe } from '../../../core/pipes/file-size.pipe';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe';

import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-management',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, IonicModule, TranslatePipe, FileSizePipe, SafeUrlPipe],
    templateUrl: './admin-management.page.html'
})
export class AdminManagementPageComponent implements OnInit {
    admins: any[] = [];
    showModal = false;
    showWhatsappModal = false;
    createForm: FormGroup;
    whatsappForm: FormGroup;
    loading = false;
    gatewayStatus: any = null;
    selectedAdmin: any = null;
    qrUrl: string = 'http://localhost:9092/qr';

    constructor(
        private fb: FormBuilder,
        private alertController: AlertController,
        private toastController: ToastController,
        private ownerService: OwnerService,
        private location: Location,
        private router: Router
    ) {
        this.createForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            mobile: ['', Validators.required]
        });

        this.whatsappForm = this.fb.group({
            phoneNumber: ['', Validators.required],
            active: [true]
        });
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/owner/dashboard']);
        }
    }

    ngOnInit() {
        this.fetchAdmins();
        this.fetchGatewayStatus();
    }

    fetchGatewayStatus(adminId?: number) {
        const id = adminId || (this.selectedAdmin?.id || 1);
        this.ownerService.getWhatsappGatewayStatus(id).subscribe({
            next: (data) => {
                this.gatewayStatus = data;
            },
            error: (err) => console.error('Error fetching gateway status', err)
        });
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

    openWhatsappModal(admin?: any) {
        this.selectedAdmin = admin || (this.admins.length > 0 ? this.admins[0] : null);
        const adminId = this.selectedAdmin ? this.selectedAdmin.id : 1;
        this.qrUrl = `http://localhost:9092/qr?adminId=${adminId}`;

        if (this.selectedAdmin) {
            this.ownerService.getAdminWhatsappConfig(this.selectedAdmin.id).subscribe({
                next: (config) => {
                    this.whatsappForm.patchValue({
                        phoneNumber: config.phoneNumber || this.selectedAdmin.mobile || '',
                        active: config.active !== undefined ? config.active : true
                    });
                    this.showWhatsappModal = true;
                },
                error: () => {
                    this.whatsappForm.patchValue({
                        phoneNumber: this.selectedAdmin.mobile || '',
                        active: true
                    });
                    this.showWhatsappModal = true;
                }
            });
        } else {
            this.showWhatsappModal = true;
        }
        this.fetchGatewayStatus(adminId);
    }

    saveWhatsappConfig() {
        if (!this.selectedAdmin || this.whatsappForm.invalid) return;
        this.loading = true;
        this.ownerService.updateAdminWhatsappConfig(this.selectedAdmin.id, this.whatsappForm.value).subscribe({
            next: () => {
                this.loading = false;
                this.showToast('WhatsApp bot number configured for ' + this.selectedAdmin.name);
                this.showWhatsappModal = false;
                this.fetchAdmins();
            },
            error: (err) => {
                this.loading = false;
                this.showToast(err.error?.message || 'Failed to update WhatsApp configuration', 'danger');
            }
        });
    }

    async unlinkAndPairNewQR() {
        const adminId = this.selectedAdmin ? this.selectedAdmin.id : 1;
        const alert = await this.alertController.create({
            header: 'Unlink WhatsApp Session?',
            message: `This will disconnect the active number and generate a new pairing QR code for ${this.selectedAdmin?.name || 'this Nagar Parishad'}.`,
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Unlink & New QR',
                    role: 'destructive',
                    handler: () => {
                        this.loading = true;
                        this.ownerService.unlinkWhatsappGateway(adminId).subscribe({
                            next: () => {
                                this.loading = false;
                                this.showToast('Session unlinked! Scan the new QR code below.');
                                setTimeout(() => this.fetchGatewayStatus(adminId), 1500);
                            },
                            error: (err) => {
                                this.loading = false;
                                this.showToast(err.error?.message || 'Failed to unlink session', 'danger');
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
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

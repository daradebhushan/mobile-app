import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { IonicModule, NavController, AlertController, Platform, ToastController } from '@ionic/angular';
import { AuthService } from '../../../services/auth/auth.service';
import { LanguageService } from '../../../services/language.service';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Browser } from '@capacitor/browser';

@Component({
    selector: 'app-settings-page',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule, RouterModule],
    templateUrl: './settings.page.html',
})
export class SettingsPageComponent implements OnInit {
    orgName: string = 'Maharashtra Nagar Panchayat';
    orgLogo: string | null = null;
    username: string = '';
    userRole: string = 'Nagar Panchayat';
    currentLang: string = 'EN';
    isEditModalOpen = false;
    isPrivacyModalOpen = false;
    isTermsModalOpen = false;

    // Toggle States
    taskAlerts: boolean = true;
    emailNotifications: boolean = false;
    biometricEnabled: boolean = false;
    isBiometricSupported: boolean = false;

    // Edit Form Data
    editOrgName: string = '';
    editLogoFile: File | null = null;
    editLogoPreview: string | null = null;

    constructor(
        private authService: AuthService,
        private navCtrl: NavController,
        private alertController: AlertController,
        private languageService: LanguageService,
        private platform: Platform,
        private toastController: ToastController
    ) { }

    async ngOnInit() {
        const user = this.authService.currentUserValue;
        if (user) {
            this.username = user.name || user.username;
            this.userRole = user.roles && user.roles.length > 0 ? user.roles[0].replace('ROLE_', '') : 'STAFF';
        }
        this.currentLang = this.languageService.currentLang();

        // Load saved settings
        if (user && user.organizationName) {
            this.orgName = user.organizationName;
        } else {
            const savedName = localStorage.getItem('orgName');
            if (savedName) this.orgName = savedName;
        }

        if (user && user.organizationLogo) {
            this.orgLogo = user.organizationLogo;
        } else {
            const savedLogo = localStorage.getItem('orgLogo');
            if (savedLogo) this.orgLogo = savedLogo;
        }

        // Load Toggles
        const savedAlerts = localStorage.getItem('taskAlerts');
        if (savedAlerts !== null) this.taskAlerts = JSON.parse(savedAlerts);

        const savedEmail = localStorage.getItem('emailNotifications');
        if (savedEmail !== null) this.emailNotifications = JSON.parse(savedEmail);

        // Check Biometric Support
        if (this.platform.is('hybrid')) {
            this.isBiometricSupported = await this.authService.isBiometricAvailable();
            if (this.isBiometricSupported) {
                this.biometricEnabled = await this.authService.isBiometricEnabled();
            }
        }
    }

    // Toggle Handlers
    onToggleChange() {
        localStorage.setItem('taskAlerts', JSON.stringify(this.taskAlerts));
        localStorage.setItem('emailNotifications', JSON.stringify(this.emailNotifications));

        // Sync Email Preference to Backend
        this.authService.updateProfile({
            emailNotifications: this.emailNotifications
        }).subscribe({
            next: (res) => console.log('Settings synced', res),
            error: (err) => console.error('Failed to sync settings', err)
        });
    }

    async onBiometricToggle() {
        if (!this.isBiometricSupported) return;

        if (this.biometricEnabled) {
            // User wants to ENABLE it
            // We need their password to store it securely
            const alert = await this.alertController.create({
                header: 'Enable Biometric Login',
                message: 'Please enter your password to enable biometric login.',
                inputs: [
                    {
                        name: 'password',
                        type: 'password',
                        placeholder: 'Password'
                    }
                ],
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            this.biometricEnabled = false; // Revert toggle
                        }
                    },
                    {
                        text: 'Enable',
                        handler: async (data) => {
                            if (!data.password) return;

                            const user = this.authService.currentUserValue;
                            if (user && user.email) {
                                this.authService.login({ email: user.email, password: data.password }).subscribe({
                                    next: async (res) => {
                                        const success = await this.authService.enableBiometricLogin(user.email, data.password);
                                        if (success) {
                                            this.showToast('Biometric login enabled successfully', 'success');
                                        } else {
                                            this.biometricEnabled = false;
                                            this.showToast('Failed to save biometric credentials', 'danger');
                                        }
                                    },
                                    error: async (err) => {
                                        this.biometricEnabled = false;
                                        this.showToast('Incorrect password. Biometric not enabled.', 'danger');
                                    }
                                });
                            }
                        }
                    }
                ]
            });
            await alert.present();
        } else {
            // User wants to DISABLE it
            await this.authService.disableBiometricLogin();
            this.showToast('Biometric login disabled', 'medium');
        }
    }

    async showToast(msg: string, color: string) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            color: color,
            position: 'bottom'
        });
        await toast.present();
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'EN' ? 'MR' : 'EN';
        this.languageService.setLanguage(newLang);
        this.currentLang = newLang;
    }

    openEditModal() {
        this.editOrgName = this.orgName;
        this.editLogoPreview = this.orgLogo;
        this.editLogoFile = null;
        this.isEditModalOpen = true;
    }

    closeEditModal() {
        this.isEditModalOpen = false;
    }

    onLogoSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.editLogoFile = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.editLogoPreview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    async saveProfile() {
        if (!this.editOrgName.trim()) return;

        this.orgName = this.editOrgName;
        if (this.editLogoPreview) {
            this.orgLogo = this.editLogoPreview;
        }

        // Prepare update data
        const updateData: any = {
            organizationName: this.orgName
        };

        if (this.editLogoFile) {
            // Upload Photo
            this.authService.uploadProfilePhoto(this.editLogoFile).subscribe({
                next: (res) => {
                    if (res.success) {
                        const newLogoUrl = `${environment.apiUrl}/uploads/${res.data}`;
                        this.orgLogo = newLogoUrl;
                        this.editLogoPreview = newLogoUrl;
                        updateData.organizationLogo = newLogoUrl;
                        this.sendProfileUpdate(updateData);
                    }
                },
                error: (err) => {
                    console.error('Photo upload failed', err);
                    this.sendProfileUpdate(updateData); // Still save name if photo fails
                }
            });
        } else {
            if (this.orgLogo) updateData.organizationLogo = this.orgLogo;
            this.sendProfileUpdate(updateData);
        }
    }

    private sendProfileUpdate(updateData: any) {
        this.authService.updateProfile(updateData).subscribe({
            next: async (res) => {
                if (res.success && res.data && res.data.user) {
                    await this.authService.updateUserSubject(res.data.user);
                }
            }
        });

        // Local Persist as fallback/cache
        localStorage.setItem('orgName', this.orgName);
        if (this.orgLogo) localStorage.setItem('orgLogo', this.orgLogo);

        this.closeEditModal();

        this.showToast('Profile settings updated successfully.', 'success');
    }

    async logout() {
        const alert = await this.alertController.create({
            header: this.languageService.translate('LOGOUT'),
            message: this.languageService.translate('LOGOUT_CONFIRM') || 'Are you sure you want to logout?',
            buttons: [
                { text: this.languageService.translate('CANCEL'), role: 'cancel' },
                {
                    text: this.languageService.translate('LOGOUT'),
                    handler: async () => {
                        const loading = await this.toastController.create({
                            message: 'Logging out...',
                            duration: 1500,
                            position: 'middle',
                            color: 'dark'
                        });
                        await loading.present();

                        await this.authService.logout();
                        this.navCtrl.navigateRoot('/login');
                    }
                }
            ]
        });
        await alert.present();
    }

    openPrivacyPolicy() {
        this.isPrivacyModalOpen = true;
    }

    closePrivacyModal() {
        this.isPrivacyModalOpen = false;
    }

    openTermsOfService() {
        this.isTermsModalOpen = true;
    }

    closeTermsModal() {
        this.isTermsModalOpen = false;
    }

    async openAboutApp() {
        const alert = await this.alertController.create({
            header: 'About Loknagar',
            subHeader: 'by TownSeva',
            message: 'Version: 1.0.0\n\nLoknagar is a SaaS (Software as a Service) platform provided by TownSeva. It is NOT an official government or municipal application.\n\n© 2026 TownSeva. All rights reserved.',
            buttons: ['OK']
        });
        await alert.present();
    }

    contactSupport() {
        window.open('mailto:support@townseva.in?subject=TownSeva Support Request', '_system');
    }

    get isAdmin(): boolean {
        return ['ADMIN', 'OWNER', 'SYSTEM_OWNER', 'ROLE_ADMIN', 'ROLE_OWNER'].includes(this.userRole) || this.userRole.includes('ADMIN');
    }
}

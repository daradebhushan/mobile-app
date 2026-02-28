import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OwnerService } from '../../../services/owner.service';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { FileSizePipe } from '../../../core/pipes/file-size.pipe';
import { AuthService } from '../../../services/auth/auth.service';
import { LanguageService } from '../../../services/language.service';

@Component({
    selector: 'app-owner-dashboard',
    standalone: true,
    imports: [CommonModule, IonicModule, TranslatePipe, FileSizePipe],
    templateUrl: './owner-dashboard.page.html'
})
export class OwnerDashboardPageComponent implements OnInit {
    stats: any = {
        totalAdmins: 0,
        totalUsers: 0,
        activeSubscriptions: 0,
        totalDataUsageGB: 0
    };
    loading = false;

    get greetingKey(): string {
        const hour = new Date().getHours();
        if (hour < 12) return 'GREETING_MORNING';
        if (hour < 17) return 'GREETING_AFTERNOON';
        return 'GREETING_EVENING';
    }

    constructor(
        private ownerService: OwnerService,
        private authService: AuthService,
        private navCtrl: NavController,
        private alertController: AlertController,
        private languageService: LanguageService
    ) { }

    ngOnInit() {
        this.fetchStats();
    }

    handleRefresh(event: any) {
        this.fetchStats(event);
    }

    fetchStats(event: any = null) {
        if (!event) this.loading = true;
        this.ownerService.getDashboardStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.loading = false;
                if (event) event.target.complete();
            },
            error: (err) => {
                console.error('Failed to fetch owner stats', err);
                this.loading = false;
                if (event) event.target.complete();
            }
        });
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
                        await this.authService.logout();
                        this.navCtrl.navigateRoot('/login');
                    }
                }
            ]
        });
        await alert.present();
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesignationService, Designation } from '../../../services/designation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../services/language.service';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';

import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-designation-manager',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule],
    templateUrl: './designation-manager.page.html',
})
export class DesignationManagerComponent implements OnInit {
    designations: Designation[] = [];
    newDesignationName: string = '';
    loading = false;

    constructor(
        private designationService: DesignationService,
        private alertController: AlertController,
        private toastController: ToastController,
        private languageService: LanguageService,
        private location: Location,
        private router: Router
    ) { }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/admin/users']);
        }
    }

    ngOnInit() {
        this.loadDesignations();
    }

    loadDesignations() {
        this.loading = true;
        this.designationService.getAllDesignations().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.designations = res.data || [];
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    async openAddAlert() {
        const alert = await this.alertController.create({
            header: this.languageService.translate('ADD_NEW_DESIGNATION') || 'Add New Designation',
            inputs: [
                {
                    name: 'name',
                    type: 'text',
                    placeholder: 'e.g. Senior Clerk',
                    value: this.newDesignationName
                }
            ],
            buttons: [
                {
                    text: this.languageService.translate('CANCEL') || 'Cancel',
                    role: 'cancel'
                },
                {
                    text: this.languageService.translate('ADD') || 'Add',
                    handler: (data) => {
                        this.newDesignationName = data.name;
                        this.addDesignation();
                    }
                }
            ]
        });
        await alert.present();
    }

    async addDesignation() {
        if (!this.newDesignationName.trim()) return;

        this.designationService.createDesignation(this.newDesignationName).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.newDesignationName = '';
                    this.loadDesignations();
                    this.showToast(this.languageService.translate('DESIGNATION_ADDED'));
                }
            }
        });
    }

    async deleteDesignation(id: number) {
        const alert = await this.alertController.create({
            header: this.languageService.translate('CONFIRM_DELETE'),
            message: this.languageService.translate('DELETE_DESIGNATION_CONFIRM'),
            buttons: [
                { text: this.languageService.translate('CANCEL'), role: 'cancel' },
                {
                    text: this.languageService.translate('DELETE'),
                    role: 'destructive',
                    handler: () => {
                        this.designationService.deleteDesignation(id).subscribe({
                            next: () => {
                                this.loadDesignations();
                                this.showToast(this.languageService.translate('DESIGNATION_DELETED'));
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    async showToast(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            position: 'bottom'
        });
        await toast.present();
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ComplaintTypeService } from '../../../../services/complaint-type.service';
import { DepartmentService } from '../../../../services/department.service';

@Component({
    selector: 'app-complaint-type-form',
    template: `
    <ion-header>
        <ion-toolbar color="primary">
            <ion-buttons slot="start">
                <ion-back-button defaultHref="/tabs/admin/complaint-types"></ion-back-button>
            </ion-buttons>
            <ion-title>{{ isEdit ? 'Edit' : 'Create' }} Complaint Type</ion-title>
        </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
        <form (ngSubmit)="save()">
            <ion-item>
                <ion-label position="stacked">English Name <span class="text-red-500">*</span></ion-label>
                <ion-input [(ngModel)]="type.nameEn" name="nameEn" required></ion-input>
            </ion-item>

            <ion-item>
                <ion-label position="stacked">Marathi Name <span class="text-red-500">*</span></ion-label>
                <ion-textarea [(ngModel)]="type.nameMr" name="nameMr" required></ion-textarea>
            </ion-item>

            <ion-item>
                <ion-label position="stacked">Department <span class="text-red-500">*</span></ion-label>
                <ion-select [(ngModel)]="type.departmentId" name="departmentId">
                    <ion-select-option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</ion-select-option>
                </ion-select>
            </ion-item>

            <ion-item>
                <ion-label>Active</ion-label>
                <ion-toggle [(ngModel)]="type.active" name="active"></ion-toggle>
            </ion-item>
            
            <div class="mt-6 flex flex-col gap-3">
                <ion-button expand="block" type="submit" [disabled]="!canSave() || loading">
                    {{ loading ? 'Saving...' : 'Save' }}
                </ion-button>
                
                <ion-button expand="block" color="danger" fill="outline" *ngIf="isEdit" (click)="delete()" [disabled]="loading">
                    Delete
                </ion-button>
            </div>
        </form>
    </ion-content>
    `,
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class ComplaintTypeFormComponent implements OnInit {
    isEdit = false;
    typeId: number | null = null;
    type: any = { nameMr: '', nameEn: '', departmentId: null, active: true };
    departments: any[] = [];
    loading = false;

    constructor(
        private route: ActivatedRoute,
        private complaintTypeService: ComplaintTypeService,
        private departmentService: DepartmentService,
        private toastController: ToastController,
        private navCtrl: NavController
    ) { }

    ngOnInit() {
        this.loadDepartments();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit = true;
            this.typeId = +id;
            this.loadType();
        }
    }

    loadDepartments() {
        this.departmentService.getAllDepartments().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.departments = res.data.content || res.data || [];
                }
            }
        });
    }

    loadType() {
        if (!this.typeId) return;
        this.loading = true;
        this.complaintTypeService.getComplaintTypeById(this.typeId).subscribe({
            next: (res: any) => {
                this.loading = false;
                if (res.success) {
                    this.type = {
                        nameMr: res.data.nameMr || '',
                        nameEn: res.data.nameEn || '',
                        departmentId: res.data.departmentId ?? res.data.department?.id ?? null,
                        active: res.data.active !== false
                    };
                }
            },
            error: () => this.loading = false
        });
    }

    canSave(): boolean {
        return !!this.type.nameEn?.trim() && !!this.type.nameMr?.trim() && !!this.type.departmentId;
    }

    save() {
        this.loading = true;
        const obs = this.isEdit && this.typeId ?
            this.complaintTypeService.updateComplaintType(this.typeId, this.type) :
            this.complaintTypeService.createComplaintType(this.type);

        obs.subscribe({
            next: async (res: any) => {
                this.loading = false;
                const toast = await this.toastController.create({
                    message: 'Saved successfully',
                    duration: 2000,
                    color: 'success'
                });
                await toast.present();
                this.navCtrl.back();
            },
            error: async (err: any) => {
                this.loading = false;
                const toast = await this.toastController.create({
                    message: 'Failed to save',
                    duration: 2000,
                    color: 'danger'
                });
                await toast.present();
            }
        });
    }

    delete() {
        if (!this.typeId) return;
        if (!confirm('Are you sure you want to delete this complaint type?')) return;

        this.loading = true;
        this.complaintTypeService.deleteComplaintType(this.typeId).subscribe({
            next: async () => {
                this.loading = false;
                const toast = await this.toastController.create({
                    message: 'Deleted successfully',
                    duration: 2000,
                    color: 'success'
                });
                await toast.present();
                this.navCtrl.back();
            },
            error: async () => {
                this.loading = false;
                const toast = await this.toastController.create({
                    message: 'Failed to delete',
                    duration: 2000,
                    color: 'danger'
                });
                await toast.present();
            }
        });
    }
}

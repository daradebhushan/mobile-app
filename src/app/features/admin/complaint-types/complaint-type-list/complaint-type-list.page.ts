import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ComplaintTypeService, ComplaintType } from '../../../../services/complaint-type.service';

import { Location } from '@angular/common';
import { NavController } from '@ionic/angular';

@Component({
    selector: 'app-complaint-type-list',
    template: `
    <ion-header>
        <ion-toolbar color="primary">
            <ion-buttons slot="start">
                <ion-button (click)="goBack()">
                    <ion-icon name="chevron-back" slot="icon-only"></ion-icon>
                </ion-button>
            </ion-buttons>
            <ion-title>Complaint Types</ion-title>
            <ion-buttons slot="end">
                <ion-button routerLink="/tabs/admin/complaint-types/create">
                    <ion-icon name="add" slot="icon-only"></ion-icon>
                </ion-button>
            </ion-buttons>
        </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
        <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
        </ion-refresher>
        <ion-list *ngIf="types.length > 0">
            <ion-item *ngFor="let type of types; trackBy: trackById" [routerLink]="['/tabs/admin/complaint-types/edit', type.id]" button detail>
                <ion-label>
                    <h2>{{ type.nameEn || type.nameMr || 'Unnamed Complaint Type' }}</h2>
                    <p *ngIf="type.nameMr && type.nameEn && type.nameMr !== type.nameEn">{{ type.nameMr }}</p>
                    <p>{{ type.departmentName || 'No Department' }}</p>
                </ion-label>
                <ion-badge slot="end" [color]="type.active ? 'success' : 'medium'">
                    {{ type.active ? 'Active' : 'Inactive' }}
                </ion-badge>
            </ion-item>
        </ion-list>

        <div *ngIf="types.length === 0 && !loading" class="text-center mt-10 text-gray-500">
            No complaint types found.
        </div>
        
        <div *ngIf="loading" class="text-center mt-10">
            <ion-spinner></ion-spinner>
        </div>
    </ion-content>
    `,
    standalone: true,
    imports: [CommonModule, IonicModule, RouterModule]
})
export class ComplaintTypeListComponent implements OnInit {
    types: ComplaintType[] = [];
    loading = false;

    constructor(
        private complaintTypeService: ComplaintTypeService,
        private navCtrl: NavController,
        private location: Location
    ) { }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.navCtrl.navigateBack('/tabs/settings');
        }
    }

    ngOnInit() {
        this.loadTypes();
    }

    private autoRefreshInterval: any;

    ionViewWillEnter() {
        this.loadTypes(null, true);
    }

    ionViewDidEnter() {
        this.autoRefreshInterval = setInterval(() => {
            this.loadTypes(null, true);
        }, 10000);
    }

    ionViewWillLeave() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    handleRefresh(event: any) {
        this.loadTypes(event);
    }

    mergeData(newData: ComplaintType[]) {
        if (!this.types || this.types.length === 0) {
            this.types = newData;
            return;
        }

        this.types = this.types.filter(t => newData.find(n => n.id === t.id));

        newData.forEach(newItem => {
            const existingIndex = this.types.findIndex(t => t.id === newItem.id);
            if (existingIndex > -1) {
                Object.assign(this.types[existingIndex], newItem);
            } else {
                this.types.push(newItem);
            }
        });
    }

    loadTypes(event: any = null, silent: boolean = false) {
        if (!event && !silent) this.loading = true;
        this.complaintTypeService.getAllComplaintTypes().subscribe({
            next: (res: any) => {
                // Backend might return ApiResponse wrapper or List directly
                if (res.success && res.data) {
                    this.mergeData(res.data);
                } else if (Array.isArray(res)) {
                    this.mergeData(res); // Fallback
                } else {
                    this.types = [];
                }
                this.loading = false;
                if (event) event.target.complete();
            },
            error: (err) => {
                console.error('Failed to load types', err);
                this.loading = false;
                if (event) event.target.complete();
            }
        });
    }

    trackById(index: number, item: any): number {
        return item.id;
    }
}

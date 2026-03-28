import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DepartmentService } from '../../../../services/department.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { IonicModule, AlertController } from '@ionic/angular';

@Component({
    selector: 'app-department-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslatePipe, IonicModule],
    templateUrl: './department-list.page.html',
})
export class DepartmentListComponent implements OnInit {
    departments: any[] = [];

    constructor(
        private departmentService: DepartmentService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private alertController: AlertController
    ) { }

    ngOnInit(): void {
    }

    handleRefresh(event: any) {
        this.loadDepartments(event);
    }

    private autoRefreshInterval: any;

    ionViewWillEnter() {
        this.loadDepartments(null, true);
    }

    ionViewDidEnter() {
        this.autoRefreshInterval = setInterval(() => {
            this.loadDepartments(null, true);
        }, 10000);
    }

    ionViewWillLeave() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    mergeData(newData: any[]) {
        if (!this.departments || this.departments.length === 0) {
            this.departments = newData;
            return;
        }

        this.departments = this.departments.filter(d => newData.find(n => n.id === d.id));

        newData.forEach(newItem => {
            const existingIndex = this.departments.findIndex(d => d.id === newItem.id);
            if (existingIndex > -1) {
                Object.assign(this.departments[existingIndex], newItem);
            } else {
                this.departments.push(newItem);
            }
        });
    }

    loadDepartments(event: any = null, silent: boolean = false) {
        this.departmentService.getAllDepartments().subscribe({
            next: (res: any) => {
                if (res.success) {
                    const newData = res.data.content || res.data || [];
                    this.mergeData(newData);
                } else {
                    this.departments = [];
                }
                this.cdr.detectChanges();
                if (event) event.target.complete();
            },
            error: (err) => {
                console.error('Error fetching departments', err);
                if (event) event.target.complete();
            }
        });
    }

    openForm(dept: any = null) {
        if (dept) {
            this.router.navigate(['/tabs/admin/departments/edit', dept.id]);
        } else {
            this.router.navigate(['/tabs/admin/departments/create']);
        }
    }

    async deleteDepartment(id: number) {
        const alert = await this.alertController.create({
            header: 'Confirm Delete',
            message: 'Are you sure you want to delete this department?',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.departmentService.deleteDepartment(id).subscribe({
                            next: () => this.loadDepartments()
                        });
                    }
                }
            ]
        });
        await alert.present();
    }
    async seedDefaults() {
        const alert = await this.alertController.create({
            header: 'Add Defaults?',
            message: 'This will add default departments. Existing ones will be updated. Continue?',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Confirm',
                    handler: () => {
                        this.departmentService.seedDefaultDepartments().subscribe({
                            next: (res: any) => {
                                if (res && res.success) {
                                    this.loadDepartments();
                                }
                            },
                            error: (err: any) => {
                                console.error(err);
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    async cleanupInactive() {
        const alert = await this.alertController.create({
            header: 'Cleanup Inactive?',
            message: 'This will delete all inactive departments that have no assigned staff or tasks. Continue?',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Confirm',
                    role: 'destructive',
                    handler: () => {
                        this.departmentService.cleanupInactiveDepartments().subscribe({
                            next: async (res: any) => {
                                this.loadDepartments();
                                const stats = res.data || { deleted: 0, skipped: 0 };
                                const resultAlert = await this.alertController.create({
                                    header: 'Cleanup Complete',
                                    message: `Deleted: ${stats.deleted || 0}\nSkipped (Dependencies): ${stats.skipped || 0}`,
                                    buttons: ['OK']
                                });
                                await resultAlert.present();
                            },
                            error: (err) => console.error('Cleanup failed', err)
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    trackById(index: number, item: any): number {
        return item.id;
    }
}

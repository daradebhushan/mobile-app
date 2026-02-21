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

    ionViewWillEnter() {
        this.loadDepartments();
    }

    loadDepartments(event: any = null) {
        this.departmentService.getAllDepartments().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.departments = res.data.content || res.data || [];
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
}

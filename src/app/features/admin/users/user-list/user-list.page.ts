import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../services/user.service';
import { DepartmentService } from '../../../../services/department.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { IonicModule, AlertController } from '@ionic/angular';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TranslatePipe, IonicModule],
    templateUrl: './user-list.page.html',
})
export class UserListComponent implements OnInit {
    users: any[] = [];
    departments: any[] = [];
    selectedDepartmentId: number | null = null;

    constructor(
        private userService: UserService,
        private departmentService: DepartmentService,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private router: Router,
        private alertController: AlertController
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['departmentId']) {
                this.selectedDepartmentId = +params['departmentId'];
            } else {
                this.selectedDepartmentId = null;
            }
            if (this.users.length > 0) {
                this.loadUsers();
            }
        });
        this.loadDepartments();
    }

    private autoRefreshInterval: any;

    ionViewWillEnter() {
        this.loadUsers(null, true);
        this.loadDepartments();
    }

    ionViewDidEnter() {
        this.autoRefreshInterval = setInterval(() => {
            this.loadUsers(null, true);
        }, 10000);
    }

    ionViewWillLeave() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    handleRefresh(event: any) {
        this.loadUsers(event);
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

    // Smart merge to prevent UI blinking
    mergeData(newData: any[]) {
        if (!this.users || this.users.length === 0) {
            this.users = newData;
            return;
        }

        // Remove items no longer in new data
        this.users = this.users.filter(u => newData.find(n => n.id === u.id));

        // Update existing or push new
        newData.forEach(newItem => {
            const existingIndex = this.users.findIndex(u => u.id === newItem.id);
            if (existingIndex > -1) {
                // Update in place without losing reference
                Object.assign(this.users[existingIndex], newItem);
            } else {
                this.users.push(newItem);
            }
        });
    }

    loadUsers(event: any = null, silent: boolean = false) {
        const params: any = {};
        if (this.selectedDepartmentId !== null) {
            params.departmentId = this.selectedDepartmentId;
        }
        this.userService.getAllUsers(params).subscribe({
            next: (res: any) => {
                if (res.success) {
                    const newData = res.data.content || res.data || [];
                    this.mergeData(newData);
                } else {
                    this.users = [];
                }
                this.cdr.detectChanges();
                if (event) event.target.complete();
            },
            error: (err) => {
                console.error('Failed to load users', err);
                if (event) event.target.complete();
            }
        });
    }

    onFilterChange() {
        this.users = []; // explicit clear when changing filter
        this.loadUsers();
    }

    editUser(user: any) {
        this.router.navigate(['/tabs/admin/users/edit', user.id]);
    }

    async deleteUser(id: number) {
        const alert = await this.alertController.create({
            header: 'Confirm Delete',
            message: 'Are you sure you want to delete this user?',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.userService.deleteUser(id).subscribe({
                            next: () => {
                                this.loadUsers();
                            },
                            error: async (err) => {
                                const errorAlert = await this.alertController.create({
                                    header: 'Error',
                                    message: err.error?.message || 'Failed to delete user.',
                                    buttons: ['OK']
                                });
                                await errorAlert.present();
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
    }
}

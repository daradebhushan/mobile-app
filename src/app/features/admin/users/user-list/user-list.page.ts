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
    departments: any[] = [];
    selectedDepartmentId: number | null = null;
    allUsers: any[] = [];
    private autoRefreshInterval: any;
    isLoading: boolean = false;

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
                this.selectedDepartmentId = parseInt(params['departmentId'], 10);
            } else {
                this.selectedDepartmentId = null;
            }
        });
    }

    ionViewWillEnter() {
        this.allUsers = []; // clear stale data so skeleton shows
        this.loadData();
    }

    ionViewDidEnter() {
        this.autoRefreshInterval = setInterval(() => {
            if (!this.isLoading) {
                this.loadData(null, true);
            }
        }, 15000);
    }

    ionViewWillLeave() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    handleRefresh(event: any) {
        this.loadData(event, false);
    }

    async loadData(event: any = null, silent: boolean = false) {
        if (!silent) this.isLoading = true;
        try {
            // 1. Fetch departments
            const deptsRes: any = await import('rxjs').then(m => m.firstValueFrom(this.departmentService.getAllDepartments()));
            if (deptsRes.success) {
                this.departments = deptsRes.data.content || deptsRes.data || [];
            }

            // 2. Fetch users for each department + general users in parallel
            const fetchPromises: Promise<any[]>[] = [];

            // Fetch users with no department
            fetchPromises.push(
                import('rxjs').then(m => m.firstValueFrom(this.userService.getAllUsers({ departmentId: -1 }))).then(
                    (res: any) => res.success ? (res.data.content || res.data || []) : []
                ).catch(() => [])
            );

            // Fetch users for each actual department
            for (const dept of this.departments) {
                fetchPromises.push(
                    import('rxjs').then(m => m.firstValueFrom(this.userService.getAllUsers({ departmentId: dept.id }))).then(
                        (res: any) => res.success ? (res.data.content || res.data || []) : []
                    ).catch(() => [])
                );
            }

            const results = await Promise.all(fetchPromises);

            let combinedUsers: any[] = [];
            for (const userArray of results) {
                if (Array.isArray(userArray)) {
                    combinedUsers = combinedUsers.concat(userArray);
                }
            }

            // Deduplicate across results (just in case)
            const uniqueUsersMap = new Map();
            combinedUsers.forEach(u => uniqueUsersMap.set(u.id, u));
            this.allUsers = Array.from(uniqueUsersMap.values());

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            this.isLoading = false;
            this.cdr.detectChanges();
            if (event) event.target.complete();
        }
    }

    get currentUsers() {
        if (this.selectedDepartmentId == null || this.selectedDepartmentId === 'null' as any || (this.selectedDepartmentId as any) === 'ALL') {
            return this.allUsers;
        } else if (this.selectedDepartmentId == -1) {
            return this.allUsers.filter(u => !u.department);
        } else {
            const numId = Number(this.selectedDepartmentId);
            return this.allUsers.filter(u => u.department?.id === numId);
        }
    }

    onFilterChange() {
        this.cdr.detectChanges();
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
                                this.loadData();
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

    trackById(index: number, item: any): number {
        return item.id;
    }
}

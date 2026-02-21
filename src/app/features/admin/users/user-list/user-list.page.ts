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

    ionViewWillEnter() {
        this.loadUsers();
        this.loadDepartments();
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

    loadUsers(event: any = null) {
        const params: any = {};
        if (this.selectedDepartmentId) {
            params.departmentId = this.selectedDepartmentId;
        }
        this.userService.getAllUsers(params).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.users = res.data.content || res.data || [];
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
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
    }
}

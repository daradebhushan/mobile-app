import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../services/user.service';
import { DepartmentService } from '../../../../services/department.service';
import { DesignationService } from '../../../../services/designation.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { IonicModule, NavController } from '@ionic/angular';
import { LanguageService } from '../../../../services/language.service';
import { ActivatedRoute } from '@angular/router';

import { Location } from '@angular/common';

@Component({
    selector: 'app-user-form-page',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule],
    templateUrl: './user-form.page.html',
})
export class UserFormPageComponent implements OnInit {
    isEditMode = false;
    userId: number | null = null;
    departments: any[] = [];

    // Form Model
    userForm: any = {
        name: '',
        email: '',
        role: 'STAFF',
        departmentId: null,
        designation: '',
        password: '',
        mobile: '' // Optional
    };

    loading = false;
    error: string | null = null;

    showAddDept = false;
    newDeptName = '';
    roles = ['DEPARTMENT_HEAD', 'STAFF'];
    constructor(
        private userService: UserService,
        private departmentService: DepartmentService,
        private designationService: DesignationService,
        private route: ActivatedRoute,
        private navCtrl: NavController,
        private location: Location,
        private cdr: ChangeDetectorRef,
        public langService: LanguageService
    ) { }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.navCtrl.navigateBack('/tabs/admin/users');
        }
    }

    ionViewWillEnter() {
        this.resetForm();
        this.loadDepartments();

        const paramId = this.route.snapshot.paramMap.get('userId');
        if (paramId) {
            this.userId = +paramId;
            this.isEditMode = true;
            this.loadUser(this.userId);
        } else {
            // Create mode
        }
    }

    resetForm() {
        this.userForm = {
            name: '',
            email: '',
            role: 'STAFF',
            departmentId: null,
            designation: '',
            password: '',
            mobile: ''
        };
        this.isEditMode = false;
        this.userId = null;
        this.error = null;
    }

    ngOnInit() { }

    loadDepartments() {
        this.departmentService.getAllDepartments().subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.departments = res.data.content || res.data || [];
                }
            }
        });
    }

    toggleAddDept() {
        this.showAddDept = !this.showAddDept;
        if (!this.showAddDept) this.newDeptName = '';
    }

    saveNewDepartment() {
        if (!this.newDeptName) return;

        const deptData = { name: this.newDeptName };

        this.departmentService.createDepartment(deptData).subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadDepartments();
                    const newDept = res.data;
                    this.userForm.departmentId = newDept.id;
                    this.showAddDept = false;
                    this.newDeptName = '';
                }
            },
            error: (err) => console.error('Error creating department', err)
        });
    }

    loadUser(id: number) {
        this.userService.getUserById(id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    const u = res.data;
                    this.userForm = {
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        departmentId: u.department?.id || null,
                        designation: u.designation || '',
                        mobile: u.mobile || '',
                        password: '' // Don't show password
                    };
                    console.log('User loaded:', this.userForm);
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error(err)
        });
    }

    saveUser() {
        if (!this.userForm.name || !this.userForm.email) {
            this.error = 'Please fill in required fields.';
            return;
        }

        this.loading = true;
        this.error = null;

        // Default password for new users if not provided
        if (!this.isEditMode && !this.userForm.password) {
            this.userForm.password = 'Welcome@123';
        }

        if (this.isEditMode && this.userId) {
            // Update
            // Remove password if empty
            const payload = { ...this.userForm };
            if (!payload.password) delete payload.password;

            // Strictly parse IDs to numbers or null to avoid Jackson TypeMismatchException 400 Bad Request
            const deptId = payload.departmentId && payload.departmentId !== 'null' ? parseInt(payload.departmentId, 10) : null;

            payload.departmentId = deptId;

            // Add clear flags for backend explicit nullification
            payload.clearDepartment = deptId === null;
            payload.clearDesignation = !payload.designation || payload.designation.trim() === '';

            console.error('PAYLOAD BEING SENT TO BACKEND:', JSON.stringify(payload));
            this.userService.updateUser(this.userId, payload).subscribe({
                next: (res: any) => {
                    if (res.success) {
                        this.navCtrl.navigateBack('/tabs/admin/users');
                    } else {
                        this.error = res.message;
                    }
                    this.loading = false;
                    this.cdr.detectChanges(); // Force UI update
                },
                error: (err) => {
                    this.error = 'Update failed: ' + (err.error?.message || err.message);
                    this.loading = false;
                    this.cdr.detectChanges(); // Force UI update to exit 'Saving...' state
                }
            });
        } else {
            const payload = { ...this.userForm };
            payload.departmentId = payload.departmentId && payload.departmentId !== 'null' ? parseInt(payload.departmentId, 10) : null;

            this.userService.createUser(payload).subscribe({
                next: (res: any) => {
                    if (res.success) {
                        this.navCtrl.navigateBack('/tabs/admin/users');
                    } else {
                        this.error = res.message;
                    }
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.error = err.error?.message || 'Creation failed: Email might be taken.';
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { DepartmentService } from '../../../services/department.service';
import { UserService } from '../../../services/user.service';
import { ComplaintService } from '../../../services/complaint.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Location } from '@angular/common';

@Component({
    selector: 'app-task-form',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule],
    templateUrl: './task-form.page.html',
})
export class TaskFormComponent implements OnInit {
    isEditMode = false;
    taskId: number | null = null;
    departments: any[] = [];
    staffList: any[] = [];
    showAllStaff = false;
    loading = false; // Unified loading state
    complaint: any = null; // For reference display

    taskForm: any = {
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'TO_DO',
        type: 'Internal',
        departmentId: null,
        assignedStaffId: null,
        dueDate: new Date().toISOString(),
        files: [],
        complaintId: null
    };

    constructor(
        private taskService: TaskService,
        private departmentService: DepartmentService,
        private userService: UserService,
        private complaintService: ComplaintService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private loadingController: LoadingController, // Keep for save actions
        private toastController: ToastController,
        private cdr: ChangeDetectorRef
    ) { }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/tasks']);
        }
    }

    ngOnInit() {}

    ionViewWillEnter() {
        this.loading = true;

        // Load Departments, Users, and Tasks in Parallel with graceful fallback
        forkJoin({
            depts: this.departmentService.getAllDepartments().pipe(
                catchError((err: any) => {
                    console.error('Failed loading departments', err);
                    return of({ success: false, data: [] });
                })
            ),
            users: this.userService.getAllUsers({ size: 1000 }).pipe(
                catchError((err: any) => {
                    console.error('Failed loading users', err);
                    return of({ success: false, data: [] });
                })
            ),
            fallbackTasks: this.taskService.getTasks().pipe(
                catchError(() => of({ success: false, data: [] }))
            )
        }).subscribe({
            next: (results: any) => {
                // Process Departments
                if (results.depts.success) {
                    this.departments = results.depts.data.content || results.depts.data || [];
                }

                // Process Users (Primary)
                if (results.users.success && results.users.data) {
                    this.staffList = results.users.data.content || results.users.data || [];
                } else if (results.fallbackTasks.success) {
                    // EMERGENCY FALLBACK: Extract unique staff from existing tasks
                    // since the backend /api/admin/users is crashing
                    console.warn('Backend users API failed. Extracting staff dynamically from existing tasks...');
                    const allTasks = results.fallbackTasks.data.content || results.fallbackTasks.data || [];
                    const extractedStaffMap = new Map();
                    allTasks.forEach((t: any) => {
                        if (t.assignedStaff && t.assignedStaff.id) {
                            extractedStaffMap.set(t.assignedStaff.id, {
                                id: t.assignedStaff.id,
                                name: t.assignedStaff.name,
                                role: 'STAFF', // Assume STAFF for fallback purposes
                                department: t.department
                            });
                        }
                    });
                    this.staffList = Array.from(extractedStaffMap.values());
                }

                this.loading = false;

                // Check for Task ID after reference data is loaded
                this.taskId = Number(this.route.snapshot.paramMap.get('taskId'));
                if (this.taskId) {
                    this.isEditMode = true;
                    this.loadTask(this.taskId);
                } else {
                    // Check for Query Params (e.g. from Complaint)
                    const params = this.route.snapshot.queryParams;
                    if (params['description']) {
                        this.taskForm.description = params['description'];
                    }
                    if (params['departmentId']) {
                        this.taskForm.departmentId = Number(params['departmentId']);
                        // Trigger logic to filter staff
                        this.onDepartmentChange();
                    }
                    if (params['title']) { // Optional support
                        this.taskForm.title = params['title'];
                    }
                    if (params['fromComplaintId']) {
                        this.taskForm.complaintId = Number(params['fromComplaintId']);
                        this.taskForm.type = 'Complaint'; // Auto-set Type

                        // Fetch full complaint for reference display
                        this.complaintService.getComplaintById(this.taskForm.complaintId).subscribe({
                            next: (c) => this.complaint = c,
                            error: (e) => console.error('Failed to load complaint ref', e)
                        });
                    }
                }
            },
            error: (err) => {
                console.error('Error loading reference data', err);
                this.loading = false;
                this.showToast('Failed to load data. Please refresh.', 'danger');
            }
        });
    }

    get filteredStaffList() {
        // Filter roles first (Parity with Web App)
        const validRoles = ['STAFF', 'DEPT_HEAD', 'DEPARTMENT_HEAD'];

        // If "Show All" is checked, return all valid staff
        if (this.showAllStaff) {
            return this.staffList.filter(u => validRoles.includes(u.role));
        }

        // Otherwise, require Department ID
        if (!this.taskForm.departmentId) return [];

        const deptId = Number(this.taskForm.departmentId);
        return this.staffList.filter(u => {
            const userDeptId = u.department?.id;
            return validRoles.includes(u.role) && userDeptId === deptId;
        });
    }

    onDepartmentChange() {
        // Reset assignment if current staff is not in new department and not showing all
        if (!this.showAllStaff) {
            this.taskForm.assignedStaffId = null;
        }
    }

    loadTask(id: number) {
        this.taskService.getTaskById(id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    const task = res.data;
                    this.taskForm = {
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        status: task.status,
                        type: task.type || 'Internal',
                        departmentId: task.departmentId || task.department?.id || null,
                        assignedStaffId: task.assignedStaffId || task.assignedStaff?.id || null,
                        dueDate: task.dueDate
                    };

                    // Robustness: Handle missing Department in list
                    if ((task.department || task.departmentId) && this.taskForm.departmentId) {
                        const exists = this.departments.find(d => d.id === this.taskForm.departmentId);
                        if (!exists) {
                            console.warn(`Department ${this.taskForm.departmentId} not in list. Appending.`);
                            this.departments.push(task.department || { id: task.departmentId, name: task.departmentName || 'Department' });
                        }
                    }

                    // Robustness: Handle missing Staff in list
                    if ((task.assignedStaff || task.assignedStaffId) && this.taskForm.assignedStaffId) {
                        const exists = this.staffList.find(u => u.id === this.taskForm.assignedStaffId);
                        if (!exists) {
                            console.warn(`Staff ${this.taskForm.assignedStaffId} not in list. Appending.`);
                            this.staffList.push(task.assignedStaff || { id: task.assignedStaffId, name: task.assignedStaffName || 'Staff', role: 'STAFF' });
                        }
                    }

                    // Auto-enable showAllStaff if assigned staff is from different department
                    // or if they would be hidden by the current filter
                    if (this.taskForm.assignedStaffId) {
                        const currentlyVisible = this.filteredStaffList.find(u => u.id === this.taskForm.assignedStaffId);
                        if (!currentlyVisible) {
                            console.warn('Assigned staff hidden by filter. Auto-enabling Show All Staff.');
                            this.showAllStaff = true;
                        }
                    }

                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error('Error loading task', err);
                this.showToast('Failed to load task details', 'danger');
            }
        });
    }

    // File Handling
    onFileSelected(event: any) {
        this.taskForm.files = event.target.files;
    }

    async saveTask() {
        const loading = await this.loadingController.create({
            message: this.isEditMode ? 'Updating task...' : 'Creating task...',
            spinner: 'crescent'
        });
        await loading.present();

        const payload = { ...this.taskForm };
        // Ensure dueDate is legitimate ISO string; Ionic datetime usually gives ISO. 
        // We keep the 'T' for backend LocalDateTime compatibility.
        // We just ensure we don't send empty string if it's null.
        if (!payload.dueDate) {
            delete payload.dueDate;
        }
        delete payload.files;

        const errorHandler = async (err: any) => {
            await loading.dismiss();
            let msg = 'Failed to save task. Please try again.';
            if (err.error && err.error.message) {
                msg = err.error.message;
            } else if (err.message) {
                msg = err.message;
            }

            this.showToast(msg, 'danger');
            console.error('Save task error:', err);
        };

        if (this.isEditMode && this.taskId) {
            this.taskService.updateTask(this.taskId, payload).subscribe({
                next: async (res: any) => {
                    await loading.dismiss();
                    if (res.success) {
                        this.uploadFilesAndNavigate(this.taskId!);
                    } else {
                        errorHandler({ message: res.message || 'Unknown error' });
                    }
                },
                error: errorHandler
            });
        } else {
            this.taskService.createTask(payload).subscribe({
                next: async (res: any) => {
                    await loading.dismiss();
                    if (res.success && res.data && res.data.id) {
                        this.uploadFilesAndNavigate(res.data.id);
                    } else if (res.success) {
                        this.router.navigate(['/tabs/tasks']);
                    } else {
                        errorHandler({ message: res.message || 'Unknown error' });
                    }
                },
                error: errorHandler
            });
        }
    }

    uploadFilesAndNavigate(taskId: number) {
        const handleNavigation = () => {
            if (!this.isEditMode) {
                // Trigger notification for new tasks
                this.taskService.notifyTaskCreated(taskId).subscribe({
                    next: () => console.log('Notification triggered'),
                    error: (e) => console.error('Notification failed', e),
                    complete: () => this.router.navigate(['/tabs/tasks', taskId], { replaceUrl: true })
                });
            } else {
                this.router.navigate(['/tabs/tasks', taskId], { replaceUrl: true });
            }
        };

        if (this.taskForm.files && this.taskForm.files.length > 0) {
            this.taskService.uploadAttachments(taskId, this.taskForm.files).subscribe({
                next: () => handleNavigation(),
                error: (err) => {
                    console.error('Failed to upload files', err);
                    handleNavigation();
                }
            });
        } else {
            handleNavigation();
        }
    }

    async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            color,
            position: 'bottom'
        });
        await toast.present();
    }
}

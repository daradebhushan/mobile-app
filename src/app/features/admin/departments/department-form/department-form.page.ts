import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService, Department } from '../../../../services/department.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-department-form-page',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule],
    templateUrl: './department-form.page.html',
})
export class DepartmentFormPageComponent implements OnInit {
    isEditMode = false;
    departmentId: number | null = null;
    name: string = '';
    nameMr: string = '';
    active: boolean = true;
    loading = false;
    error: string | null = null;
    subQuestions: string[] = [];
    newSubQuestion: string = '';

    constructor(
        private departmentService: DepartmentService,
        private route: ActivatedRoute,
        private navCtrl: NavController,
        private cdr: ChangeDetectorRef
    ) { }

    ionViewWillEnter() {
        // Reset state
        this.isEditMode = false;
        this.departmentId = null;
        this.name = '';
        this.nameMr = '';
        this.subQuestions = [];
        this.newSubQuestion = '';
        this.active = true;

        const id = this.route.snapshot.paramMap.get('deptId');
        if (id && id !== 'create') {
            this.departmentId = Number(id);
            this.isEditMode = true;
            this.loadDepartment(this.departmentId);
        }
    }

    ngOnInit() { }

    loadDepartment(id: number) {
        this.departmentService.getDepartmentById(id).subscribe({
            next: (res: any) => {
                if (res.success && res.data) {
                    this.name = res.data.name;
                    this.nameMr = res.data.nameMr || '';
                    if (res.data.active !== undefined) {
                        this.active = res.data.active;
                    }
                    if (res.data.subQuestions) {
                        try {
                            if (typeof res.data.subQuestions === 'string') {
                                this.subQuestions = JSON.parse(res.data.subQuestions);
                            } else if (Array.isArray(res.data.subQuestions)) {
                                this.subQuestions = res.data.subQuestions;
                            }
                        } catch (e) {
                            console.error('Failed to parse subQuestions', e);
                            this.subQuestions = [];
                        }
                    }
                    this.cdr.detectChanges();
                }
            },
            error: (err) => console.error('Error loading department', err)
        });
    }

    addSubQuestion() {
        if (this.newSubQuestion.trim()) {
            this.subQuestions.push(this.newSubQuestion.trim());
            this.newSubQuestion = '';
        }
    }

    removeSubQuestion(index: number) {
        this.subQuestions.splice(index, 1);
    }

    saveDepartment() {
        if (!this.name.trim()) return;
        this.loading = true;
        this.error = null;

        const payload = {
            name: this.name,
            nameMr: this.nameMr,
            active: this.active,
            subQuestions: JSON.stringify(this.subQuestions) // Convert to JSON String for Backend
        };

        if (this.isEditMode && this.departmentId) {
            this.departmentService.updateDepartment(this.departmentId, payload).subscribe({
                next: (res: any) => {
                    if (res.success) {
                        this.navCtrl.navigateBack('/tabs/admin/departments');
                    } else {
                        this.error = res.message;
                    }
                    this.loading = false;
                },
                error: () => {
                    this.error = 'Failed to update department.';
                    this.loading = false;
                }
            });
        } else {
            this.departmentService.createDepartment(payload).subscribe({
                next: (res: any) => {
                    if (res.success) {
                        this.navCtrl.navigateBack('/tabs/admin/departments');
                    } else {
                        this.error = res.message;
                    }
                    this.loading = false;
                },
                error: () => {
                    this.error = 'Failed to create department.';
                    this.loading = false;
                }
            });
        }
    }
}

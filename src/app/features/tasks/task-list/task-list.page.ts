import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { TaskService, Task } from '../../../services/task.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TranslatePipe, IonicModule],
    templateUrl: './task-list.page.html',
    styles: [`
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
  `]
})
export class TaskListComponent implements OnInit, OnDestroy {
    tasks: Task[] = [];
    priorityFilter: string = '';
    statusFilter: string = '';
    searchText: string = '';
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    private queryParamSub?: Subscription;
    private loadTasksSub?: Subscription;
    currentUser: any = null;

    currentPage: number = 0;
    pageSize: number = 10;
    totalPages: number = 0;
    totalElements: number = 0;

    activeTab: string = 'FILTER_ALL';
    taskType: string = '';
    isLoading: boolean = false;
    assignedToMe: boolean = false;
    fromCo: boolean = false;
    departmentId: number | null = null;

    tabs = [
        { label: 'FILTER_ALL', count: 0 },
        { label: 'FILTER_PENDING', count: 0 },
        { label: 'FILTER_IN_PROGRESS', count: 0 },
        { label: 'FILTER_ON_HOLD', count: 0 },
        { label: 'FILTER_COMPLETED', count: 0 }
    ];

    private autoRefreshInterval: any;

    constructor(
        private taskService: TaskService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private route: ActivatedRoute,
        private toastController: ToastController,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.currentUser = this.authService.currentUserValue;
        this.setupSearchSubscription();
        this.subscribeToQueryParams();
    }

    private subscribeToQueryParams(): void {
        // Unsubscribe from any previous subscription first
        if (this.queryParamSub) {
            this.queryParamSub.unsubscribe();
        }
        this.queryParamSub = this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                // Read all filter params
                if (params['status']) {
                    this.statusFilter = params['status'];
                    if (this.statusFilter === 'TO_DO') this.activeTab = 'FILTER_PENDING';
                    else if (this.statusFilter === 'IN_PROGRESS') this.activeTab = 'FILTER_IN_PROGRESS';
                    else if (this.statusFilter === 'ON_HOLD') this.activeTab = 'FILTER_ON_HOLD';
                    else if (this.statusFilter === 'COMPLETED') this.activeTab = 'FILTER_COMPLETED';
                    else this.activeTab = 'FILTER_ALL';
                } else {
                    this.statusFilter = '';
                    this.activeTab = 'FILTER_ALL';
                }
                this.priorityFilter = params['priority'] || '';
                this.taskType = params['type'] || '';
                this.assignedToMe = params['assignedToMe'] === 'true';
                this.fromCo = params['fromCo'] === 'true';
                this.departmentId = params['departmentId'] ? +params['departmentId'] : null;

                // Reset to page 0 on any param change
                this.currentPage = 0;
                this.loadTasks();
            });
    }

    get canCreateTask(): boolean {
        const roles = this.currentUser?.roles || [];
        const role = this.currentUser?.role;
        return role === 'OWNER' || role === 'ADMIN' || role === 'CHIEF_OFFICER' ||
            roles.includes('ROLE_OWNER') || roles.includes('OWNER') ||
            roles.includes('ROLE_ADMIN') || roles.includes('ADMIN') ||
            roles.includes('ROLE_CHIEF_OFFICER') || roles.includes('CHIEF_OFFICER');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.queryParamSub) this.queryParamSub.unsubscribe();
        if (this.loadTasksSub) this.loadTasksSub.unsubscribe();
    }

    ionViewWillEnter() {
        this.currentUser = this.authService.currentUserValue;
        // Reset to first page and clear list so loader shows fresh content
        this.currentPage = 0;
        this.tasks = [];
        this.loadTasks();
    }

    ionViewDidEnter() {
        if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = setInterval(() => {
            this.loadTasks(null, true);
        }, 10000);
    }

    ionViewWillLeave() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        // Cancel any in-flight load request when leaving
        if (this.loadTasksSub) {
            this.loadTasksSub.unsubscribe();
            this.loadTasksSub = undefined;
        }
    }

    handleRefresh(event: any) {
        this.currentPage = 0;
        this.loadTasks(event);
    }

    private setupSearchSubscription(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(searchText => {
            this.searchText = searchText;
            this.currentPage = 0;
            this.tasks = [];
            this.loadTasks();
        });
    }

    onSearch(searchValue: string): void {
        this.searchSubject.next(searchValue);
    }

    setType(type: string) {
        this.taskType = type;
        this.currentPage = 0;
        this.tasks = [];
        this.loadTasks();
    }

    setTab(tabName: string) {
        this.activeTab = tabName;
        switch (tabName) {
            case 'FILTER_PENDING': this.statusFilter = 'TO_DO'; break;
            case 'FILTER_IN_PROGRESS': this.statusFilter = 'IN_PROGRESS'; break;
            case 'FILTER_ON_HOLD': this.statusFilter = 'ON_HOLD'; break;
            case 'FILTER_COMPLETED': this.statusFilter = 'COMPLETED'; break;
            default: this.statusFilter = ''; break;
        }
        this.currentPage = 0;
        this.tasks = [];
        this.loadTasks();
    }

    onStatusFilterChange() {
        switch (this.statusFilter) {
            case 'TO_DO': this.activeTab = 'FILTER_PENDING'; break;
            case 'IN_PROGRESS': this.activeTab = 'FILTER_IN_PROGRESS'; break;
            case 'ON_HOLD': this.activeTab = 'FILTER_ON_HOLD'; break;
            case 'COMPLETED': this.activeTab = 'FILTER_COMPLETED'; break;
            default: this.activeTab = 'FILTER_ALL'; break;
        }
        this.currentPage = 0;
        this.tasks = [];
        this.loadTasks();
    }

    mergeData(newData: Task[]) {
        if (this.currentPage === 0) {
            this.tasks = newData;
            return;
        }
        newData.forEach(newItem => {
            const existingIndex = this.tasks.findIndex(t => t.id === newItem.id);
            if (existingIndex > -1) {
                this.tasks[existingIndex] = { ...this.tasks[existingIndex], ...newItem };
            } else {
                this.tasks.push(newItem);
            }
        });
    }

    loadTasks(event: any = null, silent: boolean = false) {
        // Cancel any existing in-flight request
        if (this.loadTasksSub) {
            this.loadTasksSub.unsubscribe();
            this.loadTasksSub = undefined;
        }

        // Show loader unless it's a silent background refresh or pull-to-refresh
        if (!event && !silent) {
            this.isLoading = true;
            this.cdr.detectChanges();
        }

        const filters: any = {
            page: this.currentPage,
            size: this.pageSize,
            sort: 'id,desc'
        };
        if (this.taskType && this.taskType !== '') filters.type = this.taskType;
        if (this.priorityFilter && this.priorityFilter !== '') filters.priority = this.priorityFilter;
        if (this.statusFilter && this.statusFilter !== '') filters.status = this.statusFilter;
        if (this.searchText && this.searchText !== '') filters.search = this.searchText.trim();
        if (this.assignedToMe) filters.assignedStaffId = this.authService.currentUserValue?.id;
        if (this.fromCo) filters.fromCo = true;
        if (this.departmentId) filters.departmentId = this.departmentId;

        this.loadTasksSub = this.taskService.getTasks(filters).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res.success) {
                    const newData = res.data.content || [];
                    this.mergeData(newData);
                    this.totalPages = res.data.totalPages;
                    this.totalElements = res.data.totalElements;
                    this.updateTabCounts();
                }
                this.cdr.detectChanges();
                if (event) event.target.complete();
            },
            error: async (err: any) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                console.error('Error fetching tasks', err);
                const toast = await this.toastController.create({
                    message: `Failed to load tasks`,
                    duration: 3000,
                    color: 'danger',
                    position: 'bottom'
                });
                await toast.present();
                if (event) event.target.complete();
            }
        });
    }

    updateTabCounts() {
        const fetchCount = (status: string, tabLabel: string) => {
            const filters: any = { page: 0, size: 1, sort: 'id,desc' };
            if (this.taskType && this.taskType !== '') filters.type = this.taskType;
            if (this.priorityFilter) filters.priority = this.priorityFilter;
            if (this.searchText) filters.search = this.searchText;
            if (status) filters.status = status;

            this.taskService.getTasks(filters).subscribe((res: any) => {
                if (res.success) {
                    const tab = this.tabs.find(t => t.label === tabLabel);
                    if (tab) {
                        tab.count = res.data.totalElements;
                        this.cdr.detectChanges();
                    }
                }
            });
        };

        fetchCount('', 'FILTER_ALL');
        fetchCount('TO_DO', 'FILTER_PENDING');
        fetchCount('IN_PROGRESS', 'FILTER_IN_PROGRESS');
        fetchCount('ON_HOLD', 'FILTER_ON_HOLD');
        fetchCount('COMPLETED', 'FILTER_COMPLETED');
    }

    openTask(task: Task) {
        this.router.navigate(['/tabs/tasks', task.id]);
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.loadTasks();
        }
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadTasks();
        }
    }

    isOverdue(task: Task): boolean {
        if (!task.dueDate || task.status === 'COMPLETED') return false;
        return new Date(task.dueDate) < new Date();
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'COMPLETED': return 'bg-green-50 text-green-600 border-green-100';
            case 'ON_HOLD': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    }

    trackByTaskId(index: number, task: Task): number {
        return task.id;
    }
}

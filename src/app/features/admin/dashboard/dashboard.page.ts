import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { UserService } from '../../../services/user.service';
import { DashboardService } from '../../../services/dashboard.service';
import { AuthService } from '../../../services/auth/auth.service';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  stats: any = {
    totalTasks: 0,
    toDoTasks: 0,
    inProgressTasks: 0,
    onHoldTasks: 0,
    completedTasks: 0,
    totalUsers: 0,
    totalDepartments: 0,
    directToDoTasks: 0
  };

  complaintTasks: number = 0;
  staffDistribution: any[] = [];
  reportData: any = null;
  employeeIdForReport: number | null = null;
  allUsers: any[] = [];
  currentUser: any = null;
  ownerStats: any = null;

  constructor(
    private router: Router,
    private taskService: TaskService,
    private userService: UserService,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
  }

  get greetingKey(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'GREETING_MORNING';
    if (hour < 17) return 'GREETING_AFTERNOON';
    return 'GREETING_EVENING';
  }

  handleRefresh(event: any) {
    this.loadStats();
    if (this.isAdmin || this.isOwner) {
      this.loadUsers();
    }
    if (this.isOwner) {
      this.loadOwnerStats();
    }

    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  ionViewWillEnter() {
    this.currentUser = this.authService.currentUserValue;
    this.loadStats();
    if (this.isAdmin || this.isOwner) {
      this.loadUsers();
    }
    if (this.isOwner) {
      this.loadOwnerStats();
    }
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allUsers = res.data.content || res.data || [];
        }
      }
    });
  }

  loadStats() {
    this.dashboardService.getAdminStats().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.stats = res.data;
          this.complaintTasks = res.data.complaintTasks || 0;
        } else if (res) {
          this.stats = res;
          this.complaintTasks = res.complaintTasks || 0;
        }

        if (this.stats && this.stats.departmentStats) {
          this.staffDistribution = this.stats.departmentStats.map((dept: any) => ({
            name: dept.name,
            count: dept.count,
            id: dept.id
          }));
        }
      },
      error: (err) => console.error('Failed to load dashboard stats', err)
    });
  }

  loadOwnerStats() {
    this.dashboardService.getOwnerStats().subscribe({
      next: (res: any) => {
        this.ownerStats = res.data || res;
      },
      error: (err) => console.error('Failed to load owner stats', err)
    });
  }

  navigateTo(path: string, queryParams: any = {}) {
    this.router.navigate([path], { queryParams: queryParams });
  }

  generateReport(empId: any) {
    if (!empId) return;
    this.dashboardService.getEmployeeReport(+empId).subscribe({
      next: (data) => this.reportData = data,
      error: (err) => console.error('Failed to load report', err)
    });
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN' || this.currentUser?.roles?.includes('ROLE_ADMIN') || this.currentUser?.roles?.includes('ADMIN');
  }

  get isOwner(): boolean {
    return this.currentUser?.role === 'OWNER' || this.currentUser?.roles?.includes('ROLE_OWNER') || this.currentUser?.roles?.includes('OWNER');
  }

  get isDeptHead(): boolean {
    return this.currentUser?.role === 'DEPARTMENT_HEAD' || this.currentUser?.roles?.includes('ROLE_DEPARTMENT_HEAD') || this.currentUser?.roles?.includes('DEPARTMENT_HEAD');
  }

  get isStaff(): boolean {
    return this.currentUser?.role === 'STAFF' || this.currentUser?.roles?.includes('ROLE_STAFF') || this.currentUser?.roles?.includes('STAFF');
  }

  async sendReport() {
    const toast = await this.toastController.create({
      message: 'Generating and sending report...',
      duration: 2000,
      position: 'bottom',
      color: 'primary'
    });
    await toast.present();

    this.dashboardService.emailAdminReport().subscribe({
      next: async (res) => {
        const successToast = await this.toastController.create({
          message: 'Report sent successfully to your email!',
          duration: 3000,
          position: 'bottom',
          color: 'success'
        });
        await successToast.present();
      },
      error: async (err) => {
        const errorToast = await this.toastController.create({
          message: 'Failed to send report. Please try again.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await errorToast.present();
      }
    });
  }

  async logout() {
    const loading = await this.loadingController.create({
      message: 'Signing out securely...',
      spinner: 'crescent',
      duration: 1500,
      cssClass: 'premium-logout-spinner',
      showBackdrop: true
    });
    await loading.present();

    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}

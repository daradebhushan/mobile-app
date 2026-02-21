import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { DashboardService } from '../../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  stats: any = null;
  user: any = null;
  isLoading = false;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user = this.authService.currentUserValue;
    this.loadStats();
  }

  handleRefresh(event: any) {
    this.loadStats();
    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  loadStats() {
    this.isLoading = true;
    this.dashboardService.getDeptHeadStats().subscribe({
      next: (res: any) => {
        this.stats = res.data || res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load stats', err);
        this.isLoading = false;
      }
    });
  }

  navigateTo(path: string, queryParams: any = {}) {
    this.router.navigate([path], { queryParams: queryParams });
  }
}

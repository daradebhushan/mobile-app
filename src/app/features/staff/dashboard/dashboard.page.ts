import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  userName = 'Ramesh';
  stats: any = {
    totalTasks: 25,
    toDoTasks: 3,
    inProgressTasks: 2,
    completedTasks: 20
  };

  constructor(private authService: AuthService) { }

  get greetingKey(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'GREETING_MORNING';
    if (hour < 17) return 'GREETING_AFTERNOON';
    return 'GREETING_EVENING';
  }

  logout() {
    this.authService.logout();
  }

  // Mock data to match Frontend
  chartData = [
    { label: 'Jul', value: 8, height: '40%', color: 'bg-blue-500' },
    { label: 'Aug', value: 12, height: '60%', color: 'bg-blue-500' },
    { label: 'Sep', value: 15, height: '75%', color: 'bg-blue-500' },
    { label: 'Oct', value: 10, height: '50%', color: 'bg-blue-500' },
    { label: 'Nov', value: 18, height: '90%', color: 'bg-blue-500' },
    { label: 'Dec', value: 20, height: '100%', color: 'bg-orange-500' }
  ];

  ngOnInit() {
  }

  handleRefresh(event: any) {
    // Simulate refresh for mock data
    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

}

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [

  {
    path: 'login',
    loadChildren: () => import('./features/auth/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./features/auth/forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule)
  },
  {
    path: 'reset-password',
    loadChildren: () => import('./features/auth/reset-password/reset-password.module').then(m => m.ResetPasswordPageModule)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'home',
        loadChildren: () => import('./features/admin/dashboard/dashboard.module').then(m => m.DashboardPageModule),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_DEPARTMENT_HEAD', 'ROLE_STAFF', 'ADMIN', 'DEPARTMENT_HEAD', 'STAFF', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'owner/dashboard',
        loadComponent: () => import('./features/owner/dashboard/owner-dashboard.page').then(m => m.OwnerDashboardPageComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_OWNER', 'OWNER'] }
      },
      {
        path: 'owner/admin-management',
        loadComponent: () => import('./features/owner/admin-management/admin-management.page').then(m => m.AdminManagementPageComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_OWNER', 'OWNER'] }
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/task-list/task-list.page').then(m => m.TaskListComponent)
      },
      // IMPORTANT: literal sub-paths MUST come before :taskId wildcard
      {
        path: 'tasks/create',
        loadComponent: () => import('./features/tasks/task-form/task-form.page').then(m => m.TaskFormComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'tasks/edit/:taskId',
        loadComponent: () => import('./features/tasks/task-form/task-form.page').then(m => m.TaskFormComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'tasks/board',
        loadComponent: () => import('./features/tasks/task-board/task-board.page').then(m => m.TaskBoardPageComponent)
      },
      {
        path: 'tasks/:taskId',
        loadComponent: () => import('./features/tasks/task-detail/task-detail.page').then(m => m.TaskDetailComponent)
      },
      {
        path: 'complaints',
        loadComponent: () => import('./features/complaints/complaint-list/complaint-list.page').then(m => m.ComplaintListComponent)
      },

      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/users/user-list/user-list.page').then(m => m.UserListComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/users/create',
        loadComponent: () => import('./features/admin/users/user-form/user-form.page').then(m => m.UserFormPageComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/users/edit/:userId',
        loadComponent: () => import('./features/admin/users/user-form/user-form.page').then(m => m.UserFormPageComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/departments',
        loadComponent: () => import('./features/admin/departments/department-list/department-list.page').then(m => m.DepartmentListComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/departments/create',
        loadComponent: () => import('./features/admin/departments/department-form/department-form.page').then(m => m.DepartmentFormPageComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/departments/edit/:deptId',
        loadComponent: () => import('./features/admin/departments/department-form/department-form.page').then(m => m.DepartmentFormPageComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/designations',
        loadComponent: () => import('./features/admin/designations/designation-manager.page').then(m => m.DesignationManagerComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/complaint-types',
        loadComponent: () => import('./features/admin/complaint-types/complaint-type-list/complaint-type-list.page').then(m => m.ComplaintTypeListComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/complaint-types/create',
        loadComponent: () => import('./features/admin/complaint-types/complaint-type-form/complaint-type-form.page').then(m => m.ComplaintTypeFormComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'admin/complaint-types/edit/:id',
        loadComponent: () => import('./features/admin/complaint-types/complaint-type-form/complaint-type-form.page').then(m => m.ComplaintTypeFormComponent),
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePageComponent),
        canActivate: [authGuard]
      },
      {
        path: 'admin/settings',
        loadComponent: () => import('./features/admin/settings/settings.page').then(m => m.SettingsPageComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/settings/settings.page').then(m => m.SettingsPageComponent)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'complaint-detail/:id',
    loadComponent: () => import('./features/complaints/complaint-detail/complaint-detail.page').then(m => m.ComplaintDetailPage),
    canActivate: [authGuard]
  },
  {
    path: 'admin/chatbot',
    loadComponent: () => import('./features/admin/chatbot/chatbot-settings.page').then(m => m.ChatbotSettingsPage),
    canActivate: [authGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_OWNER', 'ADMIN', 'OWNER', 'ROLE_SYSTEM_OWNER', 'SYSTEM_OWNER', 'CHIEF_OFFICER', 'ROLE_CHIEF_OFFICER'] }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

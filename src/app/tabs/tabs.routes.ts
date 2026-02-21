import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
    {
        path: 'tabs',
        component: TabsPage,
        children: [
            {
                path: 'home',
                loadChildren: () => import('../features/admin/dashboard/dashboard.module').then(m => m.DashboardPageModule)
            },
            {
                path: 'tasks',
                loadComponent: () => import('../features/tasks/task-list/task-list.page').then(m => m.TaskListComponent)
            },
            {
                path: 'tasks/create',
                loadComponent: () => import('../features/tasks/task-form/task-form.page').then(m => m.TaskFormComponent)
            },
            {
                path: 'tasks/edit/:taskId',
                loadComponent: () => import('../features/tasks/task-form/task-form.page').then(m => m.TaskFormComponent)
            },
            {
                path: 'tasks/board',
                loadComponent: () => import('../features/tasks/task-board/task-board.page').then(m => m.TaskBoardPageComponent)
            },
            {
                path: 'tasks/:taskId',
                loadComponent: () => import('../features/tasks/task-detail/task-detail.page').then(m => m.TaskDetailComponent)
            },

            {
                path: 'complaints',
                loadComponent: () => import('../features/complaints/complaint-list/complaint-list.page').then(m => m.ComplaintListComponent),
                pathMatch: 'full'
            },
            {
                path: 'admin/users',
                loadComponent: () => import('../features/admin/users/user-list/user-list.page').then(m => m.UserListComponent)
            },
            {
                path: 'admin/users/create',
                loadComponent: () => import('../features/admin/users/user-form/user-form.page').then(m => m.UserFormPageComponent)
            },
            {
                path: 'admin/users/edit/:userId',
                loadComponent: () => import('../features/admin/users/user-form/user-form.page').then(m => m.UserFormPageComponent)
            },
            {
                path: 'admin/departments',
                loadComponent: () => import('../features/admin/departments/department-list/department-list.page').then(m => m.DepartmentListComponent)
            },
            {
                path: 'admin/departments/create',
                loadComponent: () => import('../features/admin/departments/department-form/department-form.page').then(m => m.DepartmentFormPageComponent)
            },
            {
                path: 'admin/departments/edit/:id',
                loadComponent: () => import('../features/admin/departments/department-form/department-form.page').then(m => m.DepartmentFormPageComponent)
            },
            {
                path: 'admin/complaint-types',
                loadComponent: () => import('../features/admin/complaint-types/complaint-type-list/complaint-type-list.page').then(m => m.ComplaintTypeListComponent)
            },
            {
                path: 'admin/complaint-types/create',
                loadComponent: () => import('../features/admin/complaint-types/complaint-type-form/complaint-type-form.page').then(m => m.ComplaintTypeFormComponent)
            },
            {
                path: 'admin/complaint-types/edit/:id',
                loadComponent: () => import('../features/admin/complaint-types/complaint-type-form/complaint-type-form.page').then(m => m.ComplaintTypeFormComponent)
            },
            {
                path: 'admin/designations',
                loadComponent: () => import('../features/admin/designations/designation-manager.page').then(m => m.DesignationManagerComponent)
            },
            {
                path: 'admin/chatbot',
                loadComponent: () => import('../features/admin/chatbot/chatbot-settings.page').then(m => m.ChatbotSettingsPage)
            },
            {
                path: 'settings',
                loadComponent: () => import('../features/admin/settings/settings.page').then(m => m.SettingsPageComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('../features/profile/profile.page').then(m => m.ProfilePageComponent)
            },
            {
                path: 'owner/dashboard',
                loadComponent: () => import('../features/owner/dashboard/owner-dashboard.page').then(m => m.OwnerDashboardPageComponent)
            },
            {
                path: 'owner/admins',
                loadComponent: () => import('../features/owner/admin-management/admin-management.page').then(m => m.AdminManagementPageComponent)
            },
            {
                path: '',
                redirectTo: '/tabs/home',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
    }
];

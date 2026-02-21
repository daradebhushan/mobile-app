import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-role-selection',
    standalone: true,
    imports: [CommonModule, IonicModule, TranslatePipe],
    templateUrl: './role-selection.page.html'
})
export class RoleSelectionPageComponent {
    selectedRole: string | null = null;
    loading = false;

    roles = [
        {
            id: 'CO',
            titleKey: 'CHIEF_OFFICER',
            subTextKey: 'SUPER_ADMIN',
            icon: 'shield-checkmark',
            color: 'orange'
        },
        {
            id: 'HOD',
            titleKey: 'DEPT_HEAD',
            subTextKey: 'MID_LEVEL_ADMIN',
            icon: 'business',
            color: 'purple'
        },
        {
            id: 'EMP',
            titleKey: 'EMPLOYEE',
            subTextKey: 'FIELD_WORKER',
            icon: 'people',
            color: 'blue'
        }
    ];

    constructor(private router: Router) { }

    selectRole(roleId: string) {
        this.selectedRole = roleId;
    }

    continue() {
        if (!this.selectedRole) return;
        this.loading = true;

        localStorage.setItem('preSelectedRole', this.selectedRole);

        setTimeout(() => {
            this.router.navigate(['/login']);
            this.loading = false;
        }, 800);
    }
}

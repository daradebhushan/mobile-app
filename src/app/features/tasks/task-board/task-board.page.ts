import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../services/task.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

import { Location } from '@angular/common';

@Component({
    selector: 'app-task-board',
    standalone: true,
    imports: [CommonModule, DragDropModule, TranslatePipe, IonicModule],
    templateUrl: './task-board.page.html',
    styles: [`
        .kanban-container {
            display: flex;
            overflow-x: auto;
            padding: 1rem;
            height: calc(100vh - 120px);
            align-items: flex-start;
        }
        .kanban-column {
            width: 280px;
            flex-shrink: 0;
            background: #f4f5f7;
            margin-right: 1rem;
            border-radius: 1rem;
            max-height: 100%;
            display: flex;
            flex-direction: column;
        }
        .task-list {
            min-height: 100px;
            padding: 10px;
            overflow-y: auto;
            flex-grow: 1;
        }
        .task-card {
            background: white;
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 0.75rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: pointer;
        }
        .cdk-drag-preview {
            box-sizing: border-box;
            border-radius: 0.75rem;
            box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                        0 8px 10px 1px rgba(0, 0, 0, 0.14),
                        0 3px 14px 2px rgba(0, 0, 0, 0.12);
        }
        .cdk-drag-placeholder {
            opacity: 0;
        }
        .cdk-drag-animating {
            transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
        .task-list.cdk-drop-list-receiving .task-card {
            transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
    `]
})
export class TaskBoardPageComponent implements OnInit {
    todoTasks: any[] = [];
    inProgressTasks: any[] = [];
    onHoldTasks: any[] = [];
    completedTasks: any[] = [];
    loading = false;

    constructor(
        private taskService: TaskService,
        private router: Router,
        private location: Location
    ) { }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/tasks']);
        }
    }

    ngOnInit() {
        this.loadTasks();
    }

    ionViewWillEnter() {
        // Clear stale data so skeleton shows immediately
        this.todoTasks = [];
        this.inProgressTasks = [];
        this.onHoldTasks = [];
        this.completedTasks = [];
        this.loadTasks();
    }

    loadTasks() {
        this.loading = true;
        this.taskService.getTasks().subscribe({
            next: (res: any) => {
                const tasks = res.data.content || res.data || [];
                this.todoTasks = tasks.filter((t: any) => t.status === 'TO_DO' || t.status === 'PENDING');
                this.inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS');
                this.onHoldTasks = tasks.filter((t: any) => t.status === 'ON_HOLD');
                this.completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Failed to load tasks', err);
                this.loading = false;
            }
        });
    }

    drop(event: CdkDragDrop<any[]>, targetStatus: string) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex,
            );

            const task = event.container.data[event.currentIndex];
            this.updateTaskStatus(task.id, targetStatus);
        }
    }

    updateTaskStatus(taskId: number, status: string) {
        this.taskService.updateTask(taskId, { status }).subscribe({
            next: () => console.log('Task updated to', status),
            error: (err: any) => {
                console.error('Update failed', err);
                this.loadTasks(); // Revert
            }
        });
    }

    viewTask(task: any) {
        this.router.navigate(['/tabs/tasks', task.id]);
    }

    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'CRITICAL': return '#ef4444'; // red-500
            case 'HIGH': return '#f97316'; // orange-500
            case 'MEDIUM': return '#3b82f6'; // blue-500
            case 'LOW': return '#6b7280'; // gray-500
            default: return '#9ca3af'; // gray-400
        }
    }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth/auth.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ToastController, Platform } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Share } from '@capacitor/share';
import { LocalNotifications } from '@capacitor/local-notifications';

@Component({
    selector: 'app-task-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule],
    templateUrl: './task-detail.page.html',
})
export class TaskDetailComponent implements OnInit {
    task: any;
    comments: any[] = [];
    attachments: any[] = [];
    newComment: string = '';
    updatingStatus = false;
    taskId: number | null = null;
    statusOptions = ['TO_DO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];

    // Comment Editing State
    editingCommentId: number | null = null;
    editedCommentText: string = '';
    currentUser: any = null;

    constructor(
        private taskService: TaskService,
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private alertController: AlertController,
        private toastController: ToastController,
        private platform: Platform
    ) { }

    ngOnInit() {
        this.currentUser = this.authService.currentUserValue;
        const taskIdParam = this.route.snapshot.paramMap.get('taskId');
        if (taskIdParam) {
            this.taskId = +taskIdParam;
        }
    }

    ionViewWillEnter() {
        if (this.taskId) {
            this.loadTask(this.taskId);
        }
    }

    loadTask(id: number) {
        this.taskService.getTaskById(id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.task = res.data;
                    console.log('DEBUG: Loaded Task:', this.task); // Log the full object
                    if (this.task.relatedComplaint) {
                        console.log('DEBUG: Related Complaint found:', this.task.relatedComplaint);
                    } else {
                        console.log('DEBUG: No Related Complaint in task object');
                    }
                    this.loadComments();
                    this.loadAttachments();
                    this.cdr.detectChanges();
                }
            },
            error: (err: any) => console.error('TaskDetail: API Error:', err)
        });
    }

    loadComments() {
        if (!this.taskId) return;
        this.taskService.getComments(this.taskId).subscribe({
            next: (res: any) => {
                if (res.success) this.comments = res.data;
                this.cdr.detectChanges();
            }
        });
    }

    // ... inside TaskDetailComponent class

    // File Handling
    newTaskFiles: FileList | null = null;
    loadingAttachments = false;

    loadAttachments() {
        if (!this.taskId) return;
        this.loadingAttachments = true;
        this.taskService.getAttachments(this.taskId).subscribe({
            next: (res: any) => {
                if (res.success) this.attachments = res.data;
                this.loadingAttachments = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingAttachments = false;
                this.cdr.detectChanges();
            }
        });
    }

    onTaskFileSelected(event: any) {
        this.newTaskFiles = event.target.files;
    }

    get taskFileNames(): string {
        if (!this.newTaskFiles || this.newTaskFiles.length === 0) return '';
        return Array.from(this.newTaskFiles).map(f => f.name).join(', ');
    }

    uploadTaskAttachments() {
        if (!this.newTaskFiles || this.newTaskFiles.length === 0 || !this.task) return;

        this.taskService.uploadAttachments(this.task.id, this.newTaskFiles).subscribe({
            next: (res: any) => {
                if (res.success) {
                    // Append new attachments
                    this.attachments = [...this.attachments, ...res.data];
                    this.newTaskFiles = null;

                    // Reset file input if possible/needed, simple way is tricky without ViewChild, but nulling variable works for logic
                    // We might need to reset the actual input element in HTML via ViewChild or simply by *ngIf trick
                    this.cdr.detectChanges();
                }
            },
            error: (err: any) => console.error('Failed to upload attachments', err)
        });
    }

    async deleteAttachment(attachment: any) {
        const alert = await this.alertController.create({
            header: 'Confirm Delete',
            message: `Delete ${attachment.fileName}?`,
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.taskService.deleteAttachment(attachment.id).subscribe({
                            next: (res: any) => {
                                if (res.success) {
                                    this.attachments = this.attachments.filter(a => a.id !== attachment.id);
                                    this.cdr.detectChanges();
                                }
                            },
                            error: (err) => console.error('Failed to delete attachment', err)
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    async downloadFile(attachment: any) {
        const toast = await this.toastController.create({
            message: 'Downloading ' + attachment.fileName + '...',
            duration: 2000,
            position: 'bottom'
        });
        toast.present();

        this.taskService.downloadAttachment(attachment.id).subscribe({
            next: async (blob: Blob) => {
                if (this.platform.is('capacitor')) {
                    try {
                        const base64 = await this.convertBlobToBase64(blob);
                        // Sanitize filename: allow letters, numbers, dots, and convert others to underscore
                        const sanitizedName = attachment.fileName.replace(/[^a-zA-Z0-9.]/g, '_');

                        const savedFile = await Filesystem.writeFile({
                            path: sanitizedName,
                            data: base64,
                            directory: Directory.Cache,
                        });

                        let resolvedMimeType = blob.type;
                        if (!resolvedMimeType || resolvedMimeType === 'application/octet-stream' || resolvedMimeType === 'application/json') {
                            resolvedMimeType = this.getMimeType(attachment.fileName);
                        }

                        // Show Notification
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    title: 'Download Complete',
                                    body: sanitizedName + ' has been saved.',
                                    id: Math.floor(Math.random() * 10000),
                                    extra: {
                                        filePath: savedFile.uri,
                                        contentType: resolvedMimeType
                                    }
                                }
                            ]
                        });

                        const successToast = await this.toastController.create({
                            message: 'Download Complete: ' + sanitizedName,
                            duration: 3000,
                            color: 'success',
                            position: 'bottom'
                        });
                        successToast.present();

                        // Automatically open the file for a browser-like experience
                        try {
                            console.log('Attempting to auto-open file at:', savedFile.uri, 'with type:', resolvedMimeType);
                            await FileOpener.open({
                                filePath: savedFile.uri,
                                contentType: resolvedMimeType,
                                openWithDefault: false // Force the chooser so it doesn't fail silently
                            });
                            console.log('FileOpener resolved successfully');
                        } catch (openError) {
                            console.error('Auto-open failed, file is saved though.', openError);
                            this.toastController.create({
                                message: 'Could not open file automatically. Please check your Downloads.',
                                duration: 3000,
                                color: 'warning'
                            }).then(t => t.present());
                        }

                    } catch (e) {
                        console.error('Direct download failed', e);
                        const alert = await this.alertController.create({
                            header: 'Download Error',
                            message: 'Could not save to Documents. Please check storage permissions.',
                            buttons: ['OK']
                        });
                        await alert.present();
                    }
                } else {
                    // Web Fallback
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = attachment.fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }
            },
            error: async (err) => {
                const errorToast = await this.toastController.create({
                    message: 'Download failed. Please try again.',
                    duration: 3000,
                    color: 'danger'
                });
                errorToast.present();
                console.error('Download error', err);
            }
        });
    }

    // Unified handling: Download + Auto-Open

    private convertBlobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const result = reader.result as string;
                // remove "data:mime/type;base64," header
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(blob);
        });
    }

    private getMimeType(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const types: any = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt': 'text/plain'
        };
        return types[ext || ''] || 'application/octet-stream';
    }

    // ... existing onEdit, onDelete ...

    // ... inside TaskDetailComponent

    // Comment Attachments
    newCommentFiles: FileList | null = null;

    onCommentFileSelected(event: any) {
        this.newCommentFiles = event.target.files;
    }

    addComment() {
        if ((!this.newComment.trim() && (!this.newCommentFiles || this.newCommentFiles.length === 0)) || !this.taskId) return;

        this.taskService.addComment(this.taskId, this.newComment).subscribe({
            next: (res: any) => {
                if (res.success) {
                    const commentId = res.data.id;
                    if (this.newCommentFiles && this.newCommentFiles.length > 0) {
                        this.taskService.uploadCommentAttachments(this.taskId!, commentId, this.newCommentFiles).subscribe({
                            next: () => {
                                this.resetCommentInput();
                                this.loadComments();
                            },
                            error: (err) => console.error('Failed to upload comment attachments', err)
                        });
                    } else {
                        this.resetCommentInput();
                        this.loadComments();
                    }
                }
            }
        });
    }

    resetCommentInput() {
        this.newComment = '';
        this.newCommentFiles = null;
    }

    startEditing(comment: any) {
        this.editingCommentId = comment.id;
        this.editedCommentText = comment.text;
    }

    cancelEditing() {
        this.editingCommentId = null;
        this.editedCommentText = '';
    }

    saveEdit(commentId: number) {
        if (!this.editedCommentText.trim() || !this.taskId) return;

        this.taskService.updateComment(this.taskId, commentId, this.editedCommentText).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.loadComments();
                    this.cancelEditing();
                }
            },
            error: (err: any) => console.error('Failed to update comment', err)
        });
    }

    async deleteComment(commentId: number) {
        const alert = await this.alertController.create({
            header: 'Confirm Delete',
            message: 'Are you sure you want to delete this comment?',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.taskService.deleteComment(this.taskId!, commentId).subscribe({
                            next: (res: any) => {
                                if (res.success) {
                                    this.loadComments();
                                }
                            },
                            error: (err: any) => console.error('Failed to delete comment', err)
                        });
                    }
                }
            ]
        });
        await alert.present();
    }

    canEdit(comment: any): boolean {
        if (this.canManageTask) return true;
        return this.currentUser && comment.user && (this.currentUser.id === comment.user.id || this.currentUser.username === comment.user.username);
    }

    get isAdmin(): boolean {
        const user = this.authService.currentUserValue;
        const role = (user as any)?.role;
        return user?.roles?.includes('ROLE_OWNER') || user?.roles?.includes('ROLE_ADMIN') ||
            user?.roles?.includes('OWNER') || user?.roles?.includes('ADMIN') ||
            user?.roles?.includes('ROLE_CHIEF_OFFICER') || user?.roles?.includes('CHIEF_OFFICER') ||
            role === 'OWNER' || role === 'ADMIN' || role === 'CHIEF_OFFICER' || false;
    }

    get isStaff(): boolean {
        const user = this.currentUser;
        return user?.role === 'STAFF' || user?.roles?.includes('ROLE_STAFF') || user?.roles?.includes('STAFF');
    }

    get isAssignedStaff(): boolean {
        return !!this.task?.assignedStaff?.id && !!this.currentUser && this.task.assignedStaff.id === this.currentUser.id;
    }

    get canManageTask(): boolean {
        return this.isAdmin;
    }

    get canUpdateTaskStatus(): boolean {
        return this.canManageTask || (this.isStaff && this.isAssignedStaff);
    }

    get canCommentOnTask(): boolean {
        return this.canManageTask || (this.isStaff && this.isAssignedStaff);
    }

    updateStatus(newStatus: string) {
        if (!this.canUpdateTaskStatus) return;
        if (!this.task || this.task.status === newStatus) return;
        this.updatingStatus = true;
        this.taskService.updateTaskStatus(this.task.id, newStatus).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.task.status = newStatus;
                }
                this.updatingStatus = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                console.error("Failed to update status", err);
                this.updatingStatus = false;
            }
        });
    }

    onEdit() {
        if (!this.canManageTask) return;
        if (!this.task) return;
        this.router.navigate(['/tabs/tasks/edit', this.task.id]);
    }

    async onDelete() {
        if (!this.canManageTask) return;
        if (!this.task) return;

        const alert = await this.alertController.create({
            header: 'Confirm Delete',
            message: 'Are you sure you want to delete this task?',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.taskService.deleteTask(this.task.id).subscribe({
                            next: () => {
                                this.router.navigate(['/tabs/tasks'], { replaceUrl: true });
                            },
                            error: async (err) => {
                                console.error('Delete failed', err);
                                const errorAlert = await this.alertController.create({
                                    header: 'Error',
                                    message: err.error?.message || 'Failed to delete task',
                                    buttons: ['OK']
                                });
                                await errorAlert.present();
                            }
                        });
                    }
                }
            ]
        });
        await alert.present();
    }
    viewComplaint(complaintId: number) {
        // Global route, outside of tabs to prevent ambiguity
        this.router.navigate(['/complaint-detail', complaintId]);
    }
}

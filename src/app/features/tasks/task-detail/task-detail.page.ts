import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth/auth.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ToastController, Platform, ModalController } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Share } from '@capacitor/share';
import { LocalNotifications } from '@capacitor/local-notifications';

import { Location } from '@angular/common';
import { ImageModalComponent } from '../../complaints/complaint-detail/image-modal.component';

@Component({
    selector: 'app-task-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule, ImageModalComponent],
    templateUrl: './task-detail.page.html',
})
export class TaskDetailComponent implements OnInit {
    task: any;
    comments: any[] = [];
    attachments: any[] = [];
    newComment: string = '';
    
    public apiUrl = environment.apiUrl;
    updatingStatus = false;
    taskId: number | null = null;
    statusOptions = ['TO_DO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];

    // Comment Editing & Attachments State
    editingCommentId: number | null = null;
    editedCommentText: string = '';
    currentUser: any = null;
    commentFiles: File[] = [];
    isCommentUploading = false;

    constructor(
        private taskService: TaskService,
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private cdr: ChangeDetectorRef,
        private alertController: AlertController,
        private toastController: ToastController,
        private modalController: ModalController,
        private platform: Platform
    ) { }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/tasks']);
        }
    }

    ngOnInit() {
        this.currentUser = this.authService.currentUserValue;
        // Read taskId here for initial setup only
        const taskIdParam = this.route.snapshot.paramMap.get('taskId');
        if (taskIdParam) {
            this.taskId = +taskIdParam;
        }
    }

    isLoading: boolean = false;

    ionViewWillEnter() {
        this.currentUser = this.authService.currentUserValue;
        // Always re-read taskId on every entry to handle navigation to different tasks
        const taskIdParam = this.route.snapshot.paramMap.get('taskId');
        if (taskIdParam) {
            this.taskId = +taskIdParam;
        }
        if (this.taskId) {
            // Clear stale data first so skeleton shows instead of stale content
            this.task = null;
            this.comments = [];
            this.attachments = [];
            this.loadTask(this.taskId);
        }
    }

    loadTask(id: number) {
        this.isLoading = true;
        this.cdr.detectChanges();
        this.taskService.getTaskById(id).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                if (res.success) {
                    this.task = res.data;
                    this.loadComments();
                    this.loadAttachments();
                    this.cdr.detectChanges();
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                console.error('TaskDetail: API Error:', err);
            }
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
    onCommentFilesSelected(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            const files: FileList = event.target.files;
            for (let i = 0; i < files.length; i++) {
                this.commentFiles.push(files[i]);
            }
            // Reset the input value so selecting the same file again triggers change
            event.target.value = '';
            this.cdr.detectChanges();
        }
    }

    removeCommentFile(index: number) {
        this.commentFiles.splice(index, 1);
        this.cdr.detectChanges();
    }

    isImageFile(fileName: string): boolean {
        if (!fileName) return false;
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext || '');
    }

    async openImagePreview(url: string) {
        const modal = await this.modalController.create({
            component: ImageModalComponent,
            componentProps: { imageUrl: url }
        });
        await modal.present();
    }

    addComment() {
        const hasText = this.newComment && this.newComment.trim().length > 0;
        const hasFiles = this.commentFiles && this.commentFiles.length > 0;
        if ((!hasText && !hasFiles) || !this.taskId || this.isCommentUploading) return;

        const commentText = hasText ? this.newComment.trim() : '📎 Attached file(s)';
        this.isCommentUploading = true;

        this.taskService.addComment(this.taskId, commentText, hasFiles).subscribe({
            next: (res: any) => {
                if (res.success) {
                    const commentId = res.data.id;
                    if (hasFiles) {
                        this.taskService.uploadCommentAttachments(this.taskId!, commentId, this.commentFiles).subscribe({
                            next: () => {
                                this.resetCommentInput();
                                this.isCommentUploading = false;
                                this.loadComments();
                                this.loadAttachments();
                            },
                            error: (err) => {
                                console.error('Failed to upload comment attachments', err);
                                this.isCommentUploading = false;
                                this.resetCommentInput();
                                this.loadComments();
                            }
                        });
                    } else {
                        this.resetCommentInput();
                        this.isCommentUploading = false;
                        this.loadComments();
                    }
                } else {
                    this.isCommentUploading = false;
                }
            },
            error: (err) => {
                console.error('Failed to add comment', err);
                this.isCommentUploading = false;
            }
        });
    }

    resetCommentInput() {
        this.newComment = '';
        this.commentFiles = [];
        this.cdr.detectChanges();
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

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ToastController, ModalController, Platform, LoadingController } from '@ionic/angular';
import { ComplaintService, Complaint } from '../../../services/complaint.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ImageModalComponent } from './image-modal.component';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
    selector: 'app-complaint-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule, TranslatePipe],
    templateUrl: './complaint-detail.page.html',
    styleUrls: ['./complaint-detail.page.scss']
})
export class ComplaintDetailPage implements OnInit {
    complaint: Complaint | null = null;
    complaintId: number | null = null;
    newComment: string = '';
    loading = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private complaintService: ComplaintService,
        private cdr: ChangeDetectorRef,
        private alertController: AlertController,
        private toastController: ToastController,
        private modalController: ModalController,
        private platform: Platform,
        private loadingController: LoadingController,
        private sanitizer: DomSanitizer,
        private authService: AuthService
    ) { }

    get isAdmin(): boolean {
        const user = this.authService.currentUserValue;
        const role = (user as any)?.role;
        return user?.roles?.includes('ROLE_OWNER') || user?.roles?.includes('ROLE_ADMIN') ||
            user?.roles?.includes('OWNER') || user?.roles?.includes('ADMIN') ||
            user?.roles?.includes('ROLE_CHIEF_OFFICER') || user?.roles?.includes('CHIEF_OFFICER') ||
            role === 'OWNER' || role === 'ADMIN' || role === 'CHIEF_OFFICER' || false;
    }

    get canManageComplaintActions(): boolean {
        return this.isAdmin;
    }

    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.complaintId = +idParam;
            this.loadComplaint();
        }
    }

    safePhotoUrl: SafeUrl | undefined;
    mainPhotoBlobUrl: SafeUrl | undefined;
    mainPhotoError: boolean = false;

    loadComplaint() {
        if (!this.complaintId) return;
        this.loading = true;
        this.mainPhotoError = false;
        this.complaintService.getComplaintById(this.complaintId).subscribe({
            next: (res) => {
                this.complaint = res; // Backend returns DTO directly
                if (this.complaint) {
                    if (this.complaint.photoUrl === 'null') {
                        this.complaint.photoUrl = undefined;
                    }
                    this.safePhotoUrl = this.getSafeUrl(this.complaint.photoUrl);
                    console.log('Original Photo URL:', this.complaint.photoUrl);
                    console.log('Safe Photo URL:', this.safePhotoUrl);

                    // Fetch as Blob to bypass ngrok warning
                    if (this.complaint.photoUrl) {
                        this.loadMainPhotoBlob(this.complaint.photoUrl);
                    }

                    // CLEANUP: Remove Sub-Issue from Description and Metadata
                    if (this.complaint.description) {
                        let desc = this.complaint.description.trim();

                        // 1. Remove "--- Additional Details ---" and everything after it
                        const metadataMarker = "--- Additional Details ---";
                        if (desc.includes(metadataMarker)) {
                            desc = desc.split(metadataMarker)[0].trim();
                        }

                        // 2. Remove Sub-Issue suffix if present (OLD logic, keeping just in case)
                        if (this.complaint.subComplaintType) {
                            const subIssue = this.complaint.subComplaintType.trim();
                            if (desc.toLowerCase().startsWith(subIssue.toLowerCase())) {
                                desc = desc.substring(subIssue.length).trim();
                                desc = desc.replace(/^[-:]\s*/, '');
                            }
                        }
                        this.complaint.description = desc;
                    }
                }
                this.loadAttachmentImages();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load complaint', err);
                this.showToast('Failed to load complaint. Check network/backend.', 'danger');
                this.loading = false;
            }
        });
    }

    onImageError(event: any) {
        console.error('Main image failed to load:', event);
        this.mainPhotoError = true;
        // Commenting out the toast to prevent annoying the user if the image is just a broken fallback
        // this.showToast('Failed to load image', 'warning');
        this.cdr.detectChanges();
    }

    selectedCommentFile: File | null = null;

    onCommentFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedCommentFile = file;
        }
    }

    removeCommentFile() {
        this.selectedCommentFile = null;
    }

    async addComment() {
        if (!this.canManageComplaintActions) return;
        if ((!this.newComment.trim() && !this.selectedCommentFile) || !this.complaintId) return;

        const loading = await this.loadingController.create({
            message: 'Posting...',
            spinner: 'circular',
            duration: 5000
        });
        await loading.present();

        const commentText = this.newComment;
        // If file exists, maybe append to text?
        // "Attached: filename"
        const finalComment = this.selectedCommentFile
            ? `${commentText}\n(Attached: ${this.selectedCommentFile.name})`.trim()
            : commentText;

        // 1. Post Comment (if text exists or we forced separate text)
        // Actually, let's just use the api.
        this.complaintService.addComment(this.complaintId, finalComment || 'Attachment Only').subscribe({
            next: (res) => {
                this.newComment = '';

                // 2. Upload File if present
                if (this.selectedCommentFile && this.complaintId) {
                    this.complaintService.addAttachment(this.complaintId, this.selectedCommentFile).subscribe({
                        next: (resWithAtt) => {
                            this.complaint = resWithAtt;
                            this.selectedCommentFile = null;
                            loading.dismiss();
                            this.showToast('Comment & Attachment added', 'success');
                            this.cdr.detectChanges();
                        },
                        error: (err) => {
                            loading.dismiss();
                            this.showToast('Comment added but attachment failed', 'warning');
                        }
                    });
                } else {
                    this.complaint = res;
                    loading.dismiss();
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                loading.dismiss();
                this.showToast('Failed to add comment', 'danger');
            }
        });
    }

    async uploadAttachment(event: any) {
        if (!this.canManageComplaintActions) return;
        const file = event.target.files[0];
        if (!file || !this.complaintId) return;

        this.complaintService.addAttachment(this.complaintId, file).subscribe({
            next: (res) => {
                this.complaint = res;
                this.showToast('Attachment uploaded', 'success');
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.showToast('Failed to upload attachment', 'danger');
            }
        });
    }



    async acceptComplaint() {
        if (!this.canManageComplaintActions) return;
        if (!this.complaintId) return;

        const loading = await this.loadingController.create({ message: 'Accepting...' });
        await loading.present();

        this.complaintService.updateStatus(this.complaintId, 'ACCEPTED').subscribe({
            next: async (res) => {
                this.complaint = res;
                await loading.dismiss();
                this.showToast('Complaint Accepted', 'success');
                this.cdr.detectChanges();
            },
            error: async (err) => {
                await loading.dismiss();
                this.showToast('Failed to accept complaint', 'danger');
            }
        });
    }

    viewTask() {
        if (this.complaint?.relatedTaskId) {
            this.router.navigate(['/tabs/tasks', this.complaint.relatedTaskId]);
        }
    }

    async rejectComplaint() {
        if (!this.canManageComplaintActions) return;
        const alert = await this.alertController.create({
            header: 'Reject Complaint',
            inputs: [
                {
                    name: 'reason',
                    type: 'textarea',
                    placeholder: 'Reason for rejection'
                }
            ],
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Reject',
                    handler: (data) => {
                        if (this.complaintId) {
                            this.complaintService.updateStatus(this.complaintId, 'REJECTED', data.reason).subscribe(res => {
                                this.complaint = res;
                                this.showToast('Complaint Rejected', 'warning');
                                this.cdr.detectChanges();
                            });
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    openLocation() {
        if (this.complaint?.location) {
            // Primitive check if it's coordinates or text
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.complaint.location)}`;
            window.open(url, '_system');
        }
    }

    openOriginalMedia() {
        if (this.mainPhotoBlobUrl || this.safePhotoUrl) {
            this.openImageModalInternal(this.mainPhotoBlobUrl || this.safePhotoUrl);
        }
    }

    async openImageModalInternal(imageUrl: SafeUrl | undefined) {
        if (!imageUrl) return;
        const modal = await this.modalController.create({
            component: ImageModalComponent,
            componentProps: {
                imageUrl: imageUrl
            }
        });
        await modal.present();
    }

    async convertToTask() {
        if (!this.canManageComplaintActions) return;
        if (!this.complaint) return;

        // Use router to navigate to task create form, passing complaint data via state or query params
        // OR create task directly if minimal info is sufficient.
        // The user wants "create a task from complaint".
        // Ideally, we open the Task Form pre-filled.
        // Let's assume we have a Task Form that can takeQueryParams.

        this.router.navigate(['/tabs/tasks/create'], {
            queryParams: {
                fromComplaintId: this.complaint.id,
                title: `Complaint ${this.complaint.complaintNo}`,
                description: `From Complaint ${this.complaint.complaintNo}:\n${this.complaint.description}\n\nCitizen: ${this.complaint.citizenName || 'N/A'}\nMobile: ${this.complaint.citizenMobile || 'N/A'}`,
                departmentId: this.complaint.departmentId
            }
        });
    }

    async downloadFile(attachment: any) {
        const toast = await this.toastController.create({
            message: 'Downloading ' + attachment.fileName + '...',
            duration: 2000
        });
        toast.present();

        this.complaintService.downloadAttachment(attachment.id).subscribe({
            next: async (blob: Blob) => {
                if (this.platform.is('capacitor')) {
                    try {
                        const base64 = await this.convertBlobToBase64(blob);
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

                        await LocalNotifications.schedule({
                            notifications: [{
                                title: 'Download Complete',
                                body: sanitizedName + ' has been saved.',
                                id: Math.floor(Math.random() * 10000),
                                extra: {
                                    filePath: savedFile.uri,
                                    contentType: resolvedMimeType
                                }
                            }]
                        });

                        const sToast = await this.toastController.create({
                            message: 'Download Complete: ' + sanitizedName,
                            duration: 3000,
                            color: 'success'
                        });
                        sToast.present();

                        try {
                            console.log('Attempting to auto-open file at:', savedFile.uri, 'with type:', resolvedMimeType);
                            await FileOpener.open({
                                filePath: savedFile.uri,
                                contentType: resolvedMimeType,
                                openWithDefault: false
                            });
                            console.log('FileOpener resolved successfully');
                        } catch (e) {
                            console.error('Auto-open failed', e);
                            this.toastController.create({
                                message: 'Could not open file automatically.',
                                duration: 3000,
                                color: 'warning'
                            }).then(t => t.present());
                        }

                    } catch (e) {
                        console.error('Download failed', e);
                        this.showToast('Download failed check permissions', 'danger');
                    }
                } else {
                    // Web
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
            error: (err) => {
                console.error('Download error', err);
                this.showToast('Download failed', 'danger');
            }
        });
    }

    private convertBlobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(blob);
        });
    }

    async showToast(msg: string, color: string = 'dark') {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            color: color
        });
        toast.present();
    }

    // Helper to fix localhost URLs for Android
    getSafeUrl(url: string | undefined): SafeUrl | undefined {
        if (!url) return undefined;
        let finalUrl = url;
        if (url.includes('localhost:8080') || url.includes('127.0.0.1:8080')) {
            finalUrl = url.replace('http://localhost:8080', environment.apiUrl)
                .replace('http://127.0.0.1:8080', environment.apiUrl)
                .replace('http://10.0.2.2:8080', environment.apiUrl);
        } else if (url.startsWith('/uploads')) {
            // Also handle relative URLs just in case
            finalUrl = `${environment.apiUrl}${url}`;
        }

        return this.sanitizer.bypassSecurityTrustUrl(finalUrl);
    }

    loadMainPhotoBlob(url: string) {
        // Construct standard URL to fetch, REUSING the safe URL logic's endpoint resolution
        // We need to ensure we hit the NGROK url, not localhost
        let fetchUrl = url;

        if (url.includes('localhost:8080') || url.includes('127.0.0.1:8080')) {
            fetchUrl = url.replace('http://localhost:8080', environment.apiUrl)
                .replace('http://127.0.0.1:8080', environment.apiUrl)
                .replace('http://10.0.2.2:8080', environment.apiUrl);
        } else if (url.startsWith('/uploads')) {
            fetchUrl = `${environment.apiUrl}${url}`;
        }

        // CRITICAL: Force HTTPS for ngrok to avoid 307 Redirects which drop Auth headers
        if (fetchUrl.includes('ngrok-free.dev') && fetchUrl.startsWith('http://')) {
            fetchUrl = fetchUrl.replace('http://', 'https://');
            console.log('Upgraded URL to HTTPS:', fetchUrl);
        }

        console.log('Fetching Main Photo Blob from:', fetchUrl);

        this.complaintService.getImage(fetchUrl).subscribe({
            next: (blob) => {
                if (blob && blob.size > 0) {
                    const objectURL = URL.createObjectURL(blob);
                    this.mainPhotoBlobUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
                    console.log('Main Photo Blob Loaded');
                } else {
                    console.warn('Main photo fetch returned 0 bytes');
                    this.mainPhotoError = true;
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load main photo blob HTTP', err);
                this.mainPhotoError = true;
                this.cdr.detectChanges();
            }
        });
    }

    // Image handling
    attachmentImages: { [key: number]: SafeUrl } = {};
    attachmentLoadErrors: { [key: number]: boolean } = {};

    isImage(file: any): boolean {
        // If it's a string, treat as filename
        if (typeof file === 'string') {
            const ext = file.split('.').pop()?.toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
        }
        // If it's an object, check fileType or fileName
        if (file && typeof file === 'object') {
            if (file.fileType && file.fileType.startsWith('image/')) return true;
            if (file.fileName) {
                const ext = file.fileName.split('.').pop()?.toLowerCase();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
            }
        }
        return false;
    }

    loadAttachmentImages() {
        if (!this.complaint || !this.complaint.attachments) return;

        this.complaint.attachments.forEach(att => {
            if (this.isImage(att)) {
                this.attachmentLoadErrors[att.id] = false; // Reset error
                this.complaintService.downloadAttachment(att.id).subscribe({
                    next: (blob) => {
                        if (blob.size > 0) {
                            // Fix: If blob type is generic, force it based on file extension/metadata
                            let imageBlob = blob;
                            if (!blob.type || blob.type === 'application/octet-stream') {
                                const mimeType = att.fileType || this.getMimeType(att.fileName);
                                console.log(`Forcing MIME type for ${att.fileName}: ${mimeType}`);
                                imageBlob = new Blob([blob], { type: mimeType });
                            }

                            const objectURL = URL.createObjectURL(imageBlob);
                            this.attachmentImages[att.id] = this.sanitizer.bypassSecurityTrustUrl(objectURL);
                        } else {
                            console.error(`Attachment ${att.id} has 0 bytes`);
                            this.attachmentLoadErrors[att.id] = true;
                        }
                    },
                    error: (err) => {
                        console.error('Failed to load image for attachment ' + att.id, err);
                        this.attachmentLoadErrors[att.id] = true;
                    }
                });
            }
        });
    }

    getMimeType(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const types: any = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt': 'text/plain'
        };
        return types[ext || ''] || 'application/octet-stream';
    }

    onAttachmentImageError(id: number) {
        console.error(`Image tag error for attachment ${id}`);
        this.attachmentLoadErrors[id] = true;
    }

    viewImage(attachmentId: number) {
        const imageSafeUrl = this.attachmentImages[attachmentId];
        if (imageSafeUrl) {
            this.openImageModalInternal(imageSafeUrl);
        }
    }

    isPhotoInAttachments(photoUrl: string): boolean {
        if (!this.complaint || !this.complaint.attachments) return false;

        // If the complaint has ANY attachments, we can safely hide the main fallback photo.
        // Reason: Our backend copies `photoUrl` into a new `ComplaintAttachment` entity with a newly generated name (whatsapp_media_123.jpg)
        // This causes filename mismatch, and since EVERY photo is copied to attachments, 
        // the main photo block is almost always a duplicate. Hiding it if there are attachments prevents the double/empty image bug.
        return this.complaint.attachments.some(att => this.isImage(att));
    }

    hasDocuments(): boolean {
        if (!this.complaint || !this.complaint.attachments) return false;
        return this.complaint.attachments.some(att => !this.isImage(att));
    }
}

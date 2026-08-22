import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ComplaintService, Complaint } from '../../../services/complaint.service'; // Updated import
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterModule, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-complaint-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe, IonicModule, RouterModule],
    templateUrl: './complaint-list.page.html',
    styles: [`
      .scrollbar-hide::-webkit-scrollbar { display: none; }
    `]
})
export class ComplaintListComponent implements OnInit, OnDestroy {
    searchText: string = '';
    activeTab: string = 'FILTER_ALL';
    complaints: Complaint[] = [];
    filteredComplaints: Complaint[] = []; // Local filtering
    loading: boolean = false;

    tabs = [
        { label: 'FILTER_ALL', status: '' },
        { label: 'PENDING', status: 'PENDING' },
        { label: 'ACCEPTED', status: 'ACCEPTED' },
        { label: 'REJECTED', status: 'REJECTED' },
        { label: 'CONVERTED', status: 'CONVERTED_TO_TASK' } // Optional tab
    ];

    private searchSubject = new Subject<string>();
    private fetchSubscription: Subscription | null = null;

    constructor(
        private complaintService: ComplaintService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) { }

    ngOnInit() {
        this.fetchComplaints();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(text => {
            this.applyFilters();
        });
    }

    private autoRefreshInterval: any;

    ngOnDestroy() {
        if (this.fetchSubscription) {
            this.fetchSubscription.unsubscribe();
        }
    }

    ionViewWillEnter() {
        this.fetchComplaints(null, true);
    }

    ionViewDidEnter() {
        this.autoRefreshInterval = setInterval(() => {
            this.fetchComplaints(null, true);
        }, 10000);
    }

    ionViewWillLeave() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }

    handleRefresh(event: any) {
        this.fetchComplaints(event);
    }

    onSearch() {
        this.searchSubject.next(this.searchText);
    }

    setTab(tabLabel: string) {
        this.activeTab = tabLabel;
        this.filteredComplaints = []; // clear to show skeleton
        this.applyFilters();
    }

    mergeData(newData: Complaint[]) {
        if (!this.complaints || this.complaints.length === 0) {
            this.complaints = newData;
            return;
        }

        this.complaints = this.complaints.filter(c => newData.find(n => n.id === c.id));

        newData.forEach(newItem => {
            const existingIndex = this.complaints.findIndex(c => c.id === newItem.id);
            if (existingIndex > -1) {
                Object.assign(this.complaints[existingIndex], newItem);
            } else {
                this.complaints.push(newItem);
            }
        });
    }

    fetchComplaints(event: any = null, silent: boolean = false) {
        if (this.fetchSubscription) {
            this.fetchSubscription.unsubscribe();
        }

        // Show loader on EVERY load unless it's silent background refresh or pull-to-refresh
        if (!event && !silent) {
            this.loading = true;
            this.filteredComplaints = []; // clear so skeleton appears
            this.cdr.detectChanges();
        }

        this.fetchSubscription = this.complaintService.getComplaints()
            .subscribe({
                next: (data: Complaint[]) => {
                    this.mergeData(data || []);
                    this.applyFilters();
                    this.loading = false;
                    this.cdr.detectChanges();
                    if (event) event.target.complete();
                },
                error: (err) => {
                    console.error('Failed to fetch complaints', err);
                    this.loading = false;
                    this.cdr.detectChanges();
                    if (event) event.target.complete();
                }
            });
    }

    applyFilters() {
        let temp = this.complaints;

        // Status Filter
        const currentTab = this.tabs.find(t => t.label === this.activeTab);
        if (currentTab && currentTab.status) {
            temp = temp.filter(c => c.status === currentTab.status);
        }

        // Search Filter
        if (this.searchText.trim()) {
            const lower = this.searchText.toLowerCase();
            temp = temp.filter(c =>
                (c.complaintNo && c.complaintNo.toLowerCase().includes(lower)) ||
                (c.description && c.description.toLowerCase().includes(lower)) ||
                (c.citizenName && c.citizenName.toLowerCase().includes(lower)) ||
                (c.citizenMobile && c.citizenMobile.includes(lower))
            );
        }

        // Sort by Date Descending
        temp.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.filteredComplaints = temp;
        this.cdr.detectChanges();
    }

    openComplaint(complaint: Complaint) {
        this.router.navigate(['/complaint-detail', complaint.id]);
    }

    getStatusClass(status: string) {
        switch (status) {
            case 'PENDING': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
            case 'ACCEPTED': return 'bg-green-50 text-green-600 border border-green-100';
            case 'REJECTED': return 'bg-red-50 text-red-600 border border-red-100';
            case 'CONVERTED_TO_TASK': return 'bg-blue-50 text-blue-600 border border-blue-100';
            default: return 'bg-gray-50 text-gray-600';
        }
    }

    trackById(index: number, item: any): number {
        return item.id;
    }
}

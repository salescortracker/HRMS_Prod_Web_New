import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MissedPunchService } from './service/missed-punch.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-missed-punch-request',
  standalone: false,
  templateUrl: './missed-punch-request.component.html',
  styleUrl: './missed-punch-request.component.css'
})
export class MissedPunchRequestComponent {
missedPunchForm!: FormGroup;
  isEditMode = false;
  editId: number | null = null;

  myRequests: any[] = [];
  approvalRequests: any[] = [];
pendingRequests: any[] = [];
approvedRequests: any[] = [];
rejectedRequests: any[] = [];
  companyId =Number(sessionStorage.getItem('CompanyId')) || 1;   // get from login/session
  regionId =Number(sessionStorage.getItem('RegionId')) || 1;    // get from login/session
  userId =Number(sessionStorage.getItem('UserId')) || 1;    // logged-in user
  managerId =Number(sessionStorage.getItem("UserId")) || 0; // logged-in manager
selectedTab: string = '';
maxDate: string = '';
// ============================================================
// SEARCH
// ============================================================

mySearchText = '';
pendingSearchText = '';
approvedSearchText = '';
rejectedSearchText = '';


// ============================================================
// PAGINATION - MY REQUESTS
// ============================================================

myPage = 1;
myPageSize = 10;
myTotalPages = 1;
myPages: number[] = [];
filteredMyRequests: any[] = [];
paginatedMyRequests: any[] = [];


// ============================================================
// PAGINATION - PENDING
// ============================================================

pendingPage = 1;
pendingPageSize = 10;
pendingTotalPages = 1;
pendingPages: number[] = [];
filteredPendingRequests: any[] = [];
paginatedPendingRequests: any[] = [];


// ============================================================
// PAGINATION - APPROVED
// ============================================================

approvedPage = 1;
approvedPageSize = 10;
approvedTotalPages = 1;
approvedPages: number[] = [];
filteredApprovedRequests: any[] = [];
paginatedApprovedRequests: any[] = [];


// ============================================================
// PAGINATION - REJECTED
// ============================================================

rejectedPage = 1;
rejectedPageSize = 10;
rejectedTotalPages = 1;
rejectedPages: number[] = [];
filteredRejectedRequests: any[] = [];
paginatedRejectedRequests: any[] = [];


// Used by Math.min() in HTML
Math = Math;
  constructor(
    private fb: FormBuilder,
    private missedPunchService: MissedPunchService
  ) {}

  ngOnInit(): void {
    this.setMaxDate();
    this.initializeForm();
    this.loadMyRequests();
    this.loadApprovalRequests();
    this.loadPermissions();
  }
  setMaxDate(): void {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  this.maxDate = `${year}-${month}-${day}`;
}

  /* ================= FORM ================= */

  initializeForm() {
    this.missedPunchForm = this.fb.group({
      missedDate: [null, Validators.required],
      missedType: [null, Validators.required],
       correctClockIn: [{ value: null, disabled: true }],
    correctClockOut: [{ value: null, disabled: true }],
      reason: [null, Validators.required],
      hrEmail: [null] 
    });
    this.handleMissedTypeChanges();
  }
handleMissedTypeChanges() {
  this.missedPunchForm.get('missedType')?.valueChanges.subscribe(value => {
    const clockIn = this.missedPunchForm.get('correctClockIn');
    const clockOut = this.missedPunchForm.get('correctClockOut');

    // Reset first
    clockIn?.disable();
    clockOut?.disable();

    if (value === 'Missed Clock In') {
      clockIn?.enable();      // Disable Clock In
      clockIn?.setValue(null);
    }

    if (value === 'Missed Clock Out') {
      clockOut?.enable();     // Disable Clock Out
      clockOut?.setValue(null);
    }

    if (value === 'Both In & Out') {
      clockIn?.enable();
      clockOut?.enable();
    }
  });
}
  // submitMissedPunch() {
  //  // if (this.missedPunchForm.invalid) return;
  //   const payload = {
  //     ...this.missedPunchForm.value,
  //     companyId: this.companyId,
  //     regionId: this.regionId,
  //     userId: this.userId,employeeId: this.userId,
  //     reportingTo: Number(sessionStorage.getItem('reportingManagerId'))
  //   };

  //   if (this.isEditMode && this.editId) {
  //     this.missedPunchService
  //       .updateMissedPunch( payload)
  //       .subscribe(() => {
  //         this.resetForm();
  //         this.loadMyRequests();
  //       });
  //   } else {
  //     this.missedPunchService
  //       .createMissedPunchRequest(payload)
  //       .subscribe(() => {
  //         this.resetForm();
  //         this.loadMyRequests();
  //       });
  //   }
  // }
  submitMissedPunch() {
  const payload = {
    ...this.missedPunchForm.value,
    companyId: this.companyId,
    regionId: this.regionId,
    userId: this.userId,
    employeeId: this.userId,
    reportingTo: Number(sessionStorage.getItem('reportingManagerId'))
  };

  if (this.isEditMode && this.editId) {
    this.missedPunchService.updateMissedPunch(payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Missed punch request updated successfully',
          timer: 2000,
          showConfirmButton: false
        });

        this.resetForm();
        this.loadMyRequests();
      },
      error: () => {
        Swal.fire('Error', 'Failed to update request', 'error');
      }
    });
  } else {
    this.missedPunchService.createMissedPunchRequest(payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Submitted!',
          text: 'Missed punch request submitted successfully',
          timer: 2000,
          showConfirmButton: false
        });

        this.resetForm();
        this.loadMyRequests();
      },
      error: () => {
        Swal.fire('Error', 'Failed to submit request', 'error');
      }
    });
  }
}

  editMissedPunch(item: any) {
    this.isEditMode = true;
    this.editId = item.missedPunchRequestID;

    this.missedPunchForm.patchValue({
      missedDate: item.missedDate,
      missedType: item.missedType,
      correctClockIn: item.correctClockIn,
      correctClockOut: item.correctClockOut,
      reason: item.reason
    });
  }

  resetForm() {
    this.missedPunchForm.reset();
    this.isEditMode = false;
    this.editId = null;
  }

  /* ================= LOAD DATA ================= */

loadMyRequests() {

  this.missedPunchService
    .getMissedPunchRequest(
      this.companyId,
      this.regionId,
      this.userId
    )
    .subscribe(res => {

      this.myRequests = res || [];

      this.filteredMyRequests = [...this.myRequests];

      this.myPage = 1;

      this.updateMyPagination();
    });
}

loadApprovalRequests() {

  this.missedPunchService
    .getApprovalMissedPunchRequest(
      this.companyId,
      this.regionId,
      this.managerId
    )
    .subscribe(res => {

      this.pendingRequests = res
        .filter((x: any) => x.status === 'Pending')
        .map((x: any) => ({
          ...x,
          selected: false,
          managerRemarks: x.managerRemarks || ''
        }));

      this.approvedRequests =
        res.filter((x: any) => x.status === 'Approved');

      this.rejectedRequests =
        res.filter((x: any) => x.status === 'Rejected');


      // Initialize Pending pagination
      this.filteredPendingRequests = [
        ...this.pendingRequests
      ];

      this.pendingPage = 1;

      this.updatePendingPagination();


      // Initialize Approved pagination
      this.filteredApprovedRequests = [
        ...this.approvedRequests
      ];

      this.approvedPage = 1;

      this.updateApprovedPagination();


      // Initialize Rejected pagination
      this.filteredRejectedRequests = [
        ...this.rejectedRequests
      ];

      this.rejectedPage = 1;

      this.updateRejectedPagination();

    });
}
filterApprovedRequests() {

  const search =
    this.approvedSearchText.trim().toLowerCase();

  if (!search) {

    this.filteredApprovedRequests =
      [...this.approvedRequests];

  } else {

    this.filteredApprovedRequests =
      this.approvedRequests.filter(item =>
        String(item.employeeName || '').toLowerCase().includes(search) ||
        String(item.missedDate || '').toLowerCase().includes(search) ||
        String(item.missedType || '').toLowerCase().includes(search) ||
        String(item.reason || '').toLowerCase().includes(search) ||
        String(item.managerRemarks || '').toLowerCase().includes(search)
      );
  }

  this.approvedPage = 1;

  this.updateApprovedPagination();
}


updateApprovedPagination() {

  this.approvedTotalPages = Math.max(
    1,
    Math.ceil(
      this.filteredApprovedRequests.length /
      this.approvedPageSize
    )
  );

  if (this.approvedPage > this.approvedTotalPages) {
    this.approvedPage = this.approvedTotalPages;
  }

  const startIndex =
    (this.approvedPage - 1) *
    this.approvedPageSize;

  const endIndex =
    startIndex +
    this.approvedPageSize;

  this.paginatedApprovedRequests =
    this.filteredApprovedRequests.slice(
      startIndex,
      endIndex
    );

  this.approvedPages = Array.from(
    { length: this.approvedTotalPages },
    (_, i) => i + 1
  );
}


approvedPageChange(page: number) {

  if (
    page < 1 ||
    page > this.approvedTotalPages
  ) {
    return;
  }

  this.approvedPage = page;

  this.updateApprovedPagination();
}


changeApprovedPageSize() {

  this.approvedPage = 1;

  this.updateApprovedPagination();
}
filterRejectedRequests() {

  const search =
    this.rejectedSearchText.trim().toLowerCase();

  if (!search) {

    this.filteredRejectedRequests =
      [...this.rejectedRequests];

  } else {

    this.filteredRejectedRequests =
      this.rejectedRequests.filter(item =>
        String(item.employeeName || '').toLowerCase().includes(search) ||
        String(item.missedDate || '').toLowerCase().includes(search) ||
        String(item.missedType || '').toLowerCase().includes(search) ||
        String(item.reason || '').toLowerCase().includes(search) ||
        String(item.managerRemarks || '').toLowerCase().includes(search)
      );
  }

  this.rejectedPage = 1;

  this.updateRejectedPagination();
}


updateRejectedPagination() {

  this.rejectedTotalPages = Math.max(
    1,
    Math.ceil(
      this.filteredRejectedRequests.length /
      this.rejectedPageSize
    )
  );

  if (this.rejectedPage > this.rejectedTotalPages) {
    this.rejectedPage = this.rejectedTotalPages;
  }

  const startIndex =
    (this.rejectedPage - 1) *
    this.rejectedPageSize;

  const endIndex =
    startIndex +
    this.rejectedPageSize;

  this.paginatedRejectedRequests =
    this.filteredRejectedRequests.slice(
      startIndex,
      endIndex
    );

  this.rejectedPages = Array.from(
    { length: this.rejectedTotalPages },
    (_, i) => i + 1
  );
}


rejectedPageChange(page: number) {

  if (
    page < 1 ||
    page > this.rejectedTotalPages
  ) {
    return;
  }

  this.rejectedPage = page;

  this.updateRejectedPagination();
}


changeRejectedPageSize() {

  this.rejectedPage = 1;

  this.updateRejectedPagination();
}

  
  approve(item: any) {

  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to approve this request?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Approve'
  }).then((result) => {
    if (result.isConfirmed) {

      const payload = {
        missedPunchRequestIds: [item.missedPunchRequestId],
        status: 'Approved',
        managerRemarks: item.managerRemarks,
        managerId: this.managerId,
        companyId: this.companyId,
        regionId: this.regionId,
        hrEmail: item.hrEmail
      };

      this.missedPunchService.bulkApproveRejectPunch(payload)
        .subscribe(() => {

          Swal.fire({
            icon: 'success',
            title: 'Approved!',
            text: 'Request approved successfully',
            timer: 2000,
            showConfirmButton: false
          });

          this.loadApprovalRequests();
        });
    }
  });
}

  

  reject(item: any) {

  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to reject this request?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Reject'
  }).then((result) => {
    if (result.isConfirmed) {

      const payload = {
        missedPunchRequestIds: [item.missedPunchRequestId],
        status: 'Rejected',
        managerRemarks: item.managerRemarks,
        managerId: this.managerId,
        companyId: this.companyId,
        regionId: this.regionId,
        hrEmail: item.hrEmail
      };

      this.missedPunchService.bulkApproveRejectPunch(payload)
        .subscribe(() => {

          Swal.fire({
            icon: 'success',
            title: 'Rejected!',
            text: 'Request rejected successfully',
            timer: 2000,
            showConfirmButton: false
          });

          this.loadApprovalRequests();
        });
    }
  });
}

  
  bulkApproveReject(status: 'Approved' | 'Rejected') {

  const selectedIds = this.pendingRequests
    .filter(x => x.selected)
    .map(x => x.missedPunchRequestId);

  if (selectedIds.length === 0) {
    Swal.fire('Warning', 'Please select at least one record', 'warning');
    return;
  }

  Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to ${status.toLowerCase()} selected requests?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `Yes, ${status}`
  }).then((result) => {
    if (result.isConfirmed) {

      const payload = {
        missedPunchRequestIds: selectedIds,
        status: status,
        managerRemarks: '',
        managerId: this.managerId,
        companyId: this.companyId,
        regionId: this.regionId,
         hrEmail: this.pendingRequests.find(x => x.selected)?.hrEmail  // ✅ add this
      };

      this.missedPunchService.bulkApproveRejectPunch(payload)
        .subscribe(() => {

          Swal.fire({
            icon: 'success',
            title: `${status}!`,
            text: `Selected requests ${status.toLowerCase()} successfully`,
            timer: 2000,
            showConfirmButton: false
          });

          this.loadApprovalRequests();
        });
    }
  });
}

  /* ================= SELECT ALL ================= */

  selectAll(event: any) {
    const checked = event.target.checked;
    this.pendingRequests.forEach(x => x.selected = checked);
  }

  canViewPersonal = false;
  canViewManager = false;
  canCreateMyRequest = false;
  canEditMyRequest = false;
  loadPermissions() {
    const menus = JSON.parse(sessionStorage.getItem("Menus") || "[]");

    const personal = menus.find(
      (m: any) => m.menuName?.trim().toLowerCase() === "my request"
    );

    const managerapproval = menus.find((m: any) =>
      m.menuName?.trim().toLowerCase() === "manager approval"
    );


    this.canViewPersonal = personal?.canView ?? false;
    this.canCreateMyRequest = personal?.canAdd ?? false;
    this.canEditMyRequest = personal?.canEdit ?? false;


    this.canViewManager = managerapproval?.canView ?? false;


    if (this.canViewPersonal) this.selectedTab = 'tab1';
    else if (this.canViewManager) this.selectedTab = 'tab2';

    console.log("Menus:", menus);
    console.log("Manager Approval:", managerapproval);

    menus.forEach((m: any) => {
      console.log("Menu Name:", m.menuName);
    });

  }
  filterMyRequests() {

  const search = this.mySearchText.trim().toLowerCase();

  if (!search) {
    this.filteredMyRequests = [...this.myRequests];
  } else {

    this.filteredMyRequests = this.myRequests.filter(item =>
      String(item.missedDate || '').toLowerCase().includes(search) ||
      String(item.missedType || '').toLowerCase().includes(search) ||
      String(item.correctClockIn || '').toLowerCase().includes(search) ||
      String(item.correctClockOut || '').toLowerCase().includes(search) ||
      String(item.reason || '').toLowerCase().includes(search) ||
      String(item.managerRemarks || '').toLowerCase().includes(search) ||
      String(item.status || '').toLowerCase().includes(search)
    );
  }

  this.myPage = 1;
  this.updateMyPagination();
}


updateMyPagination() {

  this.myTotalPages = Math.max(
    1,
    Math.ceil(this.filteredMyRequests.length / this.myPageSize)
  );

  if (this.myPage > this.myTotalPages) {
    this.myPage = this.myTotalPages;
  }

  const startIndex = (this.myPage - 1) * this.myPageSize;

  const endIndex = startIndex + this.myPageSize;

  this.paginatedMyRequests =
    this.filteredMyRequests.slice(startIndex, endIndex);

  this.myPages = Array.from(
    { length: this.myTotalPages },
    (_, i) => i + 1
  );
}


myPageChange(page: number) {

  if (page < 1 || page > this.myTotalPages) {
    return;
  }

  this.myPage = page;
  this.updateMyPagination();
}


changeMyPageSize() {

  this.myPage = 1;
  this.updateMyPagination();
}

filterPendingRequests() {

  const search = this.pendingSearchText.trim().toLowerCase();

  if (!search) {

    this.filteredPendingRequests = [
      ...this.pendingRequests
    ];

  } else {

    this.filteredPendingRequests =
      this.pendingRequests.filter(item =>
        String(item.employeeName || '').toLowerCase().includes(search) ||
        String(item.missedDate || '').toLowerCase().includes(search) ||
        String(item.missedType || '').toLowerCase().includes(search) ||
        String(item.correctClockIn || '').toLowerCase().includes(search) ||
        String(item.correctClockOut || '').toLowerCase().includes(search) ||
        String(item.reason || '').toLowerCase().includes(search) ||
        String(item.managerRemarks || '').toLowerCase().includes(search)
      );
  }

  this.pendingPage = 1;

  this.updatePendingPagination();
}


updatePendingPagination() {

  this.pendingTotalPages = Math.max(
    1,
    Math.ceil(
      this.filteredPendingRequests.length /
      this.pendingPageSize
    )
  );

  if (this.pendingPage > this.pendingTotalPages) {
    this.pendingPage = this.pendingTotalPages;
  }

  const startIndex =
    (this.pendingPage - 1) * this.pendingPageSize;

  const endIndex =
    startIndex + this.pendingPageSize;

  this.paginatedPendingRequests =
    this.filteredPendingRequests.slice(
      startIndex,
      endIndex
    );

  this.pendingPages = Array.from(
    { length: this.pendingTotalPages },
    (_, i) => i + 1
  );
}


pendingPageChange(page: number) {

  if (
    page < 1 ||
    page > this.pendingTotalPages
  ) {
    return;
  }

  this.pendingPage = page;

  this.updatePendingPagination();
}


changePendingPageSize() {

  this.pendingPage = 1;

  this.updatePendingPagination();
}
  
}

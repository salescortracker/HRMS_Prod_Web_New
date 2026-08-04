import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import {
  AdminService,
  Company,
  Region,
  ShiftMasterDto
} from '../../servies/admin.service';

import { BreakPolicyService } from '../../services/break-policy.service';
import { BreakPolicy } from '../../layout/models/break-policy.model';
@Component({
  selector: 'app-break-policy',
  standalone: false,
  templateUrl: './break-policy.component.html',
  styleUrl: './break-policy.component.css'
})
export class BreakPolicyComponent {
 breakPolicy: any = this.getEmptyBreakPolicy();

  breakPolicies: any[] = [];

  companies: Company[] = [];
  regions: Region[] = [];
  filteredRegions: Region[] = [];
  shifts: ShiftMasterDto[] = [];

  showForm = false;
  isEditMode = false;

  searchText = '';
  statusFilter: any = '';

  currentPage = 1;
  pageSize = 5;

  userId =
    sessionStorage.getItem('UserId')
      ? Number(sessionStorage.getItem('UserId'))
      : 0;

  constructor(
    private breakPolicyService: BreakPolicyService,
    private userService: AdminService
  ) { }

  ngOnInit(): void {

    this.loadCompanies();
    this.loadRegions();
    this.loadShifts();
    this.loadBreakPolicies();

  }

  getEmptyBreakPolicy() {

    return {

      breakPolicyId: 0,

      companyId: 0,
      companyName: '',

      regionId: 0,
      regionName: '',

      userId: this.userId,

      policyCode: '',
      policyName: '',

      breakType: '',

      // NEW
      breakFromTime: '',
      breakToTime: '',

      durationMinutes: 0,

      maxBreaksPerDay: 0,

      graceMinutes: 0,

      shiftId: 0,
      shiftName: '',

      isActive: true

    };

  }

  openForm() {

    this.showForm = true;

  }

  loadCompanies(): void {

    this.userService.getCompanies(null, this.userId).subscribe({

      next: (res: any) => {

        const data = res?.data ?? res ?? [];

        this.companies =
          data.filter((x: any) => x.isActive);

      },

      error: () =>
        Swal.fire(
          'Error',
          'Failed to load companies',
          'error'
        )

    });

  }

  loadRegions(): void {

    this.userService.getRegions(null, this.userId).subscribe({

      next: (res: any) => {

        const data = res?.data ?? res ?? [];

        this.regions =
          data.filter((x: any) => x.isActive);

      },

      error: () =>
        Swal.fire(
          'Error',
          'Failed to load regions',
          'error'
        )

    });

  }

  loadShifts(): void {

    this.userService.getAllShifts(this.userId).subscribe({

      next: (res: ShiftMasterDto[]) => {

        this.shifts = res;

      },

      error: () =>
        Swal.fire(
          'Error',
          'Failed to load shifts',
          'error'
        )

    });

  }

  onCompanyChange(): void {

    if (!this.breakPolicy.companyId) {

      this.filteredRegions = [];
      this.breakPolicy.regionId = 0;
      return;

    }

    this.filteredRegions =
      this.regions.filter(
        x => Number(x.companyID) === Number(this.breakPolicy.companyId)
      );

    this.breakPolicy.regionId = 0;

  }

  //=========================================
  // Calculate Duration
  //=========================================

  calculateDuration(): void {

    if (
      !this.breakPolicy.breakFromTime ||
      !this.breakPolicy.breakToTime
    ) {

      this.breakPolicy.durationMinutes = 0;
      return;

    }

    const from =
      this.breakPolicy.breakFromTime.split(':');

    const to =
      this.breakPolicy.breakToTime.split(':');

    let fromMinutes =
      Number(from[0]) * 60 +
      Number(from[1]);

    let toMinutes =
      Number(to[0]) * 60 +
      Number(to[1]);

    // Next Day Support

    if (toMinutes < fromMinutes) {

      toMinutes += 24 * 60;

    }

    this.breakPolicy.durationMinutes =
      toMinutes - fromMinutes;

  }

  //=========================================
  // Validate Time
  //=========================================

  validateBreakTime(): boolean {

    if (
      !this.breakPolicy.breakFromTime ||
      !this.breakPolicy.breakToTime
    ) {

      Swal.fire(
        'Warning',
        'Please select Break From Time and Break To Time.',
        'warning'
      );

      return false;

    }

    this.calculateDuration();

    if (this.breakPolicy.durationMinutes <= 0) {

      Swal.fire(
        'Warning',
        'Break duration should be greater than zero.',
        'warning'
      );

      return false;

    }

    return true;

  }
  //=========================================
  // Save
  //=========================================

  save() {

    if (!this.breakPolicy.companyId) {

      Swal.fire(
        'Warning',
        'Please select Company',
        'warning'
      );

      return;

    }

    if (!this.breakPolicy.regionId) {

      Swal.fire(
        'Warning',
        'Please select Region',
        'warning'
      );

      return;

    }

    if (!this.breakPolicy.policyCode) {

      Swal.fire(
        'Warning',
        'Enter Policy Code',
        'warning'
      );

      return;

    }

    if (!this.breakPolicy.policyName) {

      Swal.fire(
        'Warning',
        'Enter Policy Name',
        'warning'
      );

      return;

    }

    if (!this.validateBreakTime()) {
      return;
    }

    this.breakPolicy.userId = this.userId;

    // Calculate duration before save
    this.calculateDuration();

    if (this.isEditMode) {

      this.breakPolicyService.update(this.breakPolicy).subscribe({

        next: (res: any) => {

          if (res.success) {

            Swal.fire(
              'Updated',
              res.message,
              'success'
            );

            this.loadBreakPolicies();

            this.resetForm();

          }

          else {

            Swal.fire(
              'Warning',
              res.message,
              'warning'
            );

          }

        },

        error: (err: any) => {

          Swal.fire(
            'Error',
            err.error?.message || 'Update Failed',
            'error'
          );

        }

      });

    }

    else {

      this.breakPolicyService.create(this.breakPolicy).subscribe({

        next: (res: any) => {

          if (res.success) {

            Swal.fire(
              'Created',
              res.message,
              'success'
            );

            this.loadBreakPolicies();

            this.resetForm();

          }

          else {

            Swal.fire(
              'Warning',
              res.message,
              'warning'
            );

          }

        },

        error: (err: any) => {

          Swal.fire(
            'Warning',
            err.error?.message || 'Operation Failed',
            'warning'
          );

        }

      });

    }

  }

  //=========================================
  // Edit
  //=========================================

  edit(item: any) {

    this.breakPolicy = {

      ...item,

      breakFromTime:
        item.breakFromTime
          ? item.breakFromTime.substring(0, 5)
          : '',

      breakToTime:
        item.breakToTime
          ? item.breakToTime.substring(0, 5)
          : ''

    };

    this.isEditMode = true;

    this.showForm = true;

    this.filteredRegions =
      this.regions.filter(
        r => Number(r.companyID) === Number(this.breakPolicy.companyId)
      );

    this.calculateDuration();

  }

  //=========================================
  // Delete
  //=========================================

  delete(id: number) {

    const row =
      this.breakPolicies.find(
        x => x.breakPolicyId === id
      );

    Swal.fire({

      title: `Delete "${row?.policyName}"?`,

      text: "You won't be able to revert this.",

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Delete'

    }).then(result => {

      if (result.isConfirmed) {

        this.breakPolicyService.delete(id).subscribe({

          next: (res: any) => {

            if (res.success) {

              Swal.fire(
                'Deleted',
                res.message,
                'success'
              );

              this.loadBreakPolicies();

            }

            else {

              Swal.fire(
                'Warning',
                res.message,
                'warning'
              );

            }

          },

          error: (err: any) => {

            Swal.fire(
              'Error',
              err.error?.message ||
              'Unable to delete Break Policy',
              'error'
            );

          }

        });

      }

    });

  }
  loadBreakPolicies(): void {

    if (!this.userId) {

      Swal.fire('Error', 'User not found', 'error');
      return;

    }

    this.breakPolicyService.getAll(this.userId).subscribe({

      next: (res: any) => {

        if (res.success) {

          this.breakPolicies = res.data;

        }

        else {

          this.breakPolicies = [];

        }

      },

      error: () => {

        Swal.fire(
          'Error',
          'Failed to load Break Policies',
          'error'
        );

      }

    });

  }


  

  //=========================================
  // Reset Form
  //=========================================

  resetForm() {

    this.breakPolicy =
      this.getEmptyBreakPolicy();

    this.filteredRegions = [];

    this.isEditMode = false;

    this.showForm = false;

  }
  //=========================================
  // Filtered Break Policies
  //=========================================

  get filteredBreakPolicies() {

    return this.breakPolicies.filter(bp =>

      (

        !this.searchText ||

        bp.policyCode?.toLowerCase().includes(this.searchText.toLowerCase()) ||

        bp.policyName?.toLowerCase().includes(this.searchText.toLowerCase()) ||

        bp.companyName?.toLowerCase().includes(this.searchText.toLowerCase()) ||

        bp.regionName?.toLowerCase().includes(this.searchText.toLowerCase()) ||

        bp.shiftName?.toLowerCase().includes(this.searchText.toLowerCase()) ||

        bp.breakType?.toLowerCase().includes(this.searchText.toLowerCase()) ||

        bp.breakFromTime?.toLowerCase().includes(this.searchText.toLowerCase()) ||

        bp.breakToTime?.toLowerCase().includes(this.searchText.toLowerCase())

      )

      &&

      (

        this.statusFilter === '' ||

        bp.isActive === this.statusFilter

      )

    );

  }

  //=========================================
  // Total Pages
  //=========================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredBreakPolicies.length / this.pageSize
    );

  }

  //=========================================
  // Current Page Data
  //=========================================

  get pagedBreakPolicies() {

    const start =
      (this.currentPage - 1) * this.pageSize;

    return this.filteredBreakPolicies.slice(
      start,
      start + this.pageSize
    );

  }

  //=========================================
  // Pagination
  //=========================================

  goToPage(page: number) {

    if (page >= 1 && page <= this.totalPages) {

      this.currentPage = page;

    }

  }

  //=========================================
  // SweetAlert Error
  //=========================================

  showError(message: string) {

    Swal.fire(
      'Error',
      message,
      'error'
    );

  }



}


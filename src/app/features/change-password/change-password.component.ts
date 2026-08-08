import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../admin/servies/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  userId!: number;

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) { }

changePassword() {

  this.errorMessage = '';

  // Required validation
  if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
    this.errorMessage = 'All fields are required.';
    return;
  }

  // New password should not be same as old password
  if (this.oldPassword === this.newPassword) {
    this.errorMessage = 'New Password must not be the same as the Old Password.';
    return;
  }

  // Confirm password should match new password
  if (this.newPassword !== this.confirmPassword) {
    this.errorMessage = 'Confirm Password must match the New Password.';
    return;
  }

  this.loading = true;

  this.adminService.changePassword({
    UserID: sessionStorage.getItem('UserId')
      ? +sessionStorage.getItem('UserId')!
      : 0,
    oldPassword: this.oldPassword,
    newPassword: this.newPassword
  }).subscribe({
    next: () => {
      this.loading = false;

      Swal.fire(
        'Success',
        'Password changed successfully',
        'success'
      );

      this.router.navigate(['/']);
    },
    error: err => {
      this.loading = false;
      this.errorMessage =
        err.error?.message || 'Something went wrong';
    }
  });
}
 
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  toggleOldPassword() {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}

import { Component } from '@angular/core';
import { EmployeeResignationService } from '../employee-services/employee-resignation.service';
import { employeeprofile } from '../../../admin/layout/models/employeeprofile.model';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-profile',
  standalone: false,

  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  profile!: employeeprofile;
  userId: number | null = null;
  companyName: string = '';
regionName: string = '';
designationName: string = '';
departmentName: string = '';
  profileImage: string = '';

  constructor(private profileService: EmployeeResignationService) { }
  ngOnInit(): void {
      
  this.companyName = sessionStorage.getItem('CompanyName') || '';
  this.regionName = sessionStorage.getItem('RegionName') || '';

  this.designationName =
  sessionStorage.getItem('DesignationName') ||
  sessionStorage.getItem('Designation') ||
  '';

this.departmentName =
  sessionStorage.getItem('DepartmentName') ||
  sessionStorage.getItem('Department') ||
  '';

    const storedUserId = sessionStorage.getItem('UserId');

if (storedUserId) {
  this.userId = +storedUserId;
  this.loadProfile();
  this.loadProfilePicture();
} else {
  console.error('No user logged in');
}

  }
  employeeCode: number = 0;
  shiftAllocationName: string = '';
  ShiftstartTime: string = '';
  ShiftendTime: string = '';
  getLinkedInUrl(value: string): string {
  if (!value) {
    return '#';
  }

  value = value.trim();

  // If full URL is already stored
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // If only username is stored
  return `https://www.linkedin.com/in/${value}`;
}
  getshiftallocationName() {
    debugger;
    this.employeeCode = sessionStorage.getItem('EmployeeCode') as unknown as number;
    this.profileService.getShiftallocationName(this.employeeCode).subscribe(res => {
      console.log('Shift Allocation Name:', res);
      this.shiftAllocationName = res.shiftName;
      this.ShiftstartTime = res.shiftStartTime;
      this.ShiftendTime = res.shiftEndTime;

    });
  }
  loadProfilePicture() {
  if (!this.userId) {
    this.profileImage = 'assets/images/default-profile.png';
    return;
  }

  this.profileService.GetByUserIdempProfile(this.userId)
    .subscribe({
      next: (res: any) => {

        console.log('PROFILE PICTURE RESPONSE 👉', res);

        const path = res?.profilePictureName;

        this.profileImage = path
          ? `${environment.baseurl}/${path}`
          : 'assets/images/default-profile.png';

        console.log('PROFILE IMAGE URL 👉', this.profileImage);
      },

      error: (err) => {
        console.error('Failed to load profile picture:', err);
        this.profileImage = 'assets/images/default-profile.png';
      }
    });
}

  loadProfile() {
    if (!this.userId) return;
    
    this.profileService.GetempProfile(this.userId).subscribe({
      next: (res: any) => {
          console.log('Profile Response:', res);
        if (res && res.data) {
          this.profile = res.data;
           this.companyName = res.data.companyName;
        this.regionName = res.data.regionName;
        this.designationName =
    res.data.designationName ||
    res.data.designation ||
    sessionStorage.getItem('DesignationName') ||
    sessionStorage.getItem('Designation') ||
    '';

  this.departmentName =
    res.data.departmentName ||
    res.data.department ||
    sessionStorage.getItem('DepartmentName') ||
    sessionStorage.getItem('Department') ||
    '';
        }
      },
      error: (err) => {
        console.error('Error loading profile', err);
      }
    });
  }

}
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AdminService } from '../../../admin/servies/admin.service';
import { EmployeeResignationService } from '../employee-services/employee-resignation.service';
@Component({
  selector: 'app-employee-all-details',
  standalone: false,
  templateUrl: './employee-all-details.component.html',
  styleUrl: './employee-all-details.component.css'
})
export class EmployeeAllDetailsComponent {
employees: any[] = [];
filteredEmployees: any[] = [];

companyId!: number;
regionId!: number;
Math = Math;
searchText = '';
constructor(private service: EmployeeResignationService
    , route: Router, private adminService: AdminService
    ) {
  
}
ngOnInit(): void {

  this.companyId = Number(sessionStorage.getItem('CompanyId'));
  this.regionId = Number(sessionStorage.getItem('RegionId'));

  this.loadEmployees();
  this.loadEmergency();
  this.loadFamily();
  this.loadReference();

}
getUserId(item: any): number | null {

  if (!item) {
    return null;
  }

  const userId =
    item.userId ??
    item.UserId ??
    item.userID ??
    item.UserID;

  if (
    userId === null ||
    userId === undefined ||
    userId === ''
  ) {
    return null;
  }

  const id = Number(userId);

  return Number.isInteger(id) ? id : null;
}

loadEmployees() {

  this.service
    .getEmployeePersonalDetails(
      this.companyId,
      this.regionId
    )
    .subscribe({

      next: (res) => {

        this.employees = res || [];

        this.filteredEmployees = [
          ...this.employees
        ];

        this.currentPage = 1;

        this.loadPagination();

      },

      error: (err) => {

        console.log(err);

      }

    });

}
getEmployeeName(item: any): string {

  // If API already returns employee name
  if (item.employeeName) {
    return item.employeeName;
  }

  if (item.employeeFullName) {
    return item.employeeFullName;
  }

  if (item.fullName) {
    return item.fullName;
  }

  // Get employee using INT userId
  const userId = this.getUserId(item);

  if (userId !== null) {

    const employee = this.employees.find(emp =>
      this.getUserId(emp) === userId
    );

    if (employee) {

      return `${employee.firstName || ''} ${employee.lastName || ''}`
        .trim() || '-';

    }
  }

  return '-';
}


getEmployeeCode(item: any): string {

  // If API already returns employee code
  if (item.employeeCode) {
    return String(item.employeeCode);
  }

  if (item.employeeNumber) {
    return String(item.employeeNumber);
  }

  // Get employee using INT userId
  const userId = this.getUserId(item);

  if (userId !== null) {

    const employee = this.employees.find(emp =>
      this.getUserId(emp) === userId
    );

    if (employee) {

      return String(
        employee.employeeCode ??
        employee.employeeNumber ??
        '-'
      );

    }
  }

  return '-';
}
filterAllEmployees(): void {

  const search = (this.searchText || '').trim().toLowerCase();

  if (!search) {

    this.filteredEmployees = [...this.employees];
    this.filteredFamily = [...this.familyList];
    this.filteredEmergency = [...this.emergencyList];
    this.filteredReferences = [...this.referenceList];

    this.currentPage = 1;
    this.loadPagination();

    return;
  }

  this.filteredEmployees = this.employees.filter(emp =>

    this.searchValue(emp.firstName, search) ||

    this.searchValue(emp.lastName, search) ||

    this.searchValue(
      `${emp.firstName || ''} ${emp.lastName || ''}`,
      search
    ) ||

    this.searchValue(emp.employeeCode, search) ||

    this.searchValue(emp.employeeNumber, search) ||

    this.searchValue(emp.personalEmail, search) ||

    this.searchValue(emp.mobileNumber, search) ||

    this.searchValue(emp.employeeType, search) ||

    this.searchValue(emp.bandGrade, search) ||

    this.searchValue(emp.bloodGroup, search) ||

    this.searchValue(emp.panNumber, search) ||

    this.searchValue(emp.aadhaarNumber, search)

  );

  const matchingUserIds: number[] =
    this.filteredEmployees
      .map(emp => this.getUserId(emp))
      .filter((id): id is number => id !== null);

  this.filteredFamily = this.familyList.filter(item => {

    const itemUserId = this.getUserId(item);

    return (
      itemUserId !== null &&
      matchingUserIds.includes(itemUserId)
    );

  });

  this.filteredEmergency = this.emergencyList.filter(item => {

    const itemUserId = this.getUserId(item);

    return (
      itemUserId !== null &&
      matchingUserIds.includes(itemUserId)
    );

  });

  this.filteredReferences = this.referenceList.filter(item => {

    const itemUserId = this.getUserId(item);

    return (
      itemUserId !== null &&
      matchingUserIds.includes(itemUserId)
    );

  });

  this.currentPage = 1;
  this.loadPagination();
}


// ============================================================
// SEARCH HELPER
// ============================================================

searchValue(value: any, search: string): boolean {

  if (value === null || value === undefined) {
    return false;
  }

  return String(value)
    .toLowerCase()
    .includes(search);
}
familyList:any[]=[];
filteredFamily:any[]=[];
searchTextfamily='';

loadFamily() {

  this.service
    .getEmployeeFamilyDetails(
      this.companyId,
      this.regionId
    )
    .subscribe({

      next: (res) => {

        this.familyList = res || [];

        this.filteredFamily = [
          ...this.familyList
        ];

      },

      error: (err) => {

        console.error(err);

      }

    });

}

emergencyList: any[] = [];
filteredEmergency: any[] = [];

searchTextemergency = '';


loadEmergency() {

  this.service
    .getEmployeeEmergencyContacts(
      this.companyId,
      this.regionId
    )
    .subscribe({

      next: (res: any[]) => {

        this.emergencyList = res || [];

        this.filteredEmergency = [
          ...this.emergencyList
        ];

      },

      error: (err) => {

        console.error(
          'Error loading emergency contacts',
          err
        );

      }

    });

}

referenceList: any[] = [];
filteredReferences: any[] = [];

searchTextreference = '';
loadReference() {

  this.service
    .getEmployeeReferences(
      this.companyId,
      this.regionId
    )
    .subscribe({

      next: (res: any[]) => {

        this.referenceList = res || [];

        this.filteredReferences = [
          ...this.referenceList
        ];

      },

      error: (err) => {

        console.error(
          'Error loading employee references',
          err
        );

      }

    });

}

selectedEmployee: any;

activeTab = 'personal';

pageSize = 10;

currentPage = 1;

totalPages = 0;

pages:number[]=[];

pagedEmployees:any[]=[];
loadPagination(){

this.totalPages =
Math.ceil(this.filteredEmployees.length/this.pageSize);

this.pages =
Array.from({length:this.totalPages},
(_,i)=>i+1);

const start=(this.currentPage-1)*this.pageSize;

this.pagedEmployees=
this.filteredEmployees.slice(
start,
start+this.pageSize
);

}
previousPage(){

if(this.currentPage>1){

this.currentPage--;

this.loadPagination();

}

}
goToPage(page:number){

this.currentPage=page;

this.loadPagination();

}
selectEmployee(emp:any){

this.selectedEmployee=emp;

this.activeTab='personal';

}

nextPage(){

if(this.currentPage<this.totalPages){

this.currentPage++;

this.loadPagination();

}

}
}

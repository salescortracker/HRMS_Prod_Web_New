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

loadEmployees() {

  this.service
      .getEmployeePersonalDetails(this.companyId, this.regionId)
      .subscribe({

        next: (res) => {

          this.employees = res;
          this.filteredEmployees = res;

        },

        error: (err) => {

          console.log(err);

        }

      });

}
filterEmployees() {

    const search = this.searchText.toLowerCase();

    this.filteredEmployees = this.employees.filter(x =>

        (x.firstName ?? '').toLowerCase().includes(search)

        ||

        (x.lastName ?? '').toLowerCase().includes(search)

        ||

        (x.personalEmail ?? '').toLowerCase().includes(search)

        ||

        (x.mobileNumber ?? '').includes(search)

        ||

        (x.employeeType ?? '').toLowerCase().includes(search)

        ||

        (x.bandGrade ?? '').toLowerCase().includes(search)

        ||

        (x.bloodGroup ?? '').toLowerCase().includes(search)

    );

}
familyList:any[]=[];
filteredFamily:any[]=[];
searchTextfamily='';

loadFamily(){

this.service
.getEmployeeFamilyDetails(this.companyId,this.regionId)
.subscribe(res=>{

this.familyList=res;
this.filteredFamily=res;

});

}
filterFamily(){

const txt=this.searchTextfamily.toLowerCase();

this.filteredFamily=this.familyList.filter(x=>

(x.name??'').toLowerCase().includes(txt)

||

(x.relationship??'').toLowerCase().includes(txt)

||

(x.phone??'').includes(txt)

||

(x.occupation??'').toLowerCase().includes(txt)

);

}
emergencyList: any[] = [];
filteredEmergency: any[] = [];

searchTextemergency = '';


loadEmergency() {

  this.service
      .getEmployeeEmergencyContacts(this.companyId, this.regionId)
      .subscribe({

        next: (res: any[]) => {

          this.emergencyList = res;
          this.filteredEmergency = res;

        },

        error: (err) => {

          console.error('Error loading emergency contacts', err);

        }

      });

}
filterEmergency() {

  const txt = this.searchTextemergency.toLowerCase();

  this.filteredEmergency = this.emergencyList.filter(x =>

    (x.contactName ?? '').toLowerCase().includes(txt) ||

    (x.phoneNumber ?? '').includes(txt) ||

    (x.alternatePhone ?? '').includes(txt) ||

    (x.email ?? '').toLowerCase().includes(txt) ||

    (x.address ?? '').toLowerCase().includes(txt)

  );

}
referenceList: any[] = [];
filteredReferences: any[] = [];

searchTextreference = '';
loadReference() {

  this.service
      .getEmployeeReferences(this.companyId, this.regionId)
      .subscribe({

        next: (res: any[]) => {

          this.referenceList = res;
          this.filteredReferences = res;

        },

        error: (err) => {

          console.error('Error loading employee references', err);

        }

      });

}
filterReference() {

  const txt = this.searchTextreference.toLowerCase();

  this.filteredReferences = this.referenceList.filter(x =>

    (x.name ?? '').toLowerCase().includes(txt) ||

    (x.titleOrDesignation ?? '').toLowerCase().includes(txt) ||

    (x.companyName ?? '').toLowerCase().includes(txt) ||

    (x.emailID ?? '').toLowerCase().includes(txt) ||

    (x.mobileNumber ?? '').includes(txt)

  );

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

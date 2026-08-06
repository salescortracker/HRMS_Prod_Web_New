import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AdminService } from '../../../admin/servies/admin.service';

export interface EmployeeOfferLetterDto {

  employeeOfferLetterId: number;

  companyId: number;

  regionId: number;

  userId: number;

  employeeId: number;

  employeeCode: string;

  employeeName: string;

  email: string;

  department: string;

  designation: string;

  annualPackage: number;

  joiningDate: string;

  offerLetterPath?: string;

  isSent?: boolean;

}

@Component({
  selector: 'app-employee-offer-letter',
  standalone: false,
  templateUrl: './employee-offer-letter.component.html',
  styleUrl: './employee-offer-letter.component.css'
})
export class EmployeeOfferLetterComponent {
  offerForm!: FormGroup;


  employees: any[] = [];



  currentUserId: number = 0;

  companyId: number = 0;

  regionId: number = 0;



  constructor(
    private fb: FormBuilder,
    private adminSvc: AdminService
  ) {


    this.currentUserId =
      Number(sessionStorage.getItem('UserId') || 0);


    this.companyId =
      Number(sessionStorage.getItem('CompanyId') || 0);



    this.regionId =
      Number(sessionStorage.getItem('RegionId') || 0);


  }




  ngOnInit(): void {

    this.initForm();


    this.loadEmployees();


  }





  initForm() {


    this.offerForm = this.fb.group({

      userId: [
        '',
        Validators.required
      ],


      employeeCode: [
        {
          value: '',
          disabled: true
        }
      ],


      package: [
        '',
        Validators.required
      ],


      designation: [
        ''
      ],


      department: [
        ''
      ],


      joiningDate: [
        '',
        Validators.required
      ]


    });


  }
  loadEmployees() {


    this.adminSvc.GetcmpregAllUsers()
      .subscribe({

        next: (res: any) => {


          this.employees = res.map((u: any) => ({

            userId: u.userId,

            employeeCode: u.employeeCode,

            fullName: u.fullName,

            email: u.email,

            companyId: u.companyId,

            regionId: u.regionId

          }));


          console.log(
            "Employees",
            this.employees
          );


        },


        error: (err) => {


          console.error(
            err
          );


          Swal.fire(
            'Error',
            'Failed to load employees',
            'error'
          );


        }


      });


  }







  onEmployeeChange(event: any) {


    const userId =
      Number(event.target.value);



    const emp =
      this.employees.find(
        x => x.userId === userId
      );



    if (emp) {


      this.offerForm.patchValue({

        employeeCode:
          emp.employeeCode


      });


    }

    else {

      this.offerForm.patchValue({

        employeeCode: ''

      });

    }


  }

  saveOfferLetter() {

    if (this.offerForm.invalid) {

      this.offerForm.markAllAsTouched();

      Swal.fire(
        'Validation',
        'Please fill all required fields',
        'warning'
      );

      return;
    }

    const form = this.offerForm.getRawValue();

    const emp = this.employees.find(
      (x: any) => x.userId == form.userId
    );

    if (!emp) {

      Swal.fire(
        'Error',
        'Employee not found.',
        'error'
      );

      return;
    }

    const dto = {

      employeeOfferLetterId: 0,

      companyId: this.companyId,

      regionId: this.regionId,

      userId: this.currentUserId,

      employeeId: emp.userId,

      employeeCode: emp.employeeCode,

      employeeName: emp.fullName,

      email: emp.email,

      department: form.department,

      designation: form.designation,

      annualPackage: Number(form.package),

      joiningDate: form.joiningDate,

      offerLetterPath: "",

      isSent: false

    };

    this.adminSvc.saveEmployeeOfferLetter(dto).subscribe({

      next: (res: any) => {

        // Backend should return EmployeeOfferLetterId
        const id =
          res.employeeOfferLetterId ??
          res.id ??
          res.data?.employeeOfferLetterId;

        if (!id) {

          Swal.fire(
            'Error',
            'EmployeeOfferLetterId was not returned from API.',
            'error'
          );

          return;
        }

        this.adminSvc.sendEmployeeOfferLetter(id).subscribe({

          next: () => {

            Swal.fire({

              icon: 'success',

              title: 'Success',

              text: 'Offer Letter generated, PDF saved and email sent successfully.',

              timer: 2500,

              showConfirmButton: false

            });

            this.offerForm.reset();

            this.offerForm.patchValue({

              employeeCode: ''

            });

          },

          error: (err: any) => {

            console.error(err);

            Swal.fire(
              'Error',
              err?.error?.message || 'Failed to send Offer Letter.',
              'error'
            );

          }

        });

      },

      error: (err: any) => {

        console.error(err);

        Swal.fire(
          'Error',
          err?.error?.message || 'Failed to save Offer Letter.',
          'error'
        );

      }

    });

  }






}

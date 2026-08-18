import { Component, OnInit } from '@angular/core';
import { AdminService, Region, Company } from '../../servies/admin.service';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-region',
  standalone: false,
  templateUrl: './region.component.html',
  styleUrl: './region.component.css'
})
export class RegionComponent {
 regions: Region[] = [];
  companies: Company[] = [];
  region: Region = this.getEmptyRegion();

  isEditMode = false;
  searchText = '';
  statusFilter: boolean | '' = '';
  showUploadPopup = false;

  // Sorting
  sortColumn: string = 'regionID';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  pagedRegions: Region[] = [];
  timeZones: { label: string; value: string }[] = [];

  constructor(
    private adminService: AdminService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.loadTimeZones();
    this.loadCompanies();
    this.loadRegions();
  }

  // ✅ Load Companies
  loadCompanies(): void {
    this.adminService.getCompanies(null, this.region.userId).subscribe({
    next: (data: any[]) => {
      console.log('All Companies 👉', data);

      // 🔥 Filter only active companies
      this.companies = (data || []).filter((c: any) => c.isActive === true);

      console.log('Active Companies 👉', this.companies);
    },
    error: (err) => console.error('Error loading companies:', err)
  });
  }

  // ✅ Get Company Name
  getCompanyName(companyID: number): string {
    const company = this.companies.find(c => c.companyId === companyID);
    return  company ? company.companyName : '-';
  }

  // ✅ Empty Region Template
  getEmptyRegion(): Region {
   return { regionID: 0, companyID: 0, regionName: '', country: '', timeZoneId: '', isActive: true,userId: sessionStorage.getItem('UserId') ? Number(sessionStorage.getItem('UserId')) : 0 };
  }
  

  // ✅ Load Regions (Latest First)
  loadRegions(): void {
    this.spinner.show();
    this.adminService.getRegions(null,this.region.userId).subscribe({
      next: (data: Region[]) => {
        // Sort by regionID descending → latest first
        this.regions = data.sort((a, b) => b.regionID - a.regionID);
        this.applySorting();
        this.updatePagedRegions();
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error loading regions:', err);
        this.spinner.hide();
      }
    });
  }
  loadTimeZones(): void {
  this.timeZones = [
    { value: 'Etc/GMT+12', label: '(UTC-12:00) International Date Line West' },
    { value: 'Etc/GMT+11', label: '(UTC-11:00) Coordinated Universal Time-11' },
    { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
    { value: 'America/Adak', label: '(UTC-10:00) Aleutian Islands' },
    { value: 'Pacific/Marquesas', label: '(UTC-09:30) Marquesas Islands' },
    { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
    { value: 'Etc/GMT+9', label: '(UTC-09:00) Coordinated Universal Time-09' },

    { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
    { value: 'America/Tijuana', label: '(UTC-08:00) Baja California' },
    { value: 'Etc/GMT+8', label: '(UTC-08:00) Coordinated Universal Time-08' },

    { value: 'America/Phoenix', label: '(UTC-07:00) Arizona' },
    { value: 'America/Chihuahua', label: '(UTC-07:00) Chihuahua, La Paz, Mazatlan' },
    { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
    { value: 'America/Whitehorse', label: '(UTC-07:00) Yukon' },

    { value: 'America/Guatemala', label: '(UTC-06:00) Central America' },
    { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
    { value: 'Pacific/Easter', label: '(UTC-06:00) Easter Island' },
    { value: 'America/Mexico_City', label: '(UTC-06:00) Guadalajara, Mexico City, Monterrey' },
    { value: 'America/Regina', label: '(UTC-06:00) Saskatchewan' },

    { value: 'America/Bogota', label: '(UTC-05:00) Bogota, Lima, Quito, Rio Branco' },
    { value: 'America/Cancun', label: '(UTC-05:00) Chetumal' },
    { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
    { value: 'America/Havana', label: '(UTC-05:00) Havana' },
    { value: 'America/Indiana/Indianapolis', label: '(UTC-05:00) Indiana (East)' },
    { value: 'America/Grand_Turk', label: '(UTC-05:00) Turks and Caicos' },

    { value: 'America/Halifax', label: '(UTC-04:00) Atlantic Time (Canada)' },
    { value: 'America/Caracas', label: '(UTC-04:00) Caracas' },
    { value: 'America/Cuiaba', label: '(UTC-04:00) Cuiaba' },
    { value: 'America/La_Paz', label: '(UTC-04:00) Georgetown, La Paz, Manaus, San Juan' },
    { value: 'America/Santiago', label: '(UTC-04:00) Santiago' },

    { value: 'America/St_Johns', label: '(UTC-03:30) Newfoundland' },

    { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) City of Buenos Aires' },
    { value: 'America/Asuncion', label: '(UTC-03:00) Asuncion' },
    { value: 'America/Sao_Paulo', label: '(UTC-03:00) Brasilia' },
    { value: 'America/Fortaleza', label: '(UTC-03:00) Cayenne, Fortaleza' },
    { value: 'America/Montevideo', label: '(UTC-03:00) Montevideo' },
    { value: 'America/Punta_Arenas', label: '(UTC-03:00) Punta Arenas' },
    { value: 'America/Miquelon', label: '(UTC-03:00) Saint Pierre and Miquelon' },
    { value: 'America/Araguaina', label: '(UTC-03:00) Araguaina' },

    { value: 'Etc/GMT+2', label: '(UTC-02:00) Coordinated Universal Time-02' },
    { value: 'America/Godthab', label: '(UTC-03:00) Greenland' },

    { value: 'Atlantic/Azores', label: '(UTC-01:00) Azores' },
    { value: 'Atlantic/Cape_Verde', label: '(UTC-01:00) Cabo Verde Is.' },

    { value: 'UTC', label: '(UTC) Coordinated Universal Time' },
    { value: 'Europe/London', label: '(UTC+00:00) Dublin, Edinburgh, Lisbon, London' },
    { value: 'Atlantic/Reykjavik', label: '(UTC+00:00) Monrovia, Reykjavik' },
    { value: 'Africa/Sao_Tome', label: '(UTC+00:00) Sao Tome' },

    { value: 'Africa/Casablanca', label: '(UTC+01:00) Casablanca' },
    { value: 'Europe/Rome', label: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' },
    { value: 'Europe/Prague', label: '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague' },
    { value: 'Europe/Warsaw', label: '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb' },
    { value: 'Africa/Lagos', label: '(UTC+01:00) West Central Africa' },

    { value: 'Europe/Athens', label: '(UTC+02:00) Athens, Bucharest' },
    { value: 'Asia/Beirut', label: '(UTC+02:00) Beirut' },
    { value: 'Africa/Cairo', label: '(UTC+02:00) Cairo' },
    { value: 'Europe/Chisinau', label: '(UTC+02:00) Chisinau' },
    { value: 'Asia/Gaza', label: '(UTC+02:00) Gaza, Hebron' },
    { value: 'Africa/Johannesburg', label: '(UTC+02:00) Harare, Pretoria' },
    { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' },
    { value: 'Asia/Jerusalem', label: '(UTC+02:00) Jerusalem' },
    { value: 'Africa/Juba', label: '(UTC+02:00) Juba' },
    { value: 'Europe/Kaliningrad', label: '(UTC+02:00) Kaliningrad' },
    { value: 'Africa/Khartoum', label: '(UTC+02:00) Khartoum' },
    { value: 'Africa/Tripoli', label: '(UTC+02:00) Tripoli' },
    { value: 'Africa/Windhoek', label: '(UTC+02:00) Windhoek' },
    { value: 'Asia/Damascus', label: '(UTC+02:00) Damascus' },

    { value: 'Asia/Amman', label: '(UTC+03:00) Amman' },
    { value: 'Asia/Baghdad', label: '(UTC+03:00) Baghdad' },
    { value: 'Europe/Istanbul', label: '(UTC+03:00) Istanbul' },
    { value: 'Asia/Riyadh', label: '(UTC+03:00) Kuwait, Riyadh' },
    { value: 'Europe/Minsk', label: '(UTC+03:00) Minsk' },
    { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow, St. Petersburg' },
    { value: 'Africa/Nairobi', label: '(UTC+03:00) Nairobi' },
    { value: 'Europe/Volgograd', label: '(UTC+03:00) Volgograd' },

    { value: 'Asia/Tehran', label: '(UTC+03:30) Tehran' },

    { value: 'Asia/Dubai', label: '(UTC+04:00) Abu Dhabi, Muscat' },
    { value: 'Asia/Baku', label: '(UTC+04:00) Baku' },
    { value: 'Europe/Samara', label: '(UTC+04:00) Izhevsk, Samara' },
    { value: 'Indian/Mauritius', label: '(UTC+04:00) Port Louis' },
    { value: 'Asia/Tbilisi', label: '(UTC+04:00) Tbilisi' },
    { value: 'Asia/Yerevan', label: '(UTC+04:00) Yerevan' },

    { value: 'Asia/Kabul', label: '(UTC+04:30) Kabul' },

    { value: 'Asia/Ashgabat', label: '(UTC+05:00) Ashgabat, Tashkent' },
    { value: 'Asia/Yekaterinburg', label: '(UTC+05:00) Ekaterinburg' },
    { value: 'Asia/Karachi', label: '(UTC+05:00) Islamabad, Karachi' },
    { value: 'Asia/Qyzylorda', label: '(UTC+05:00) Qyzylorda' },

    // ⭐ INDIA
    { value: 'Asia/Kolkata', label: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
    { value: 'Asia/Colombo', label: '(UTC+05:30) Sri Jayawardenepura' },

    { value: 'Asia/Kathmandu', label: '(UTC+05:45) Kathmandu' },

    { value: 'Asia/Almaty', label: '(UTC+06:00) Astana' },
    { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka' },
    { value: 'Asia/Omsk', label: '(UTC+06:00) Omsk' },

    { value: 'Asia/Yangon', label: '(UTC+06:30) Yangon (Rangoon)' },

    { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
    { value: 'Asia/Barnaul', label: '(UTC+07:00) Barnaul, Gorno-Altaysk' },
    { value: 'Asia/Hovd', label: '(UTC+07:00) Hovd' },
    { value: 'Asia/Krasnoyarsk', label: '(UTC+07:00) Krasnoyarsk' },
    { value: 'Asia/Novosibirsk', label: '(UTC+07:00) Novosibirsk' },
    { value: 'Asia/Tomsk', label: '(UTC+07:00) Tomsk' },

    { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi' },
    { value: 'Asia/Irkutsk', label: '(UTC+08:00) Irkutsk' },
    { value: 'Asia/Singapore', label: '(UTC+08:00) Kuala Lumpur, Singapore' },
    { value: 'Australia/Perth', label: '(UTC+08:00) Perth' },
    { value: 'Asia/Taipei', label: '(UTC+08:00) Taipei' },
    { value: 'Asia/Ulaanbaatar', label: '(UTC+08:00) Ulaanbaatar' },

    { value: 'Australia/Eucla', label: '(UTC+08:45) Eucla' },

    { value: 'Asia/Chita', label: '(UTC+09:00) Chita' },
    { value: 'Asia/Tokyo', label: '(UTC+09:00) Osaka, Sapporo, Tokyo' },
    { value: 'Asia/Pyongyang', label: '(UTC+09:00) Pyongyang' },
    { value: 'Asia/Seoul', label: '(UTC+09:00) Seoul' },
    { value: 'Asia/Yakutsk', label: '(UTC+09:00) Yakutsk' },

    { value: 'Australia/Adelaide', label: '(UTC+09:30) Adelaide' },
    { value: 'Australia/Darwin', label: '(UTC+09:30) Darwin' },

    { value: 'Australia/Brisbane', label: '(UTC+10:00) Brisbane' },
    { value: 'Australia/Sydney', label: '(UTC+10:00) Canberra, Melbourne, Sydney' },
    { value: 'Pacific/Guam', label: '(UTC+10:00) Guam, Port Moresby' },
    { value: 'Australia/Hobart', label: '(UTC+10:00) Hobart' },
    { value: 'Asia/Vladivostok', label: '(UTC+10:00) Vladivostok' },

    { value: 'Australia/Lord_Howe', label: '(UTC+10:30) Lord Howe Island' },

    { value: 'Pacific/Bougainville', label: '(UTC+11:00) Bougainville Island' },
    { value: 'Asia/Magadan', label: '(UTC+11:00) Magadan' },
    { value: 'Pacific/Norfolk', label: '(UTC+11:00) Norfolk Island' },
    { value: 'Asia/Sakhalin', label: '(UTC+11:00) Sakhalin' },
    { value: 'Pacific/Guadalcanal', label: '(UTC+11:00) Solomon Is., New Caledonia' },

    { value: 'Asia/Anadyr', label: '(UTC+12:00) Anadyr, Petropavlovsk-Kamchatsky' },
    { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland, Wellington' },
    { value: 'Etc/GMT-12', label: '(UTC+12:00) Coordinated Universal Time+12' },
    { value: 'Pacific/Fiji', label: '(UTC+12:00) Fiji' },

    { value: 'Pacific/Chatham', label: '(UTC+12:45) Chatham Islands' },

    { value: 'Etc/GMT-13', label: '(UTC+13:00) Coordinated Universal Time+13' },
    { value: 'Pacific/Tongatapu', label: "(UTC+13:00) Nuku'alofa" },
    { value: 'Pacific/Apia', label: '(UTC+13:00) Samoa' },

    { value: 'Pacific/Kiritimati', label: '(UTC+14:00) Kiritimati Island' }
  ];
}

  // ✅ Save / Update Region
onSubmit(): void {

  // Normalize input
  this.region.regionName = this.region.regionName
    ?.trim()
    .replace(/\s+/g, ' ');

  this.region.country = this.region.country
    ?.trim()
    .replace(/\s+/g, ' ');

  // Company Validation
  if (!this.region.companyID) {
    Swal.fire('Validation', 'Please select company.', 'warning');
    return;
  }

  // Region Validation
  if (!this.region.regionName) {
    Swal.fire('Validation', 'Region Name is required.', 'warning');
    return;
  }

  if (this.region.regionName.length > 100) {
    Swal.fire('Validation', 'Region Name cannot exceed 100 characters.', 'warning');
    return;
  }

  if (!/^[A-Za-z ]+$/.test(this.region.regionName)) {
    Swal.fire(
      'Validation',
      'Region Name should contain only alphabets and single spaces.',
      'warning'
    );
    return;
  }

  // Country Validation
  if (!this.region.country) {
    Swal.fire('Validation', 'Country is required.', 'warning');
    return;
  }

  if (this.region.country.length > 100) {
    Swal.fire('Validation', 'Country cannot exceed 100 characters.', 'warning');
    return;
  }

  if (!/^[A-Za-z ]+$/.test(this.region.country)) {
    Swal.fire(
      'Validation',
      'Country should contain only alphabets and single spaces.',
      'warning'
    );
    return;
  }
if (!this.region.timeZoneId) {
  Swal.fire(
    'Validation',
    'Please select Time Zone.',
    'warning'
  );
  return;
}
  this.spinner.show();

  const operation = this.isEditMode
    ? this.adminService.updateRegion(this.region.regionID, this.region)
    : this.adminService.createRegion(this.region);

  operation.subscribe({

    next: () => {

      Swal.fire(
        'Success!',
        this.isEditMode
          ? 'Region updated successfully.'
          : 'Region added successfully.',
        'success'
      );

      this.loadRegions();
      this.resetForm();
      this.spinner.hide();

    },

    error: (err) => {

      this.spinner.hide();

      let errorMessage = 'Operation failed.';

      if (err?.error) {

        if (typeof err.error === 'string') {
          errorMessage = err.error;
        }
        else if (err.error.message) {
          errorMessage = err.error.message;
        }
        else if (err.error.title) {
          errorMessage = err.error.title;
        }

      }

      Swal.fire('Error!', errorMessage, 'error');

    }

  });

}

getTimeZoneLabel(value: string): string {
  const timezone = this.timeZones.find(
    x => x.value === value
  );

  return timezone ? timezone.label : '-';
}

  editRegion(r: Region): void {
    this.region = { ...r };
    this.isEditMode = true;
  }

  deleteRegion(r: Region): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete region "${r.regionName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.adminService.deleteRegion(r.regionID).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Region deleted successfully.', 'success');
            this.loadRegions();
            this.spinner.hide();
          },
          error: () => {
            this.spinner.hide();
            Swal.fire('Error!', 'Unable to delete region.', 'error');
          }
        });
      }
    });
  }

  // ✅ Filter + Sorting + Pagination Combined
  filteredRegions(): Region[] {
    const search = this.searchText.trim().toLowerCase();
    let filtered = this.regions.filter(r => {
      const matchesSearch = !search || r.regionName.toLowerCase().includes(search);
      const matchesStatus = this.statusFilter === '' || r.isActive === this.statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered = filtered.sort((a, b) => this.compareValues(a, b));

    return filtered;
  }

  // ✅ Sorting Logic
  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    this.regions.sort((a, b) => this.compareValues(a, b));
    this.updatePagedRegions();
  }

  compareValues(a: any, b: any): number {
    const valA = a[this.sortColumn];
    const valB = b[this.sortColumn];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return this.sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return this.sortDirection === 'asc'
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    }

    return this.sortDirection === 'asc' ? valA - valB : valB - valA;
  }

  // ✅ Pagination
  updatePagedRegions(): void {
    const filtered = this.filteredRegions();
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRegions = filtered.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedRegions();
  }

  changePageSize(event: any): void {
    this.pageSize = +event.target.value;
    this.currentPage = 1;
    this.updatePagedRegions();
  }

  toggleStatus(r: Region): void {
    r.isActive = !r.isActive;
    this.adminService.updateRegion(r.regionID, r).subscribe({
      next: () => Swal.fire('Success!', 'Status updated.', 'success'),
      error: () => Swal.fire('Error!', 'Failed to update status.', 'error')
    });
  }

  exportExcel(): void {
    const exportData = this.regions.map((r, index) => ({
      'S.No': index + 1,
      'Region Name': r.regionName,
      'Company': this.getCompanyName(r.companyID),
      'Country': r.country,
      'Status': r.isActive ? 'Active' : 'Inactive'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Regions');
    XLSX.writeFile(workbook, 'RegionList.xlsx');
  }

  exportPDF(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Region List', 40, 40);
    autoTable(doc, {
      startY: 60,
      head: [['S.No', 'Region Name', 'Company', 'Country', 'Status']],
      body: this.regions.map((r, i) => [
        i + 1,
        r.regionName,
        this.getCompanyName(r.companyID),
        r.country,
        r.isActive ? 'Active' : 'Inactive'
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    doc.save('RegionList.pdf');
  }

  resetForm(): void {
    this.region = this.getEmptyRegion();
    this.isEditMode = false;
  }

  regionModel: any;
  openUploadPopup(): void {
    this.regionModel = [
      { regionName: 'South Zone', companyName: 'ABC Technologies Pvt Ltd', country: 'India', isActive: true },
      { regionName: 'North Zone', companyName: 'Global Solutions Ltd', country: 'India', isActive: false }
    ];
    this.showUploadPopup = false;
    setTimeout(() => (this.showUploadPopup = true), 0);
  }

  closeUploadPopup(): void {
    this.showUploadPopup = false;
  }

  onBulkUploadComplete(event: any): void {
    if (event?.success) {
      Swal.fire('Upload Complete!', event.message, 'success');
      this.loadRegions();
    }
  }
    onCancel(): void {
  this.resetForm();

}
}

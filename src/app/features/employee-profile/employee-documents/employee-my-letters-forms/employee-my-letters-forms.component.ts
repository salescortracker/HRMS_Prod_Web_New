import { Component } from '@angular/core';
import { EmployeeLetter } from '../../../../admin/layout/models/employee-letter.model';
import { environment } from '../../../../../environments/environment';
import { AdminService } from '../../../../admin/servies/admin.service';
import { EmployeeForm } from '../../../../admin/layout/models/employee-forms.model';

@Component({
  selector: 'app-employee-my-letters-forms',
  standalone: false,
  templateUrl: './employee-my-letters-forms.component.html',
  styleUrl: './employee-my-letters-forms.component.css'
})
export class EmployeeMyLettersFormsComponent {
 letters: EmployeeLetter[] = [];
  employeeCode: string = '';
documentTypes: any[] = [];
companyId: number = 0;
regionId: number = 0;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDocumentTypes();
    this.employeeCode = sessionStorage.getItem("EmployeeCode") || '';
      this.companyId = Number(sessionStorage.getItem("CompanyId"));
  this.regionId = Number(sessionStorage.getItem("RegionId"));
    this.loadMyLetters();
    
  }
  loadDocumentTypes() {
  this.adminService.getAttachmentTypesByCategory('Letters')
    .subscribe((res: any[]) => {
      this.documentTypes = res.map(x => ({
        id: x.attachmentTypeId,
        name: x.attachmentTypeName
      }));
    });
}
getDocumentTypeName(id: number | string): string {
  const doc = this.documentTypes.find(d => d.id == Number(id));
  return doc ? doc.name : '';
}
loadMyLetters() {
  this.adminService.getMyLetters(
    this.employeeCode,
    this.companyId,
    this.regionId
  ).subscribe({
    next: (res: any[]) => {

      this.letters = res.map(x => {

        const allFileNames = (x.fileName || '')
          .toString()
          .split(',')
          .map((f: string) => f.trim())
          .filter((f: string) => f);

        const allFilePaths = (x.filePath || '')
          .toString()
          .split(',')
          .map((f: string) => f.trim())
          .filter((f: string) => f);

        const latestFileName =
          allFileNames.length
            ? allFileNames[allFileNames.length - 1]
            : '';

        const latestFilePath =
          allFilePaths.length
            ? allFilePaths[allFilePaths.length - 1]
            : '';

        return {
          id: x.id,
          documentType: x.documentTypeId,
          title: x.documentName,
          empCode: x.employeeCode,
          empName: x.employeeName,
          issuedDate: x.issuedDate,
          validityDate: x.validityDate,

          // File name for display/download name
          fileName: latestFileName,

          // Actual path returned by API
          filePath: latestFilePath,

          remarks: x.remarks,
          confidential: x.isConfidential
        };
      });

      console.log('My Letters:', this.letters);
    },

    error: (err) => {
      console.error('Error loading letters:', err);
    }
  });
}

viewDocument(filePath: string) {

  if (!filePath) {
    console.error('File path is empty');
    return;
  }

  const trimmedPath = filePath.trim();

  const fileUrl = /^https?:\/\//i.test(trimmedPath)
    ? trimmedPath
    : `${environment.baseurl.replace(/\/+$/, '')}/${trimmedPath
        .replace(/^\/+/, '')
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;

  console.log('View File URL:', fileUrl);

  window.open(fileUrl, '_blank');
}
downloadDocument(filePath: string, fileName?: string) {

  if (!filePath) {
    console.error('File path is empty');
    return;
  }

  const trimmedPath = filePath.trim();

  const fileUrl = /^https?:\/\//i.test(trimmedPath)
    ? trimmedPath
    : `${environment.baseurl.replace(/\/+$/, '')}/${trimmedPath
        .replace(/^\/+/, '')
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;

  console.log('Download File URL:', fileUrl);

  fetch(fileUrl)
    .then(response => {

      if (!response.ok) {
        throw new Error(
          `Download failed with status ${response.status}`
        );
      }

      return response.blob();
    })
    .then(blob => {

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = blobUrl;

      link.download =
        fileName ||
        trimmedPath.split('/').pop() ||
        'document';

      link.style.display = 'none';

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

    })
    .catch(err => {

      console.error('Download failed:', err);

    });
}
}

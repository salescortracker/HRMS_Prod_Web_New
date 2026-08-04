import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface ClockRequest {
  userId: number;
  companyId: number;
  regionId: number;
}
export interface ClockResponse {
  success: boolean;
  message: string;

  isClockedIn: boolean;

  status: string;

  clockInTime: string;

  clockOutTime: string;

  totalHours: string;

  currentRegionTime: string;

  currentDate: string;

  shiftName: string;

  shiftStart: string;

  shiftEnd: string;

  timezone: string;
}
@Injectable({
  providedIn: 'root'
})
export class AttendanceClockService {
 private apiUrl = environment.apiUrl + 'Attendance';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {

    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

  }

  //----------------------------------------
  // CLOCK IN
  //----------------------------------------

  clockIn(model: ClockRequest): Observable<ClockResponse> {

    return this.http.post<ClockResponse>(
      `${this.apiUrl}/clockin`,
      model,
      { headers: this.getHeaders() }
    );

  }

  //----------------------------------------
  // CLOCK OUT
  //----------------------------------------

  clockOut(model: ClockRequest): Observable<ClockResponse> {

    return this.http.post<ClockResponse>(
      `${this.apiUrl}/clockout`,
      model,
      { headers: this.getHeaders() }
    );

  }

  //----------------------------------------
  // GET CURRENT STATUS
  //----------------------------------------

  getCurrentStatus(userId: number): Observable<ClockResponse> {

    return this.http.get<ClockResponse>(
      `${this.apiUrl}/currentstatus/${userId}`,
      { headers: this.getHeaders() }
    );

  }

  //----------------------------------------
  // REFRESH CLOCK
  //----------------------------------------

  refreshClock(userId: number): Observable<ClockResponse> {

    return this.http.get<ClockResponse>(
      `${this.apiUrl}/refresh/${userId}`,
      { headers: this.getHeaders() }
    );

  }
}

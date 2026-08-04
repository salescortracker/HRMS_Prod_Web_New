import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BreakPolicy } from '../layout/models/break-policy.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BreakPolicyService {

  private apiUrl = environment.apiUrl + '/Attendance'; // Adjust the endpoint as needed

  constructor(private http: HttpClient) {}

  getAll(userId: number): Observable<BreakPolicy[]> {
    return this.http.get<BreakPolicy[]>(`${this.apiUrl}/GetBreakPolicyAll/${userId}`);
  }

  getById(id: number): Observable<BreakPolicy> {
    return this.http.get<BreakPolicy>(`${this.apiUrl}/GetBreakPolicyById/${id}`);
  }

  create(model: BreakPolicy): Observable<any> {
    return this.http.post(`${this.apiUrl}/CreateBreakPolicy`, model);
  }

  update(model: BreakPolicy): Observable<any> {
    return this.http.post(`${this.apiUrl}/UpdateBreakPolicy`, model);
  }

  delete(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/DeleteBreakPolicy/${id}`,{});
  }
  breakIn(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/BreakIn`, data);
  }

  breakOut(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/BreakOut`, data);
  }
}
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AdminService } from '../../../admin/servies/admin.service';
import { EmployeeResignationService } from '../../employee-profile/employee-services/employee-resignation.service';
import { AttendanceService } from '../service/attendance.service';

interface AttendanceRecord {
  attendanceDate: string;
  employeeName: string;
  department: string;
  actionType: string;
  actionTime: string;
}
@Component({
  selector: 'app-clockin-clockout',
  standalone: false,
  templateUrl: './clockin-clockout.component.html',
  styleUrl: './clockin-clockout.component.css'
})
export class ClockinClockoutComponent implements OnInit, OnDestroy {
  graceTime: string = '';        // from API
  lastClockOut: string | null = null;
  isClockedIn = false;
  attendanceForm!: FormGroup;
  attendanceRecords: AttendanceRecord[] = [];
  
  currentUser: any;
  loading = false;
  lateLoginText: string = '';
  message = '';
  todayClockIn = '--:--';
  todayClockOut = '--:--';
  availableActions: string[] = [];
  todayDuration = '--:--';
  currentDate = new Date();
  records: any[] = [];
  private destroy$ = new Subject<void>();

  fromDate: string = '';
  toDate: string = '';

  employeeCode = sessionStorage.getItem('EmployeeCode');
  companyId = sessionStorage.getItem('CompanyId') as unknown as number;
  regionId = sessionStorage.getItem('RegionId') as unknown as number;
  clockInRecords: any[] = [];
clockOutRecords: any[] = [];
firstClockIn: any;
openClockIn: AttendanceRecord | null = null;
  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private employeeResignationService: EmployeeResignationService,
    private attendanceService: AttendanceService
  ) { }

  ngOnInit(): void {
    this.loadSessionUser();
    this.initForm();
    this.patchEmployeeData();

    this.attendanceService.attendanceRefresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadAttendance();
      });

    this.loadAttendance();
    this.getshiftallocationName();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.attendanceForm = this.fb.group({
      employeeCode: [{ value: '', disabled: true }, Validators.required],
      employeeName: [{ value: '', disabled: true }, Validators.required],
      department: [{ value: '', disabled: true }, Validators.required],
      clockType: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  patchEmployeeData() {
    if (!this.currentUser) return;
    this.attendanceForm.patchValue({
      employeeCode: this.currentUser.employeeCode,
      employeeName: this.currentUser.fullName,
      department: this.currentUser.roleId,
    });
  }
  setAvailableActions() {

  if (this.isClockedIn) {

    this.availableActions = ['ClockOut'];

    this.attendanceForm.patchValue({
      clockType: 'ClockOut'
    });

    return;
  }

  this.availableActions = ['ClockIn'];

  this.attendanceForm.patchValue({
    clockType: 'ClockIn'
  });
}
  onSubmit() {
    // if (this.attendanceForm.invalid) return;
    if (this.attendanceForm.invalid) {
      this.attendanceForm.markAllAsTouched();
      return;
    }
    const form = this.attendanceForm.getRawValue();
    const payload = {
      regionId: this.currentUser.regionId,
      companyId: this.currentUser.companyId,
      employeeCode: String(this.currentUser.userId),
      employeeName: form.employeeName,
      // department: form.department,
      department: String(form.department), // OR actual department name
      attendanceDate: new Date(),
      actionType: form.clockType,
      actionTime: form.time
    };

    this.loading = true;
    this.message = '';
    this.adminService.createClockInOut(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.message = 'Attendance saved successfully';
          this.attendanceForm.patchValue({ clockType: '', time: '' });
          this.loadAttendance();
        },
        error: () => this.message = 'Failed to save attendance'
      });
  }

  loadAttendance() {

  const employeeCode = String(this.currentUser.employeeCode);
  const companyId = this.currentUser.companyId;
  const regionId = this.currentUser.regionId;

  this.adminService.getTodayAttendance(
    employeeCode,
    companyId,
    regionId
  ).subscribe(todayRecords => {

    this.attendanceRecords = todayRecords;

    this.resolveAttendanceSession(todayRecords);

  });
}

// A night shift's ClockIn/ClockOut land on different calendar dates, so
// comparing/diffing on actionTime ("HH:mm") alone is wrong once midnight
// is crossed. This combines attendanceDate + actionTime into a real,
// comparable Date.
toDateTime(record: AttendanceRecord): Date {
  const datePart = record.attendanceDate.split('T')[0];
  return new Date(`${datePart}T${record.actionTime}`);
}

sortByDateTime(records: AttendanceRecord[]): AttendanceRecord[] {
  return [...records].sort(
    (a, b) => this.toDateTime(a).getTime() - this.toDateTime(b).getTime()
  );
}

resolveAttendanceSession(todayRecords: AttendanceRecord[]) {

  const sortedToday = this.sortByDateTime(todayRecords);

  const startsWithOrphanClockOut =
    sortedToday.length > 0 && sortedToday[0].actionType === 'ClockOut';

  // Today's own records already tell the full story: either nothing has
  // happened yet today, or today's first punch is a ClockIn (i.e. this
  // isn't the tail end of a shift that started yesterday).
  if (sortedToday.length === 0 || !startsWithOrphanClockOut) {
    this.applySession(this.pairLatestSession(sortedToday));
    return;
  }

  // Today starts with an orphan ClockOut, so the matching ClockIn was
  // made yesterday (night shift). Pull yesterday + today to resolve it.
  this.resolvePreviousDaySession(sortedToday);
}

pairLatestSession(sortedRecords: AttendanceRecord[]):
  { clockIn: AttendanceRecord | null, clockOut: AttendanceRecord | null } {

  let clockIn: AttendanceRecord | null = null;
  let clockOut: AttendanceRecord | null = null;

  for (const record of sortedRecords) {
    if (record.actionType === 'ClockIn') {
      clockIn = record;
      clockOut = null;
    } else if (record.actionType === 'ClockOut' && clockIn) {
      clockOut = record;
    }
  }

  return { clockIn, clockOut };
}

resolvePreviousDaySession(sortedToday: AttendanceRecord[]) {

  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const fromDate =
    yesterday.toISOString().split('T')[0];

  const toDate =
    today.toISOString().split('T')[0];

  this.adminService.getAttendanceByDateRange(
    String(this.currentUser.employeeCode),
    this.currentUser.companyId,
    this.currentUser.regionId,
    fromDate,
    toDate
  ).subscribe(rangeRecords => {

    const merged = this.sortByDateTime(
      rangeRecords && rangeRecords.length ? rangeRecords : sortedToday
    );

    const session = this.pairLatestSession(merged);

    if (session.clockIn && !session.clockOut) {
      // Still clocked in from a previous day (night shift in progress)
      this.applySession(session);
      return;
    }

    // Fully closed - only relevant to "today" if the ClockOut that
    // closes it actually happened today. Otherwise it's just an
    // already-finished shift from yesterday and has nothing to do with
    // today (employee simply hasn't clocked in yet today).
    const closesToday = !!session.clockOut && sortedToday.some(r =>
      r.attendanceDate === session.clockOut!.attendanceDate &&
      r.actionTime === session.clockOut!.actionTime &&
      r.actionType === 'ClockOut'
    );

    this.applySession(closesToday ? session : { clockIn: null, clockOut: null });
  });
}

applySession(session: { clockIn: AttendanceRecord | null, clockOut: AttendanceRecord | null }) {

  this.firstClockIn = session.clockIn;
  this.openClockIn = session.clockIn && !session.clockOut ? session.clockIn : null;
  this.isClockedIn = !!session.clockIn && !session.clockOut;

  this.todayClockIn = session.clockIn ? session.clockIn.actionTime : '--:--';
  this.todayClockOut = session.clockOut ? session.clockOut.actionTime : '--:--';
  this.lastClockOut = session.clockOut ? session.clockOut.actionTime : null;

  if (session.clockIn) {

    const start = this.toDateTime(session.clockIn);
    const end = session.clockOut ? this.toDateTime(session.clockOut) : new Date();
    const totalMs = Math.max(0, end.getTime() - start.getTime());

    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);

    this.todayDuration =
      `${hours.toString().padStart(2, '0')}:` +
      `${minutes.toString().padStart(2, '0')}`;

  } else {
    this.todayDuration = '--:--';
  }

  this.setAvailableActions();
  this.calculateLateLogin();
}
isNightShift(): boolean {

  if (!this.ShiftstartTime || !this.ShiftendTime) {
    return false;
  }

  const [startH, startM] =
    this.ShiftstartTime.split(':').map(Number);

  const [endH, endM] =
    this.ShiftendTime.split(':').map(Number);

  const startMinutes =
    startH * 60 + startM;

  const endMinutes =
    endH * 60 + endM;

  return endMinutes <= startMinutes;
}

  shiftAllocationName: string = '';
  ShiftstartTime: string = '';
  ShiftendTime: string = '';
  getshiftallocationName() {
    this.employeeCode = sessionStorage.getItem('EmployeeCode') as string;
    const companyId = Number(sessionStorage.getItem('CompanyId'));
    const regionId = Number(sessionStorage.getItem('RegionId'));

    this.employeeResignationService
      .getShiftallocationNameForClockInOut(this.employeeCode, companyId, regionId)
      .subscribe(res => {
        this.shiftAllocationName = res.shiftName;
        this.ShiftstartTime = res.shiftStartTime;
        this.ShiftendTime = res.shiftEndTime;

        this.graceTime = res.grassTime;

        this.calculateLateLogin();
      });
  }

  loadSessionUser() {
    const user = sessionStorage.getItem('currentUser');
    if (user) this.currentUser = JSON.parse(user);
  }
  loadAll() {
    this.employeeResignationService.getClockInOutAll().subscribe(res => {
      this.records = res;
    });
  }

  loadTodayAttendance() {
    this.employeeResignationService
      .getTodayByEmployee(this.employeeCode, this.companyId, this.regionId)
      .subscribe(res => {
        this.records = res;
      });
  }
  getSystemTime24(): string {
    const now = new Date(); // USER SYSTEM TIME
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;   // HH:mm
  }
  
  clockIn() {

  const actionType =
    this.isClockedIn
      ? 'ClockOut'
      : 'ClockIn';

  const time = this.getSystemTime24();

  const payload = {

    employeeCode: this.employeeCode,

    employeeName:
      sessionStorage.getItem('Name') || '',

    department: 0,

    attendanceDate: new Date(),

    actionType: actionType,

    actionTime: time,

    companyId: this.companyId,

    regionId: this.regionId
  };

  this.employeeResignationService
    .addClockInOut(payload)
    .subscribe({

      next: () => {

        this.loadAttendance();

        this.loadTodayAttendance();

      },

      error: err => {

        console.error(
          'Clock operation failed:',
          err
        );

      }

    });
}

  delete(id: number) {
    this.employeeResignationService.deleteClockInOut(id).subscribe(() => {
      this.loadAll();
    });
  }
 formatDuration(totalMinutes: number): string {

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

calculateLateLogin(): void {

  if (
    !this.firstClockIn ||
    !this.firstClockIn.actionTime ||
    !this.ShiftstartTime ||
    !this.graceTime
  ) {
    this.lateLoginText = '';
    return;
  }

  // Use the ClockIn record's real date+time, and anchor shiftStart to
  // that SAME calendar date (not "now") - otherwise a night shift
  // viewed the next morning always compares against today's 22:00,
  // which is always later than a clock-in that already happened
  // yesterday, and gets misjudged as "Early".
  const clockIn = this.toDateTime(this.firstClockIn);

  const [sH, sM] = this.ShiftstartTime
    .split(':')
    .map(Number);

  const shiftStart = new Date(
    `${this.firstClockIn.attendanceDate.split('T')[0]}T00:00:00`
  );
  shiftStart.setHours(sH, sM, 0, 0);

  // First 5 minutes = On Time
  const onTimeEnd = new Date(
    shiftStart.getTime() + (5 * 60000)
  );

  const [gH, gM] = this.graceTime
    .split(':')
    .map(Number);

  const graceEnd = new Date(
    shiftStart.getTime() +
    ((gH * 60) + gM) * 60000
  );

  // EARLY
  if (clockIn < shiftStart) {

    const mins = Math.floor(
      (shiftStart.getTime() - clockIn.getTime()) / 60000
    );

    this.lateLoginText =
      `Early by ${this.formatDuration(mins)}`;

    return;
  }

  // ON TIME
  if (clockIn <= onTimeEnd) {

    this.lateLoginText = 'On Time';

    return;
  }

  // GRACE
  if (clockIn <= graceEnd) {

    const mins = Math.floor(
      (clockIn.getTime() - onTimeEnd.getTime()) / 60000
    );

    this.lateLoginText =
      `Grace ${this.formatDuration(mins)}`;

    return;
  }

  // LATE
  const mins = Math.floor(
    (clockIn.getTime() - graceEnd.getTime()) / 60000
  );

  this.lateLoginText =
    `Late by ${this.formatDuration(mins)}`;
}
  getStatusClass(): string {

  if (!this.lateLoginText) {
    return '';
  }

  const status = this.lateLoginText.toLowerCase();

  if (status.includes('late')) {
    return 'status-late';
  }

  if (status.includes('grace')) {
    return 'status-late';   // Same style as Late
  }

  if (status.includes('early')) {
    return 'status-early';
  }

  if (status.includes('on time')) {
    return 'status-ontime';
  }

  return '';
}

  searchAttendance() {

    if (!this.fromDate || !this.toDate) {

      this.loadAttendance();

      return;

    }

    this.adminService.getAttendanceByDateRange(
      String(this.currentUser.employeeCode),
      this.currentUser.companyId,
      this.currentUser.regionId,
      this.fromDate,
      this.toDate
    )
      .subscribe(res => {

        this.attendanceRecords = res;

      });

  }
}

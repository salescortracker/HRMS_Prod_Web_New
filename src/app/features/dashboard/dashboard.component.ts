import { Component , ViewChild, ElementRef} from '@angular/core';
import { HRMS_MODULES,HrmsModule } from '../../core/chatbot-routes';
import { Router } from '@angular/router';
import { AdminService } from '../../admin/servies/admin.service';
import { EmployeeResignationService } from '../employee-profile/employee-services/employee-resignation.service';
import { HelpdeskService } from '../helpdesk/service/helpdesk.service';
import { Chart } from 'chart.js/auto';
import { TimesheetService } from '../timesheet/service/timesheet.service';
import Swal from 'sweetalert2';
interface ChatMessage {
   sender: 'User' | 'Bot';
  text?: string; 
   attachmentName?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
   today: Date = new Date();
  activeTab: string = 'timesheet';

  currentUser: any;
  userId!: number;
  EmployeeCode!: string;
  companyId!: number;

   timesheetPage = 1;
timesheetPageSize = 5;

helpdeskPage = 1;
helpdeskPageSize = 5;
  dashboardData: any = {};

  employeeName = '';
  profileImage = '';
  profileInitials = '';

  todayAttendance = {
    status: 'Absent',
    workingHours: '0'
  };

  attendanceRecords: any[] = [];
  attendanceChart: any;

  userLeaves: any[] = [];
  weeklyData: any[] = [];
  weekoffDates: string[] = [];



leaveApprovalSummary: any = {
  approved: 0,
  pending: 0,
  rejected: 0,
  approvedDetails: [],
  pendingDetails: [],
  rejectedDetails: []
};
  leaveCards: any[] = [];

  statCards: any[] = [];

  tickets: any[] = [];
  submittedTimesheets: any[] = [];
  totalWorkedHours: string = '0';
  liveTimer: any;
  baseWorkedMinutes: number = 0;  
  liveWorkedMinutes: number = 0; 
  displayHours: number = 0;
  displayMinutes: number = 0;

  constructor(
    private adminService: AdminService,
    private empService: EmployeeResignationService,
    private helpdeskService: HelpdeskService,
    private timesheetService: TimesheetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    this.userId = Number(sessionStorage.getItem('UserId'));
    this.EmployeeCode = sessionStorage.getItem('EmployeeCode') || '';
    this.companyId = this.currentUser.companyId;

    this.employeeName = this.currentUser.fullName || '';
    this.profileImage = sessionStorage.getItem(`profileImage_${this.userId}`) || '';
    this.profileInitials = this.getInitials(this.employeeName);

    this.loadDashboard();
    this.loadAttendance();
    this.loadLeaves();
    this.loadTickets();
    this.loadTimesheets();
    this.loadWeekoffs();
    this.loadWeeklyData();
  }
  formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);

  return `${year}-${month}-${day}`;
}
timeToMinutes(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return (h * 60) + m + (s || 0) / 60;
}
calculateTotalWorkedMinutes(records: any[]): number {
  let total = 0;
  let lastIn: string | null = null;

  for (let r of records) {

    if (r.actionType === 'ClockIn') {
      lastIn = r.actionTime;
    }

    if (r.actionType === 'ClockOut' && lastIn) {
      const start = this.timeToMinutes(lastIn);
      const end = this.timeToMinutes(r.actionTime);

      if (end > start) {
        total += (end - start);
      }

      lastIn = null;
    }
  }

  return total;
}

  // ================= DASHBOARD =================
  loadDashboard() {
    this.adminService.getEmployeesByDate(
    this.companyId,
    this.currentUser.regionId,
    this.formatDate(this.today)
  ).subscribe((res: any) => {

    const data = res?.data || res || [];

    let fullPresent = 0;
    let halfPresent = 0;
    let absent = 0;

    data.forEach((emp: any) => {
      const status = emp.status?.toLowerCase();

      if (status === 'present') {
        // if backend has halfday flag, check it
        if (emp.isHalfDay === true || status.includes('half')) {
          halfPresent++;
        } else {
          fullPresent++;
        }
      } 
      else if (status === 'halfday' || status.includes('half')) {
        halfPresent++;
      } 
      else {
        absent++;
      }
    });

    const totalPresent = fullPresent + halfPresent;

    this.statCards = [
      { label: 'Total Employees', value: data.length, icon: 'fas fa-users' },
      { label: 'Present', value: `${totalPresent}`, icon: 'fas fa-user-check' },
      { label: 'Absent', value: absent, icon: 'fas fa-user-times' },
      { label: 'Today Hours', value: '0h 0m',  icon: 'fas fa-clock' }
    ];

  });
  }
  loadAllData() {
  this.loadAttendance();
  this.loadWeeklyData();
  this.loadWeekoffs();
}
  loadWeeklyData() {
  this.EmployeeCode = this.currentUser.employeeCode;
  if (!this.EmployeeCode) return;

  this.empService.getWeeklyByEmployee(this.EmployeeCode)
    .subscribe({
      next: (res: any) => {
        this.weeklyData = res || [];
        this.tryRenderChart();
      },
      error: (err) => {
        console.error('Weekly API failed', err);
      }
    });
}
loadWeekoffs() {
  this.adminService.getWeekoffs(this.companyId, this.currentUser.regionId)
    .subscribe((res: any) => {

      const data = res?.data || []; 

      this.weekoffDates = data.map((x: any) => x.weekoffDate);
      this.tryRenderChart();
      // redraw chart after loading
    });
}


  // ================= ATTENDANCE =================
  loadAttendance() {
    this.empService.getTodayByEmployee(this.currentUser.employeeCode, this.companyId, this.currentUser.regionId)
      .subscribe((res: any) => {
        this.attendanceRecords = res || [];
        this.baseWorkedMinutes = this.calculateTotalWorkedMinutes(this.attendanceRecords);
        this.liveWorkedMinutes = this.baseWorkedMinutes;
        this.updateTodayHoursCard();
        this.startLiveTimer();
        this.updateAttendance();
        this.loadDashboard();
        this.tryRenderChart();
      });
  }
  tryRenderChart() {
  if (
    !this.weeklyData ||
    !this.weekoffDates ||
    !this.attendanceRecords
  ) return;

  // small delay ensures DOM ready
  setTimeout(() => {
    this.createChart();
  }, 0);
}
  startLiveTimer() {
  if (this.liveTimer) {
    clearInterval(this.liveTimer);
  }
this.liveTimer = setInterval(() => {

  const base = this.calculateTotalWorkedMinutes(this.attendanceRecords);

  const lastIn = [...this.attendanceRecords]
    .filter(x => x.actionType === 'ClockIn')
    .pop();

  const lastOut = [...this.attendanceRecords]
    .filter(x => x.actionType === 'ClockOut')
    .pop();

  let extra = 0;

  const isWorking =
  lastIn &&
  (!lastOut || new Date(`1970-01-01T${lastIn.actionTime}`) >
               new Date(`1970-01-01T${lastOut.actionTime}`));

  if (isWorking && lastIn) {
    const start = this.timeToMinutes(lastIn.actionTime);

    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();

    extra = current - start;
  }

  const total = base + extra;

  this.displayHours = Math.floor(total / 60);
  this.displayMinutes = total % 60;

  this.totalWorkedHours = `${this.displayHours}h ${this.displayMinutes}m`;
  this.statCards = [...this.statCards];

  this.updateTodayHoursCard(); // 🔥 IMPORTANT
  this.updateChartTodayHours(total / 60);

}, 1000);
}
updateTodayHoursCard() {
  const total = `${this.displayHours}h ${this.displayMinutes}m`;
  const card = this.statCards.find(x => x.label === 'Today Hours');
  if (card) {
    card.value = this.totalWorkedHours;
    this.statCards = [...this.statCards];
  }
}

  updateAttendance() {
    const inTime = this.attendanceRecords.find(x => x.actionType === 'ClockIn');
    const outTime = this.attendanceRecords.find(x => x.actionType === 'ClockOut');

    if (inTime) {
      this.todayAttendance.status = 'Present';

      if (outTime) {
        const hours = this.calculateHours(inTime.actionTime, outTime.actionTime);
        this.todayAttendance.workingHours = hours;
      }
    }
  }

  calculateHours(start: string, end: string): string {
    const s = start.split(':').map(Number);
    const e = end.split(':').map(Number);

    const total = (e[0] + e[1]/60) - (s[0] + s[1]/60);
    return Math.max(total, 0).toFixed(1);
  }

  createChart() {

  if (this.attendanceChart) {
    this.attendanceChart.destroy();
  }

  const labels: string[] = [];
  const data: number[] = [];
  const colors: string[] = [];

  // ==========================================
  // TODAY
  // ==========================================

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = this.formatDate(today);


  // ==========================================
  // START OF WEEK - MONDAY
  // ==========================================

  const currentDay = today.getDay();

  const startOfWeek = new Date(today);

  const diff =
    today.getDate() -
    currentDay +
    (currentDay === 0 ? -6 : 1);

  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);


  // ==========================================
  // ATTENDANCE MAP
  //
  // IMPORTANT:
  // HOURS ALWAYS BELONG TO CLOCK-IN DATE
  // ==========================================

  const attendanceMap = new Map<string, number>();


  // ==========================================
  // SORT ATTENDANCE
  // ==========================================

  const records = [...this.attendanceRecords].sort((a, b) => {

    const dateA =
      new Date(
        `${this.formatDate(new Date(a.attendanceDate))}T${a.actionTime}`
      );

    const dateB =
      new Date(
        `${this.formatDate(new Date(b.attendanceDate))}T${b.actionTime}`
      );

    return dateA.getTime() - dateB.getTime();
  });


  // ==========================================
  // MATCH CLOCK-IN → CLOCK-OUT
  // ==========================================

  for (let i = 0; i < records.length; i++) {

    const clockIn = records[i];

    if (clockIn.actionType !== 'ClockIn') {
      continue;
    }

    const clockInDate =
      this.formatDate(
        new Date(clockIn.attendanceDate)
      );

    let clockOut: any = null;


    // Find the next ClockOut after this ClockIn
    for (let j = i + 1; j < records.length; j++) {

      if (records[j].actionType === 'ClockIn') {
        break;
      }

      if (records[j].actionType === 'ClockOut') {
        clockOut = records[j];
        break;
      }
    }


    // ==========================================
    // COMPLETED CLOCK IN / CLOCK OUT
    // ==========================================

    if (clockOut) {

      let start =
        this.timeToMinutes(
          clockIn.actionTime
        );

      let end =
        this.timeToMinutes(
          clockOut.actionTime
        );


      // ========================================
      // NIGHT SHIFT
      // ========================================

      if (end < start) {
        end += 24 * 60;
      }


      const workedMinutes =
        Math.max(0, end - start);


      const oldHours =
        attendanceMap.get(clockInDate) || 0;


      attendanceMap.set(
        clockInDate,
        oldHours + workedMinutes / 60
      );
    }
  }


  // ==========================================
  // CURRENT OPEN CLOCK-IN
  //
  // VERY IMPORTANT FOR NIGHT SHIFT
  //
  // If ClockIn = Today 10 PM
  // and ClockOut = Tomorrow 6 AM,
  // keep the live hours against TODAY.
  // ==========================================

  let activeClockIn: any = null;

  for (let i = records.length - 1; i >= 0; i--) {

    if (records[i].actionType === 'ClockIn') {

      let hasClockOut = false;

      for (let j = i + 1; j < records.length; j++) {

        if (records[j].actionType === 'ClockIn') {
          break;
        }

        if (records[j].actionType === 'ClockOut') {
          hasClockOut = true;
          break;
        }
      }

      if (!hasClockOut) {
        activeClockIn = records[i];
        break;
      }
    }
  }


  // ==========================================
  // 7 DAYS
  // ==========================================

  for (let i = 0; i < 7; i++) {

    const dateObj =
      new Date(startOfWeek);

    dateObj.setDate(
      startOfWeek.getDate() + i
    );

    dateObj.setHours(0, 0, 0, 0);


    const dateStr =
      this.formatDate(dateObj);


    const dayName =
      dateObj.toLocaleDateString(
        'en-US',
        {
          weekday: 'short'
        }
      );


    const dayNameFull =
      dateObj.toLocaleDateString(
        'en-US',
        {
          weekday: 'long'
        }
      );


    labels.push(dayName);


    // ==========================================
    // DAY CONDITIONS
    // ==========================================

    const isToday =
      dateStr === todayStr;

    const isFuture =
      dateObj.getTime() > today.getTime();

    const isPast =
      dateObj.getTime() < today.getTime();


    const isWeekoff =
      this.weekoffDates.some(
        x =>
          String(x).trim().toLowerCase() ===
          dayNameFull.trim().toLowerCase()
      );


    let hours = 0;
    let color = '#f4f5f6';


    // ==========================================
    // 1. WEEKOFF
    //
    // NO 8 HOURS
    // NO WORKING HOURS
    // BLACK
    // ==========================================

    if (isWeekoff) {

      hours = 0;

      color = '#0d0d0d';
    }


    // ==========================================
    // 2. TODAY
    // ==========================================

    else if (isToday) {

      // ----------------------------------------
      // Check today's attendance
      // ----------------------------------------

      const todayRecords =
        records.filter(
          x =>
            this.formatDate(
              new Date(x.attendanceDate)
            ) === todayStr
        );


      // ----------------------------------------
      // Calculate completed pairs
      // ----------------------------------------

      let totalMinutes =
        this.calculateTotalWorkedMinutes(
          todayRecords
        );


      // ----------------------------------------
      // Check active ClockIn
      // ----------------------------------------

      if (
        activeClockIn &&
        this.formatDate(
          new Date(activeClockIn.attendanceDate)
        ) === todayStr
      ) {

        const start =
          this.timeToMinutes(
            activeClockIn.actionTime
          );


        const now =
          new Date();

        let current =
          now.getHours() * 60 +
          now.getMinutes();


        // ======================================
        // NIGHT SHIFT
        //
        // Example:
        // ClockIn 22:00
        // Current 01:00
        //
        // 01:00 becomes 25:00
        // ======================================

        if (current < start) {
          current += 24 * 60;
        }


        const liveMinutes =
          Math.max(0, current - start);


        totalMinutes += liveMinutes;
      }


      // ----------------------------------------
      // Maximum 8 hours for chart
      // ----------------------------------------

      hours =
        Math.min(
          8,
          Number(
            (totalMinutes / 60).toFixed(2)
          )
        );


      // ======================================
      // TODAY = GREEN
      // ======================================

      if (hours > 0) {

        color = '#28a745';

      } else {

        // Today absent
        hours = 8;
        color = '#dc3545';
      }
    }


    // ==========================================
    // 3. FUTURE
    // ==========================================

    else if (isFuture) {

      /*
       * Future working day:
       *
       * 8 hours
       * White
       */

      hours = 8;

      color = '#f4f5f6';


      // ----------------------------------------
      // If attendance already exists for
      // this future date, show actual hours
      // in ORANGE.
      // ----------------------------------------

      const futureHours =
        attendanceMap.get(dateStr);


      if (
        futureHours !== undefined &&
        futureHours > 0
      ) {

        hours =
          Math.min(
            8,
            Number(
              futureHours.toFixed(2)
            )
          );

        color = '#ffc107';
      }
    }


    // ==========================================
    // 4. PAST
    // ==========================================

    else if (isPast) {

      const workedHours =
        attendanceMap.get(dateStr);


      // ========================================
      // PRESENT
      // ========================================

      if (
        workedHours !== undefined &&
        workedHours > 0
      ) {

        hours =
          Math.min(
            8,
            Number(
              workedHours.toFixed(2)
            )
          );

        // PRESENT = ORANGE
        color = '#ffc107';

      }


      // ========================================
      // ABSENT
      // ========================================

      else {

        // ABSENT = FULL 8 HOURS
        hours = 8;

        // RED
        color = '#dc3545';
      }
    }


    // ==========================================
    // PUSH
    // ==========================================

    data.push(hours);
    colors.push(color);
  }


  // ==========================================
  // CREATE CHART
  // ==========================================

  this.attendanceChart =
    new Chart(
      'attendanceChart',
      {
        type: 'bar',

        data: {

          labels,

          datasets: [
            {
              label: 'Working Hours',

              data,

              backgroundColor: colors,

              borderRadius: 6
            }
          ]
        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          animation: false,

          plugins: {

            legend: {
              display: false
            },

            tooltip: {

              callbacks: {

                label: (context: any) => {

                  const value =
                    context.raw as number;

                  return ` ${value} Hours`;
                }
              }
            }
          },

          scales: {

            y: {

              beginAtZero: true,

              min: 0,

              max: 8,

              ticks: {

                stepSize: 1,

                callback: (value) =>
                  `${value}h`
              }
            }
          }
        }
      }
    );
}
updateChartTodayHours(totalHours: number) {
  if (!this.attendanceChart) return;

  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'short' });

  const index = this.attendanceChart.data.labels.indexOf(todayLabel);

  if (index !== -1) {
    this.attendanceChart.data.datasets[0].data[index] = totalHours;
    this.attendanceChart.data.datasets[0].backgroundColor[index] = '#28a745'; // GREEN
    this.attendanceChart.update();
  }
}
  // ================= LEAVES =================
  loadLeaves() {
    this.empService.getUserLeaves(this.userId)
      .subscribe((res: any[]) => {
        this.userLeaves = res || [];
        this.calculateLeaveSummary();
      });
  }

  // calculateLeaveSummary() {
  //   let approved = 0, pending = 0, rejected = 0;

  //   this.userLeaves.forEach(l => {
  //     const s = l.status?.toLowerCase();
  //     if (s === 'approved') approved++;
  //     else if (s === 'rejected') rejected++;
  //     else pending++;
  //   });

  //   this.leaveApprovalSummary = { approved, pending, rejected };

  //   this.leaveCards = [
  //     { label: 'Approved', value: approved, icon: 'fas fa-check-circle' },
  //     { label: 'Pending', value: pending, icon: 'fas fa-hourglass-half' },
  //     { label: 'Rejected', value: rejected, icon: 'fas fa-times-circle' }
  //   ];
  // }

  calculateLeaveSummary() {

  let approved = 0, pending = 0, rejected = 0;

  const approvedDetails: any[] = [];
  const pendingDetails: any[] = [];
  const rejectedDetails: any[] = [];

  this.userLeaves.forEach(l => {

    const status = (l.status || '').toLowerCase();
    const leaveType = l.leaveTypeName || l.leaveType || 'Unknown';

    if (status === 'approved') {

      approved++;

      const item = approvedDetails.find(x => x.leaveType === leaveType);

      if (item)
        item.count++;
      else
        approvedDetails.push({ leaveType, count: 1 });

    }
    else if (status === 'rejected') {

      rejected++;

      const item = rejectedDetails.find(x => x.leaveType === leaveType);

      if (item)
        item.count++;
      else
        rejectedDetails.push({ leaveType, count: 1 });

    }
    else {

      pending++;

      const item = pendingDetails.find(x => x.leaveType === leaveType);

      if (item)
        item.count++;
      else
        pendingDetails.push({ leaveType, count: 1 });

    }

  });

  this.leaveApprovalSummary = {
    approved,
    pending,
    rejected,
    approvedDetails,
    pendingDetails,
    rejectedDetails
  };

  this.leaveCards = [
    { label: 'Approved', value: approved, icon: 'fas fa-check-circle' },
    { label: 'Pending', value: pending, icon: 'fas fa-hourglass-half' },
    { label: 'Rejected', value: rejected, icon: 'fas fa-times-circle' }
  ];
}

  // ================= TICKETS =================
  loadTickets() {
    this.helpdeskService.getMyTickets(this.userId)
      .subscribe(res => {
        this.tickets = res || [];
        this.helpdeskPage = 1;
      });
  }

  navigateToLeaveApprovals(label: string) {
    this.router.navigate(['/leave-management'], { queryParams: { tab: 'approvals' } });
  }

  // ================= TIMESHEETS =================
  loadTimesheets() {
    this.timesheetService.gettimesheetlisting(this.userId)
      .subscribe((res: any) => {
        const data = res?.data || res || [];
        this.submittedTimesheets = data.map((t: any) => ({
          ...t,
          timesheetDate: new Date(t.timesheetDate)
        }));
        this.timesheetPage = 1;
      });
  }

  // ================= UTILS =================
  getInitials(name: string): string {
    if (!name) return 'NA';
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[0][0] + parts[1][0]
      : parts[0][0];
  }
  
  ngOnDestroy() {
  if (this.liveTimer) {
    clearInterval(this.liveTimer);
  }
}
 get paginatedTimesheets() {
  const start = (this.timesheetPage - 1) * this.timesheetPageSize;

  return this.submittedTimesheets.slice(
    start,
    start + this.timesheetPageSize
  );
}

get totalTimesheetPages() {
  return Math.max(1, Math.ceil(this.submittedTimesheets.length / this.timesheetPageSize));
}

get timesheetPages(): number[] {
  return Array.from({ length: this.totalTimesheetPages }, (_, index) => index + 1);
}

goToTimesheetPage(page: number): void {
  this.timesheetPage = Math.min(Math.max(page, 1), this.totalTimesheetPages);
}

get paginatedTickets() {
  const start = (this.helpdeskPage - 1) * this.helpdeskPageSize;

  return this.tickets.slice(
    start,
    start + this.helpdeskPageSize
  );
}

get totalTicketPages() {
  return Math.max(1, Math.ceil(this.tickets.length / this.helpdeskPageSize));
}

get ticketPages(): number[] {
  return Array.from({ length: this.totalTicketPages }, (_, index) => index + 1);
}

goToTicketPage(page: number): void {
  this.helpdeskPage = Math.min(Math.max(page, 1), this.totalTicketPages);
}
}

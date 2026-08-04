import { TestBed } from '@angular/core/testing';

import { AttendanceClockService } from './attendance-clock.service';

describe('AttendanceClockService', () => {
  let service: AttendanceClockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttendanceClockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

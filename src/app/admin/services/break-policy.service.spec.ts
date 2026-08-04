import { TestBed } from '@angular/core/testing';

import { BreakPolicyService } from './break-policy.service';

describe('BreakPolicyService', () => {
  let service: BreakPolicyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BreakPolicyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

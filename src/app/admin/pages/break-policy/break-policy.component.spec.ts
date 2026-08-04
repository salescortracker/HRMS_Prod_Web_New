import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakPolicyComponent } from './break-policy.component';

describe('BreakPolicyComponent', () => {
  let component: BreakPolicyComponent;
  let fixture: ComponentFixture<BreakPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BreakPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreakPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

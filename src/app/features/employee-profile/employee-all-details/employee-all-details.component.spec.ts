import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeAllDetailsComponent } from './employee-all-details.component';

describe('EmployeeAllDetailsComponent', () => {
  let component: EmployeeAllDetailsComponent;
  let fixture: ComponentFixture<EmployeeAllDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeAllDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeAllDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

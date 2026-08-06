import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeOfferLetterComponent } from './employee-offer-letter.component';

describe('EmployeeOfferLetterComponent', () => {
  let component: EmployeeOfferLetterComponent;
  let fixture: ComponentFixture<EmployeeOfferLetterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeOfferLetterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeOfferLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

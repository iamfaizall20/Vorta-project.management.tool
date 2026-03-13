import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgRegistrationComponent } from './org-registration';

describe('Signup', () => {
  let component: OrgRegistrationComponent;
  let fixture: ComponentFixture<OrgRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgRegistrationComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OrgRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mytasks } from './mytasks';

describe('Mytasks', () => {
  let component: Mytasks;
  let fixture: ComponentFixture<Mytasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mytasks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mytasks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

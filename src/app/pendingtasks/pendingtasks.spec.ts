import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pendingtasks } from './pendingtasks';

describe('Pendingtasks', () => {
  let component: Pendingtasks;
  let fixture: ComponentFixture<Pendingtasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pendingtasks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pendingtasks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

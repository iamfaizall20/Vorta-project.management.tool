import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Completedtasks } from './completedtasks';

describe('Completedtasks', () => {
  let component: Completedtasks;
  let fixture: ComponentFixture<Completedtasks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Completedtasks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Completedtasks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

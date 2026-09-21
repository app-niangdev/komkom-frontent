import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseAddUpdateComponent } from './expense-add-update.component';

describe('ExpenseAddUpdateComponent', () => {
  let component: ExpenseAddUpdateComponent;
  let fixture: ComponentFixture<ExpenseAddUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExpenseAddUpdateComponent]
    });
    fixture = TestBed.createComponent(ExpenseAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

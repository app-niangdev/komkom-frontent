import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcurementAddComponent } from './procurement-add.component';

describe('ProcurementAddComponent', () => {
  let component: ProcurementAddComponent;
  let fixture: ComponentFixture<ProcurementAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcurementAddComponent]
    });
    fixture = TestBed.createComponent(ProcurementAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

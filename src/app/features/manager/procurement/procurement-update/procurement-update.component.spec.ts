import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcurementUpdateComponent } from './procurement-update.component';

describe('ProcurementUpdateComponent', () => {
  let component: ProcurementUpdateComponent;
  let fixture: ComponentFixture<ProcurementUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcurementUpdateComponent]
    });
    fixture = TestBed.createComponent(ProcurementUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

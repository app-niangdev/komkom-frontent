import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcurementByScannerComponent } from './procurement-by-scanner.component';

describe('ProcurementByScannerComponent', () => {
  let component: ProcurementByScannerComponent;
  let fixture: ComponentFixture<ProcurementByScannerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcurementByScannerComponent]
    });
    fixture = TestBed.createComponent(ProcurementByScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

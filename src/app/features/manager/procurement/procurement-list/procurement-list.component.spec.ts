import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcurementListComponent } from './procurement-list.component';

describe('ProcurementListComponent', () => {
  let component: ProcurementListComponent;
  let fixture: ComponentFixture<ProcurementListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcurementListComponent]
    });
    fixture = TestBed.createComponent(ProcurementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

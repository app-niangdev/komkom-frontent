import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierAddUpdateComponent } from './supplier-add-update.component';

describe('SupplierAddUpdateComponent', () => {
  let component: SupplierAddUpdateComponent;
  let fixture: ComponentFixture<SupplierAddUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SupplierAddUpdateComponent]
    });
    fixture = TestBed.createComponent(SupplierAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

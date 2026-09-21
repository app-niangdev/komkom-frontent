import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerAddUpdateComponent } from './customer-add-update.component';

describe('CustomerAddUpdateComponent', () => {
  let component: CustomerAddUpdateComponent;
  let fixture: ComponentFixture<CustomerAddUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerAddUpdateComponent]
    });
    fixture = TestBed.createComponent(CustomerAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

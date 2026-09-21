import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaiementInvoiceComponent } from './paiement-invoice.component';

describe('PaiementInvoiceComponent', () => {
  let component: PaiementInvoiceComponent;
  let fixture: ComponentFixture<PaiementInvoiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PaiementInvoiceComponent]
    });
    fixture = TestBed.createComponent(PaiementInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

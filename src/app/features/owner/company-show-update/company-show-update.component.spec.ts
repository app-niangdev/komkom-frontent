import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyShowUpdateComponent } from './company-show-update.component';

describe('CompanyShowUpdateComponent', () => {
  let component: CompanyShowUpdateComponent;
  let fixture: ComponentFixture<CompanyShowUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyShowUpdateComponent]
    });
    fixture = TestBed.createComponent(CompanyShowUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

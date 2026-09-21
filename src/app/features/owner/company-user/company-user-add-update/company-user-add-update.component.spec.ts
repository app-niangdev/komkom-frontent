import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyUserAddUpdateComponent } from './company-user-add-update.component';

describe('CompanyUserAddUpdateComponent', () => {
  let component: CompanyUserAddUpdateComponent;
  let fixture: ComponentFixture<CompanyUserAddUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyUserAddUpdateComponent]
    });
    fixture = TestBed.createComponent(CompanyUserAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyUserListComponent } from './company-user-list.component';

describe('CompanyUserListComponent', () => {
  let component: CompanyUserListComponent;
  let fixture: ComponentFixture<CompanyUserListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyUserListComponent]
    });
    fixture = TestBed.createComponent(CompanyUserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

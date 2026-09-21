import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyStoreAddComponent } from './company-store-add.component';

describe('CompanyStoreAddComponent', () => {
  let component: CompanyStoreAddComponent;
  let fixture: ComponentFixture<CompanyStoreAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyStoreAddComponent]
    });
    fixture = TestBed.createComponent(CompanyStoreAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

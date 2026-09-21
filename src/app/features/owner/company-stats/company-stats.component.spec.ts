import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyStatsComponent } from './company-stats.component';

describe('CompanyStatsComponent', () => {
  let component: CompanyStatsComponent;
  let fixture: ComponentFixture<CompanyStatsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyStatsComponent]
    });
    fixture = TestBed.createComponent(CompanyStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

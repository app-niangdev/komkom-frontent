import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerViewStoreComponent } from './owner-view-store.component';

describe('OwnerViewStoreComponent', () => {
  let component: OwnerViewStoreComponent;
  let fixture: ComponentFixture<OwnerViewStoreComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OwnerViewStoreComponent]
    });
    fixture = TestBed.createComponent(OwnerViewStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

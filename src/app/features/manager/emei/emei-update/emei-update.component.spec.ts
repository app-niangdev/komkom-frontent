import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmeiUpdateComponent } from './emei-update.component';

describe('EmeiUpdateComponent', () => {
  let component: EmeiUpdateComponent;
  let fixture: ComponentFixture<EmeiUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmeiUpdateComponent]
    });
    fixture = TestBed.createComponent(EmeiUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

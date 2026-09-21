import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmeiListComponent } from './emei-list.component';

describe('EmeiListComponent', () => {
  let component: EmeiListComponent;
  let fixture: ComponentFixture<EmeiListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmeiListComponent]
    });
    fixture = TestBed.createComponent(EmeiListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

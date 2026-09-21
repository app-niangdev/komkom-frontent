import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryAddUpdateComponent } from './category-add-update.component';

describe('CategoryAddUpdateComponent', () => {
  let component: CategoryAddUpdateComponent;
  let fixture: ComponentFixture<CategoryAddUpdateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CategoryAddUpdateComponent]
    });
    fixture = TestBed.createComponent(CategoryAddUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

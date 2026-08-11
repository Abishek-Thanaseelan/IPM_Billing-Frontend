import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseReturnListComponent } from './purchase-return-list.component';

describe('PurchaseReturnListComponent', () => {
  let component: PurchaseReturnListComponent;
  let fixture: ComponentFixture<PurchaseReturnListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PurchaseReturnListComponent]
    });
    fixture = TestBed.createComponent(PurchaseReturnListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

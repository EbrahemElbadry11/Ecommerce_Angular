import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerApproval } from './seller-approval';

describe('SellerApproval', () => {
  let component: SellerApproval;
  let fixture: ComponentFixture<SellerApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerApproval],
    }).compileComponents();

    fixture = TestBed.createComponent(SellerApproval);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

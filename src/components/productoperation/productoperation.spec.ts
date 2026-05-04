import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Productoperation } from './productoperation';

describe('Productoperation', () => {
  let component: Productoperation;
  let fixture: ComponentFixture<Productoperation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Productoperation],
    }).compileComponents();

    fixture = TestBed.createComponent(Productoperation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

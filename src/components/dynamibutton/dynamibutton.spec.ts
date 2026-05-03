import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dynamibutton } from './dynamibutton';

describe('Dynamibutton', () => {
  let component: Dynamibutton;
  let fixture: ComponentFixture<Dynamibutton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dynamibutton],
    }).compileComponents();

    fixture = TestBed.createComponent(Dynamibutton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

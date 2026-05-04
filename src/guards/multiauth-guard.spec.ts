import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { multiauthGuard } from './multiauth-guard';

describe('multiauthGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => multiauthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

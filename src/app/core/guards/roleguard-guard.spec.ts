import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import * as roleguardGuardModule from './roleguard-guard';

describe('roleguardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => {
      const guardFn = (roleguardGuardModule as any).roleguardGuard ?? (roleguardGuardModule as any).default;
      return guardFn(...guardParameters);
    });

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { businessSetupGuard } from './business-setup.guard';

describe('businessSetupGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => businessSetupGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

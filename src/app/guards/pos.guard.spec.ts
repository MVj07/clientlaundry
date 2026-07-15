import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { pickupGuard } from './pickup.guard';

describe('pickupGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => pickupGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

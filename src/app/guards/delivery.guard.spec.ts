import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { deliveryGuard } from './delivery.guard';

describe('deliveryGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => deliveryGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

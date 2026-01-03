import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { packingGuard } from './packing.guard';

describe('packingGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => packingGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

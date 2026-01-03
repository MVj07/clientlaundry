import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { ironingGuard } from './ironing.guard';

describe('ironingGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => ironingGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

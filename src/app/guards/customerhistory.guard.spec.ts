import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { customerhistoryGuard } from './customerhistory.guard';

describe('customerhistoryGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => customerhistoryGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

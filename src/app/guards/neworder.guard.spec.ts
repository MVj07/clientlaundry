import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { neworderGuard } from './neworder.guard';

describe('neworderGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => neworderGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

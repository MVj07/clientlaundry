import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { washingGuard } from './washing.guard';

describe('washingGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => washingGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

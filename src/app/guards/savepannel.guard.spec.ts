import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { savepannelGuard } from './savepannel.guard';

describe('savepannelGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => savepannelGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

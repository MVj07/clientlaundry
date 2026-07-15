import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StorageService } from '../../services/storage.service';
import { newOrderService } from '../../services/newOrder/newOrder.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  searchText: string = '';
  dateOrdersmnth :any;
  storeName: any = 'Laundry';

  isOrdersExpanded: boolean = true;
  isDeliveryExpanded: boolean = true;
  isCustomerExpanded: boolean = true;
  isSettingsExpanded: boolean = true;
  isMobileMenuOpen: boolean = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private orderService: newOrderService
  ){
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isMobileMenuOpen = false;
    });
  }

  ngOnInit() {
    const store = this.storageService.getItem('store');
    this.storeName = store;

    // Auto-expand the category related to current route
    const url = this.router.url;
    this.isOrdersExpanded = url.includes('/orders') || url.includes('/savepannel');
    this.isDeliveryExpanded = url.includes('/delivery') || url.includes('/pickup') || url.includes('/deliveryhistory');
    this.isCustomerExpanded = url.includes('/customerhistory');
    this.isSettingsExpanded = url.includes('/dailyexpenses') || url.includes('/services') || url.includes('/settings');
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  toggleOrders() {
    this.isOrdersExpanded = !this.isOrdersExpanded;
  }

  toggleDelivery() {
    this.isDeliveryExpanded = !this.isDeliveryExpanded;
  }

  toggleCustomer() {
    this.isCustomerExpanded = !this.isCustomerExpanded;
  }

  toggleSettings() {
    this.isSettingsExpanded = !this.isSettingsExpanded;
  }

  search() {
    const payload = { search: this.searchText };
    this.orderService.overallsearch(payload).subscribe((res:any) => {
      this.dateOrdersmnth = res.data;
    });
  }

  logout(): void {
    this.storageService.removeItem('authToken');
    this.router.navigate(['/']);
  }
}

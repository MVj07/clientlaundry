import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { newOrderService } from '../../services/newOrder/newOrder.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  searchText: string = '';
  dateOrdersmnth :any
  constructor(
    private router: Router,
    private storageService: StorageService,
    private orderService: newOrderService
  ){}

  search() {
    const payload = { search: this.searchText };
  
    this.orderService.overallsearch(payload).subscribe((res:any) => {
      this.dateOrdersmnth = res.data;
    });
  }
  logout():void{
    this.storageService.removeItem('authToken')
    this.router.navigate(['/'])
  }
}

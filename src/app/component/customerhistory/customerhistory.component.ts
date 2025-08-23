import { Component } from '@angular/core';
import { CustomerService } from '../../services/customer/customer.service';
import { LoginService } from '../../services/login/login.service';

@Component({
  selector: 'app-customerhistory',
  templateUrl: './customerhistory.component.html',
  styleUrl: './customerhistory.component.css'
})
export class CustomerhistoryComponent {
  customers: any;
  p: number = 1;
  searchTerm:string=''
  constructor(
    private customerService: CustomerService,
    private authservice: LoginService
  ){}
  ngOnInit(): void {
    this.customerService.getAll(this.searchTerm).subscribe({
      next:(res)=>{
        console.log(res)
        this.customers = res.data
      },
      error: (err) => {
          console.error('customer Error:', err);
          if (err.status === 401 || err.status === 403) {
          this.authservice.logOut(); // You must have a method that clears tokens and navigates to login
          return;
        }
        }
    })
  }

  onSearch():void{
    // if (!this.searchTerm.trim()) return;
    this.customerService.getAll(this.searchTerm).subscribe({
      next: (res)=>{
        this.customers=res.data
      },
      error: (err) => {
          console.error('customer Error:', err);
        }
    })
  }
}

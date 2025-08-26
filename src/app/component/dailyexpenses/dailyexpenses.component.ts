import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { CustomerService } from '../../services/customer/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { ExpenseService } from '../../services/expense/expense.service';

@Component({
  selector: 'app-dailyexpenses',
  templateUrl: './dailyexpenses.component.html',
  styleUrl: './dailyexpenses.component.css'
})
export class DailyexpensesComponent {
  submit: boolean = false;
  newOrderForm!: FormGroup;
  itemForm!: FormGroup;
  orders: any[] = [];
  customerId: string | null = null;
  page: number = 1;
  limit: number = 5;
  totalItems: number = 0;
  isLoading = true;
  p: number = 1;
  options = ["Today", "This Month"];
  selected = 'today';
  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private route: ActivatedRoute,
    private router: Router,
    private authservice: LoginService
  ) { }
  getExpense(): void {
    this.expenseService.getAllExpense(this.page, this.limit, this.selected).subscribe({
      next: (res) => {
        console.log(res.data)
        this.orders = res.data
        this.totalItems = res.meta.total
        this.isLoading = false;
      },
      error: (err) => {
        // alert('Order failed')
        this.isLoading = false;
        console.error('customer Error:', err);
        // if (err.status === 401 || err.status === 403) {
        //   this.authservice.logOut(); // You must have a method that clears tokens and navigates to login
        //   return;
        // }
      },
    })
  }
  ngOnInit(): void {
    this.newOrderForm = this.fb.group({
      kuri: ['', Validators.required],
      name: ['', Validators.required],
      mobile: ['', Validators.required],
      // items: ['', Validators.required],
      // quantity: [1, Validators.required],
      // amount: [0, Validators.required],
    })
    this.getExpense()
  }

  get form() {
    return this.newOrderForm?.controls;
  }

  formSubmit() {
    this.submit = true;
    if (this.newOrderForm.invalid) {
      return;
    }
    const formValue = this.newOrderForm.value;
    const orderPayload = {
      quantity: formValue.kuri,
      item: formValue.name,
      unitprice: formValue.mobile,
    };
    this.expenseService.create(orderPayload).subscribe({
      next: (res) => {
        this.newOrderForm.reset();
        this.submit = false;
        this.getExpense()
        alert('Order successfully')
      },
      error: (err) => {
        alert('Order failed')
        return;
      },
    })
  }

  removeOrder(index: number) {
    this.orders.splice(index, 1);
  }

  getTotalAmount(): number {
    return this.orders.reduce((sum, order) => sum + (order.quantity * order.unitprice), 0);
  }

  pageChanged(newPage: number): void {
    this.page = newPage;
    this.getExpense();
  }

  select(option: string) {
    this.selected = option;
    this.getExpense()
  }
}

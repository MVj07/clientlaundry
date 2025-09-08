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
  dateOrders: any[] = [];
  dateOrdersmnth: any[] = [];
  customerId: string | null = null;
  page: number = 1;
  limit: number = 5;
  totalItems: number = 0;
  isLoading = true;
  p: number = 1;
  options = ["Today", "This Month"];
  selected = 'today';
  daywiseExpenses: any[] = [];
  monthwiseExpenses: any[] = [];
  selectedDate: string = '';

  months = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 }
  ];

  years: number[] = [];

  selectedMonth: any;
  selectedYear: any;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private route: ActivatedRoute,
    private router: Router,
    private authservice: LoginService
  ) {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 20 }, (_, i) => currentYear + i);
   }

  submitFilter() {
    const payload = {
      month: this.selectedMonth,
      year: this.selectedYear,
    };

    // this.expenseService.post('http://localhost:3000/api/filter-data', payload)
    //   .subscribe(response => {
    //     console.log('Filtered data:', response);
    //   });
    this.expenseService.getMonthwiseExpenses(payload).subscribe((res:any) => {
      this.dateOrdersmnth = res.data;
    });
  }
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
        this.expenseService.getDaywiseExpenses().subscribe((res:any) => {
      this.daywiseExpenses = res.data;
    });

    // this.expenseService.getMonthwiseExpenses().subscribe((res:any) => {
    //   this.monthwiseExpenses = res.data;
    // });
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
    return this.dateOrders.reduce((sum, order) => sum + (order.quantity * order.unitprice), 0);
  }
  getTotalAmountmnth(): number {
    return this.dateOrdersmnth.reduce((sum, order) => sum + (order.totalAmount), 0);
  }

  pageChanged(newPage: number): void {
    this.page = newPage;
    this.getExpense();
  }

  select(option: string) {
    this.selected = option;
    this.getExpense()
  }
  onDateChange() {
    this.fetchExpenses();
  }
  fetchExpenses() {
    if (!this.selectedDate) return;
    this.expenseService.getExpensesByDate({"date":this.selectedDate}).subscribe({
      next: (res) => {
        this.dateOrders = res.data;
      },
      error: (err) => {
        console.error('Error fetching expenses:', err);
      }
    });
  }
}

import { Component } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer/customer.service';
import { LoginService } from '../../services/login/login.service';

@Component({
  selector: 'app-neworder',
  templateUrl: './neworder.component.html',
  styleUrl: './neworder.component.css'
})
export class NeworderComponent {
  orditems: any = []
  submit: boolean = false;
  itemSubmit: boolean = false;
  newOrderForm!: FormGroup;
  itemForm!: FormGroup;
  orders: any[] = [];
  customerId: string|null=null;
  p:number=1
  constructor(
    private fb: FormBuilder,
    private newOrderService: newOrderService,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router,
    private authservice: LoginService
  ) { }
  ngOnInit(): void {
    this.newOrderForm = this.fb.group({
      kuri: ['', Validators.required],
      date: ['', Validators.required],
      name: ['', Validators.required],
      mobile: ['', Validators.required],
      address: ['', Validators.required],
      // items: ['', Validators.required],
      // quantity: [1, Validators.required],
      // amount: [0, Validators.required],
    })

    this.itemForm = this.fb.group({
      items: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      amount: [0, [Validators.required, Validators.min(1)]]
    });

    this.newOrderService.getAllItems().subscribe({
      next: (res) => {
        console.log(res.data)
        this.orditems = res.data
      },
      error: (err) => {
      // alert('Order failed')
      if (err.status === 401 || err.status === 403) {
          this.authservice.logOut(); // You must have a method that clears tokens and navigates to login
          return;
        }
      return;
    },
    })
    this.route.params.subscribe(params => {
      this.customerId = params['id'];
      if (this.customerId) {
        this.fetchOrderDetails(this.customerId);
      } 
    })
  }

  fetchOrderDetails(customerId: string): void {
    // Fetch the order details using the service
    this.customerService.getById(customerId).subscribe(data => {
      console.log(data)
      this.newOrderForm.patchValue({
        name: data.data.name,
        mobile: data.data.mobile,
        address: data.data.address
      });
    });
  }

  get form() {
    return this.newOrderForm?.controls;
  }

  get itemControls() {
    return this.itemForm?.controls;
  }

  formSubmit() {
    this.submit = true;
    if (this.newOrderForm.invalid || this.orders.length===0) {
      return;
    }
    const formValue = this.newOrderForm.value;
    const orderPayload = {
    kuri: formValue.kuri,
    date: formValue.date,
    customerName: formValue.name,
    phoneNumber: formValue.mobile,
    address: formValue.address,
    status: '',
    items: this.orders.map(order => ({
      _id: order.id,
      name: order.name,
      qty: order.qty,
      amount: order.price
    })),
    total: this.getTotalAmount()
  };
  this.newOrderService.newOrder(orderPayload).subscribe({
    next: (res) => {
      this.newOrderForm.reset();
      this.itemForm.reset();
      this.submit = false;
      this.orders=[]
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

  addOrder() {
    this.itemSubmit = true;
    if (this.itemForm.invalid) return;

    const formValue = this.itemForm.value;
    console.log(formValue)
    const orderData = {
      id: formValue.items._id,
      name: formValue.items.name,
      qty: formValue.quantity,
      price: formValue.amount
    };
    console.log(orderData)

    this.orders.push(orderData);

    // (Optional) Reset form or part of it
    this.itemForm.patchValue({
      items: null,
      quantity: 1,
      amount: 0
    });
    this.itemSubmit = false
  }

  getTotalAmount(): number {
  return this.orders.reduce((sum, order) => sum + (order.qty * order.price), 0);
}



}

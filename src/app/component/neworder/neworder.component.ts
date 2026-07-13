import { Component, HostListener, ElementRef } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer/customer.service';
import { LoginService } from '../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-neworder',
  templateUrl: './neworder.component.html',
  styleUrl: './neworder.component.css'
})
export class NeworderComponent {
  orditems: any = []
  submit: boolean = false;
  itemSubmit: boolean = false;
  loading: boolean = false;
  newOrderForm!: FormGroup;
  itemForm!: FormGroup;
  orders: any[] = [];
  customerId: string | null = null;
  p: number = 1
  update: any = null
  
  suggestions: any[] = [];
  showSuggestions: boolean = false;
  activeField: 'name' | 'mobile' | null = null;

  constructor(
    private fb: FormBuilder,
    private newOrderService: newOrderService,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router,
    private authservice: LoginService,
    private toaster: ToastrService,
    private eRef: ElementRef
  ) { }
  ngOnInit(): void {
    this.newOrderForm = this.fb.group({
      date: ['', Validators.required],
      dueDate: ['', Validators.required],
      specialInstructions: [''],
      name: ['', Validators.required],
      mobile: ['', Validators.required],
      address: ['', Validators.required],
      whatsapp: [''],
      sameAsPhone: [false]
    })

    this.itemForm = this.fb.group({
      items: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      amount: [0, [Validators.required, Validators.min(1)]]
    });

    this.newOrderForm.get('mobile')?.valueChanges.subscribe(val => {
      if (this.newOrderForm.get('sameAsPhone')?.value) {
        this.newOrderForm.get('whatsapp')?.setValue(val, { emitEvent: false });
      }
    });

    this.newOrderForm.get('sameAsPhone')?.valueChanges.subscribe(checked => {
      if (checked) {
        const phone = this.newOrderForm.get('mobile')?.value;
        this.newOrderForm.get('whatsapp')?.setValue(phone, { emitEvent: false });
        this.newOrderForm.get('whatsapp')?.disable();
      } else {
        this.newOrderForm.get('whatsapp')?.enable();
      }
    });

    this.newOrderForm.get('name')?.valueChanges.subscribe(val => {
      if (this.newOrderForm.get('name')?.dirty && val && val.length >= 2) {
        this.fetchSuggestions(val, 'name');
      } else {
        if (this.activeField === 'name') {
          this.showSuggestions = false;
        }
      }
    });

    this.newOrderForm.get('mobile')?.valueChanges.subscribe(val => {
      if (this.newOrderForm.get('mobile')?.dirty && val && val.length >= 2) {
        this.fetchSuggestions(val, 'mobile');
      } else {
        if (this.activeField === 'mobile') {
          this.showSuggestions = false;
        }
      }
    });

    this.newOrderService.getAllItems().subscribe({
      next: (res) => {
        console.log(res.data)
        this.orditems = res.data
      },
      error: (err) => {
        // alert('Order failed')
        // if (err.status === 401 || err.status === 403) {
        //     this.authservice.logOut(); // You must have a method that clears tokens and navigates to login
        //     return;
        //   }
        return;
      },
    })
    this.route.params.subscribe(params => {
      this.customerId = params['id'];
      if (this.customerId) {
        this.fetchOrderDetails(this.customerId);
      }
    })
    this.route.queryParams.subscribe(params => {
      if (params['items']) {
        try {
          this.orders = JSON.parse(params['items'])
          console.log(this.orders, params['date'])
        } catch (e) {
          console.error('Error parsing items JSON from query params', e);
          this.orders = []
        }
      } else {
        this.orders = []
      }
      this.update = params['orderId']
      const dateVal = params['date'] ? params['date'].split('T')[0] : '';
      const dueDateVal = params['dueDate'] ? params['dueDate'].split('T')[0] : '';
      this.newOrderForm.patchValue({
        kuri: params['kuri'],
        date: dateVal,
        dueDate: dueDateVal,
        specialInstructions: params['specialInstructions'] || '',
        bill: params['bill']
      })
      if (this.update) {
        this.newOrderForm.get('kuri')?.disable();
        this.newOrderForm.get('name')?.disable();
        this.newOrderForm.get('mobile')?.disable();
        this.newOrderForm.get('address')?.disable();
        this.newOrderForm.get('date')?.disable();
        this.newOrderForm.get('bill')?.disable();
      }
    })
  }

  fetchOrderDetails(customerId: string): void {
    // Fetch the order details using the service
    this.customerService.getById(customerId).subscribe(data => {
      console.log(data)
      const cust = data.data;
      this.newOrderForm.patchValue({
        name: cust.name,
        mobile: cust.mobile,
        address: cust.address,
        whatsapp: cust.whatsapp || '',
        sameAsPhone: cust.mobile && cust.whatsapp && cust.mobile === cust.whatsapp
      });
      if (cust.mobile && cust.whatsapp && cust.mobile === cust.whatsapp) {
        this.newOrderForm.get('whatsapp')?.disable();
      }
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
    if (this.newOrderForm.invalid || this.orders.length === 0) {
      return;
    }
    this.loading = true;
    const formValue = this.newOrderForm.getRawValue();
    const orderPayload = {
      customerId: this.customerId,
      orderId: this.update,
      kuri: formValue.kuri,
      bill: formValue.bill,
      date: formValue.date,
      dueDate: formValue.dueDate,
      specialInstructions: formValue.specialInstructions || '',
      customerName: formValue.name,
      phoneNumber: formValue.mobile,
      whatsappNumber: formValue.whatsapp,
      address: formValue.address,
      status: 'confirm',
      type: 'item',
      items: this.orders.map(order => ({
        _id: order.id,
        name: order.name,
        qty: order.qty,
        amount: order.amount
      })),
      total: this.getTotalAmount()
    };
    if (!this.update) {
      this.newOrderService.newOrder(orderPayload).subscribe({
        next: (res) => {
          this.newOrderForm.reset();
          this.itemForm.reset();
          this.submit = false;
          this.orders = []
          this.loading = false;
          // alert('Order successfully')
          this.toaster.success('Order success', 'success')
        },
        error: (err) => {
          // alert('Order failed')
          this.toaster.error('Order failed')
          this.loading = false;
          return;
        },
      })
    } else {
      this.newOrderService.updateOrder(orderPayload).subscribe({
        next: (res) => {
          // console.log('updated')
          this.newOrderForm.reset();
          this.itemForm.reset();
          this.submit = false;
          this.orders = []
          this.loading = false;
          // alert(res.message)
          this.toaster.success(res.message)
          this.router.navigate(['/savepannel']);
        },
        error: (err) => {
          // alert('Order update failed')
          this.toaster.error('Order update failed')
          this.loading = false;
          return;
        },
      })
    }
  }

  removeOrder(index: number) {
    this.orders.splice(index, 1);
  }

  addOrder() {
    this.itemSubmit = true;
    if (this.itemForm.invalid) return;

    const formValue = this.itemForm.value;
    const orderData = {
      id: formValue.items._id,
      name: formValue.items.name,
      qty: formValue.quantity,
      amount: formValue.amount
    };

    // ✅ Check for duplicate id
    const exists = this.orders.some(order => order.id === orderData.id);
    if (exists) {
      alert("This item is already added to the order list.");
      this.itemSubmit = false;
      return;
    }

    this.orders.push(orderData);

    // Reset form fields
    this.itemForm.patchValue({
      items: null,
      quantity: 1,
      amount: 0
    });
    this.itemSubmit = false;
  }


  getTotalAmount(): number {
    return this.orders.reduce((sum, order) => sum + (order.qty * order.amount), 0);
  }

  onItemsChange(event: any) {
    const item = this.itemForm.get('items')?.value;
    console.log(item);
    this.itemForm.patchValue({
      amount: item.price
    });
  }

  fetchSuggestions(term: string, field: 'name' | 'mobile') {
    this.activeField = field;
    this.customerService.getAll(term).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.suggestions = res.data;
          this.showSuggestions = this.suggestions.length > 0;
        } else {
          this.suggestions = [];
          this.showSuggestions = false;
        }
      },
      error: () => {
        this.suggestions = [];
        this.showSuggestions = false;
      }
    });
  }

  selectCustomer(cust: any) {
    this.customerId = cust._id;
    this.newOrderForm.patchValue({
      name: cust.name,
      mobile: cust.mobile,
      whatsapp: cust.whatsapp || '',
      address: cust.address || '',
      sameAsPhone: cust.mobile && cust.whatsapp && cust.mobile === cust.whatsapp
    });
    if (cust.mobile && cust.whatsapp && cust.mobile === cust.whatsapp) {
      this.newOrderForm.get('whatsapp')?.disable();
    } else {
      this.newOrderForm.get('whatsapp')?.enable();
    }
    this.showSuggestions = false;
    this.suggestions = [];
    this.activeField = null;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
    }
  }

}

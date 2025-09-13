import { Component } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  passwords = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  error = '';
  success = '';
  loading = false;
  orderForm!: FormGroup;
  submit: boolean = false;
  orders: any[] = [];
  page: number = 1;
  limit: number = 5;
  totalItems: number = 0;
  additems: any = [];
  constructor(
    private orderService: newOrderService,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.orderForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
    })
    this.listItems()
  }

  get form() {
    return this.orderForm?.controls;
  }

  passwordsMatch(): boolean {
    return this.passwords.newPassword === this.passwords.confirmPassword;
  }

  onSubmit() {
    if (!this.passwordsMatch()) {
      this.error = 'New passwords does not match';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    let payload = {
      currentPassword: this.passwords.currentPassword,
      newPassword: this.passwords.newPassword,
      confirmPassword: this.passwords.confirmPassword,
      userId: localStorage.getItem('userId')
    }
    this.orderService.changePassword(payload).subscribe({
      next: (res) => {
        console.log('Login Success:', res);
        if (res) {
          alert(res.message)
          this.passwords = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
          this.loading = false
        }
      },
      error: (err) => {
        alert(err.error.message)
        this.loading = false
      }
    });
  }
  pageChanged(newPage: number): void {
    this.page = newPage;
    // this.getExpense();
  }

  additem() {
    this.submit = true;
    if (this.orderForm.invalid) return;

    const formValue = this.orderForm.value;
    const orderData = {
      name: formValue.name,
      price: formValue.price,
    };
    // this.additems.push(orderData)
    this.orderService.createItems(Array(orderData)).subscribe({
      next: (res) => {
        this.orderForm.patchValue({
          name: "",
          price: 0
        })
        if (res) {
          this.listItems()
          alert(res.message)
        }
      },
      error: (err) => {
        alert(err.error.message)
      }
    })
  }

  deleteItem(index: number) {
    // this.additems.splice(index, 1);
    this.orderService.deleteItem({ itemId: index }).subscribe({
      next: (res) => {
        if (res) {
          this.listItems()
          alert(res.message)
        }
      },
      error: (err) => {
        alert(err.error.message)
      }
    })
  }

  listItems(): void {
    this.orderService.getAllItems().subscribe({
      next: (res) => {
        if (res) {
          // alert(res.message)
          this.additems = res.data
        }
      },
      error: (err) => {
        alert(err.error.message)
      }
    })
  }
}

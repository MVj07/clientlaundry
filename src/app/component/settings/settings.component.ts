import { Component } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { ToastrService } from 'ngx-toastr';

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
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private orderService: newOrderService,
    private toast: ToastrService
  ) { }

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
        if (res) {
          this.toast.success(res.message);
          this.passwords = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
          this.loading = false;
        }
      },
      error: (err) => {
        this.toast.error(err.error.message);
        this.loading = false;
      }
    });
  }
}

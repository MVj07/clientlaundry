import { Component, OnInit } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { ToastrService } from 'ngx-toastr';
import { TagPrintService, ThermalTagSettings } from '../../services/tag-print/tag-print.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
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

  tagSettings: ThermalTagSettings = {
    paperSize: '58mm',
    autoShowModalOnOrderCreate: true,
    showBarcode: true,
    showShopName: true,
    showKuriNo: true,
    showCustomerMobile: true,
    showDueDate: true,
    showInstructions: true,
    copiesPerPiece: 1
  };

  constructor(
    private orderService: newOrderService,
    private toast: ToastrService,
    public tagPrintService: TagPrintService
  ) { }

  ngOnInit(): void {
    this.tagSettings = this.tagPrintService.getSettings();
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

  saveTagSettings() {
    this.tagPrintService.saveSettings(this.tagSettings);
    this.toast.success('Thermal printer & tag configuration saved!', '✅ Settings Saved');
  }

  testPrintSampleTag() {
    const sampleOrder = {
      bill: 'SAMPLE-101',
      kuri: '99',
      customerName: 'Demo Customer',
      phoneNumber: '9876543210',
      dueDate: new Date(Date.now() + 86400000 * 2),
      items: [
        { name: 'Shirt (Dry Clean)', qty: 2, amount: 50 },
        { name: 'Suit (3-Piece)', qty: 1, amount: 150 }
      ]
    };
    const sampleBusiness = {
      business_name: 'LAUNDRY SERVICE DEMO'
    };
    this.tagPrintService.printGarmentTags(sampleOrder, sampleBusiness, this.tagSettings);
  }
}

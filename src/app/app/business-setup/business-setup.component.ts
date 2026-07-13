import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BusinessService } from '../../services/business/business.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-business-setup',
  templateUrl: './business-setup.component.html',
  styleUrl: './business-setup.component.css'
})
export class BusinessSetupComponent {
  businessForm!: FormGroup;
  selectedLogo: File | null = null;
  businesssubmit: boolean = false;
  loading = false;

  constructor(private fb: FormBuilder,
    private businessService: BusinessService,
    private toaster: ToastrService,
    private router: Router
  ) {
    this.businessForm = this.fb.group({
      business_name: ['', Validators.required],
      owner_name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      address: ['', Validators.required],
      gst_no: ['']
    });
  }

  get form(){
    return this.businessForm?.controls
  }

  onFileSelected(event: any) {
    this.selectedLogo = event.target.files[0];
  }

  submit() {
    this.businesssubmit = true;
    if (this.businessForm.invalid) return;

    const formData = new FormData();
    Object.keys(this.businessForm.value).forEach(key => {
      formData.append(key, this.businessForm.value[key]);
    });

    if (this.selectedLogo) {
      formData.append("logo", this.selectedLogo);
    }
    
    this.loading = true;
    this.businessService.create(formData).subscribe({
      next: (res)=>{
        this.businessForm.reset()
        this.businesssubmit=false
        localStorage.setItem("profile", "true");
        this.toaster.success('Company created successfully')
        this.loading = false;
        this.router.navigate(['/home'])
      },
      error: (err) => {
        this.toaster.error('Registration failed')
        this.loading = false;
        return;
      },
    })
    console.log("Submitted:", this.businessForm.value);
  }
}

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
  // constructor(private toast: ToastrService){}
  businessForm!: FormGroup;
  selectedLogo: File | null = null;
  businesssubmit: boolean = false;
  step=1
  currentStep = 1;
  workflows: any[] = [];
  steps: string[] = ['washing'];
  loading = false;

  addStep() {
    if(this.steps.length<=8){
      this.steps.push('');
    }else{
      this.toaster.error('You cannot add more than 8.')
    }
  }
  Remove(index:any){
    console.log(index)
    this.steps.splice(index, 1)
  }
  trackByIndex(index: number) {
  return index;
}

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
  ngOninit(){
    console.log(this.businessForm.invalid)
  }

  
goNext() {
  if (this.businessForm.invalid) {
    this.businesssubmit = true;
    return;
  }
  this.currentStep = 2;
}

goBack() {
  this.currentStep = 1;
}

addWorkflow() {
  this.workflows.push({ name: '', identifier: '' });
}

removeWorkflow(index: number) {
  this.workflows.splice(index, 1);
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
    
    if (this.steps.length===0){
      this.toaster.error('No steps')
      return;
    }
    
    console.log(this.steps.some(item=>item===""))
    if(this.steps.some(item=>item==="")){
      this.toaster.error('Fill all fields')
      return;
    }

    this.loading = true;
    this.businessService.create(formData).subscribe({
      next: (res)=>{
        this.businessForm.reset()
        this.businesssubmit=false
        localStorage.setItem("profile", "true");
        this.businessService.createWorkflow({'workflows':this.steps}).subscribe({
          next: (res)=>{
            this.toaster.success('Company created successfully')
            localStorage.setItem('workflow', JSON.stringify(res.data))
            this.loading = false;
            this.router.navigate(['/home'])
          },error: (err) => {
            this.toaster.error('Order failed')
            this.loading = false;
            return;
          },
        })
      },
      error: (err) => {
        this.toaster.error('Order failed')
        this.loading = false;
        return;
      },
    })
    console.log("Submitted:", this.businessForm.value);
  }
}

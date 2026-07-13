import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ServiceService } from '../../services/service/service.service';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {
  services: any[] = [];
  serviceForm!: FormGroup;
  editingServiceId: string | null = null;
  submit: boolean = false;
  loading: boolean = false;
  saving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private serviceService: ServiceService,
    private toaster: ToastrService
  ) { }

  ngOnInit(): void {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
    this.loadServices();
  }

  loadServices() {
    this.loading = true;
    this.serviceService.getAll().subscribe({
      next: (res) => {
        this.services = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.toaster.error('Failed to load services');
        this.loading = false;
      }
    });
  }

  get form() {
    return this.serviceForm.controls;
  }

  onSubmit() {
    this.submit = true;
    if (this.serviceForm.invalid) return;

    this.saving = true;
    const data = this.serviceForm.value;

    if (this.editingServiceId) {
      this.serviceService.update(this.editingServiceId, data).subscribe({
        next: (res) => {
          this.toaster.success('Service updated successfully');
          this.resetForm();
          this.loadServices();
        },
        error: (err) => {
          this.toaster.error(err?.error?.message || 'Update failed');
          this.saving = false;
        }
      });
    } else {
      this.serviceService.create(data).subscribe({
        next: (res) => {
          this.toaster.success('Service created successfully');
          this.resetForm();
          this.loadServices();
        },
        error: (err) => {
          this.toaster.error(err?.error?.message || 'Creation failed');
          this.saving = false;
        }
      });
    }
  }

  editService(service: any) {
    this.editingServiceId = service._id;
    this.serviceForm.patchValue({
      name: service.name,
      description: service.description || ''
    });
  }

  deleteService(id: string) {
    if (confirm('Are you sure you want to delete this service?')) {
      this.serviceService.delete(id).subscribe({
        next: () => {
          this.toaster.success('Service deleted successfully');
          this.loadServices();
        },
        error: (err) => {
          this.toaster.error('Failed to delete service');
        }
      });
    }
  }

  resetForm() {
    this.serviceForm.reset();
    this.editingServiceId = null;
    this.submit = false;
    this.saving = false;
  }
}

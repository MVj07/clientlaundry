import { Component } from '@angular/core';
import { BusinessService } from '../../services/business/business.service';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.css'
})
export class WorkflowComponent {
  constructor(
    private businessservice: BusinessService
  ){}
  steps: string[] = ['washing'];

  addStep() {
    this.steps.push('');
  }
  
  trackByIndex(index: number) {
  return index;
}

  save() {
    const payload = {
      workflows: this.steps.map(s => ({ name: s, indentifier: s.trim().toLowerCase() }))
    };
    console.log(payload)
    this.businessservice.createWorkflow(payload).subscribe({
      next: (res)=>{
        console.log(res)
      }
    })
    // this.http.post('/api/workflow', payload).subscribe(() => {
    //   this.router.navigate(['/orders']);
    // });
  }

}

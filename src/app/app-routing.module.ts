import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { HomeComponent } from './component/home/home.component';
import { NeworderComponent } from './component/neworder/neworder.component';
import { SavepannelComponent } from './component/savepannel/savepannel.component';
import { WashingComponent } from './component/washing/washing.component';
import { IroningComponent } from './component/ironing/ironing.component';
import { DeliveryComponent } from './component/delivery/delivery.component';
import { DeliveryhistoryComponent } from './component/deliveryhistory/deliveryhistory.component';
import { CustomerhistoryComponent } from './component/customerhistory/customerhistory.component';
import { DailyexpensesComponent } from './component/dailyexpenses/dailyexpenses.component';
import { authGuard } from './guards/auth.guard';
import { InvoiceComponent } from './component/invoice/invoice.component';
import { SettingsComponent } from './component/settings/settings.component';
import { PackingComponent } from './packing/packing.component';
import { BusinessSetupComponent } from './app/business-setup/business-setup.component';
import { businessSetupGuard } from './guards/business-setup.guard';
import { homeGuard } from './guards/home.guard';
import { neworderGuard } from './guards/neworder.guard';
import { savepannelGuard } from './guards/savepannel.guard';
import { washingGuard } from './guards/washing.guard';
import { ironingGuard } from './guards/ironing.guard';
import { customerhistoryGuard } from './guards/customerhistory.guard';
import { expenseGuard } from './guards/expense.guard';
import { settingsGuard } from './guards/settings.guard';
import { SignupComponent } from './component/signup/signup.component';
import { OrdersComponent } from './component/orders/orders.component';
import { WorkflowComponent } from './component/workflow/workflow.component';

const routes: Routes = [
  { path: 'edit-order/:id', component: NeworderComponent },
  { path: '', component: LoginComponent, canActivate:[authGuard] },
  { path: 'home', component: HomeComponent, canActivate: [homeGuard] },
  { path: 'neworder', component: NeworderComponent, canActivate: [neworderGuard] },
  { path: 'savepannel', component: SavepannelComponent, canActivate: [savepannelGuard] },
  { path: 'washing', component: WashingComponent, canActivate: [washingGuard] },
  { path: 'ironing', component: IroningComponent, canActivate: [ironingGuard] },
  { path: 'delivery', component: DeliveryComponent },
  { path: 'deliveryhistory', component: DeliveryhistoryComponent },
  { path: 'customerhistory', component: CustomerhistoryComponent, canActivate: [customerhistoryGuard] },
  { path: 'dailyexpenses', component: DailyexpensesComponent, canActivate: [expenseGuard] },
  { path: 'invoice', component: InvoiceComponent },
  { path: 'settings', component: SettingsComponent, canActivate: [settingsGuard] },
  {path: 'packing', component: PackingComponent},
  {path: 'business_setup', component: BusinessSetupComponent, canActivate: [businessSetupGuard]},
  {path: 'signup', component: SignupComponent},
  {path: 'orders', component: OrdersComponent},
  {path: 'create-workflow', component: WorkflowComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

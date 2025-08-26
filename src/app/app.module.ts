import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './component/login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HomeComponent } from './component/home/home.component';
import { HeaderComponent } from './component/header/header.component';
import { NeworderComponent } from './component/neworder/neworder.component';
import { SavepannelComponent } from './component/savepannel/savepannel.component';
import { WashingComponent } from './component/washing/washing.component';
import { IroningComponent } from './component/ironing/ironing.component';
import { DeliveryComponent } from './component/delivery/delivery.component';
import { DeliveryhistoryComponent } from './component/deliveryhistory/deliveryhistory.component';
import { CustomerhistoryComponent } from './component/customerhistory/customerhistory.component';
import { DailyexpensesComponent } from './component/dailyexpenses/dailyexpenses.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgxPaginationModule } from 'ngx-pagination';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { InvoiceComponent } from './component/invoice/invoice.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    HeaderComponent,
    NeworderComponent,
    SavepannelComponent,
    WashingComponent,
    IroningComponent,
    DeliveryComponent,
    DeliveryhistoryComponent,
    CustomerhistoryComponent,
    DailyexpensesComponent,
    InvoiceComponent
  ],
  imports: [
    NgxPaginationModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    HttpClientModule,
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

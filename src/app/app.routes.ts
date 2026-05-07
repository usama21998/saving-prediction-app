import { Routes } from '@angular/router';
import { FutureIncomeCalculator } from './future-income-calculator/future-income-calculator.component';

export const routes: Routes = [
  { path: '', redirectTo: '/future-income', pathMatch: 'full' },
  { path: 'future-income', component: FutureIncomeCalculator },
];

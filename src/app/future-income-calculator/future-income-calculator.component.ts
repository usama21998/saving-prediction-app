import { Component, OnInit, Inject, PLATFORM_ID, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface YearlyData {
  year: number;
  salary: number;
  monthlySaving: number;
  yearlyTotal: number;
}

interface CalculationResult {
  id?: number;
  currentSalary: number;
  monthlySaving: number;
  years: number;
  increment: number;
  totalSavings: number;
  savingsRate: number;
  yearlyBreakdown: YearlyData[];
  date: Date;
}

@Component({
  selector: 'future-income-calculator',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './future-income-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FutureIncomeCalculator implements OnInit {
  history = signal<CalculationResult[]>([]);
  isBrowser = signal<boolean>(false);
  latestResult = computed(() => this.history()[0] ?? null);
  calcForm: FormGroup;
  private db!: IDBDatabase;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser.set(isPlatformBrowser(this.platformId));
    this.calcForm = this.fb.group({
      currentSalary: [null, [Validators.required, Validators.min(1)]],
      monthlySaving: [null, [Validators.required, Validators.min(1)]],
      years: [null, [Validators.required, Validators.min(1), Validators.max(50)]],
      increment: [10, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    if (this.isBrowser()) this.initDB();
  }

  private initDB() {
    const request = indexedDB.open('SavingsSignalsDB', 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => { this.db = request.result; this.loadHistory(); };
  }

  calculate() {
    if (!this.isBrowser() || this.calcForm.invalid) return;

    const { currentSalary, monthlySaving, years, increment } = this.calcForm.value;
    const savingsRate = monthlySaving / currentSalary;

    const yearlyBreakdown: YearlyData[] = [];
    let totalSavings = 0;
    let runningSalary = currentSalary;
    const salaryIncFactor = 1 + (increment / 100);

    for (let i = 1; i <= years; i++) {
      const monthlySavingThisYear = runningSalary * savingsRate;
      const yearlyTotal = monthlySavingThisYear * 12;

      yearlyBreakdown.push({
        year: i,
        salary: Math.round(runningSalary),
        monthlySaving: Math.round(monthlySavingThisYear),
        yearlyTotal: Math.round(yearlyTotal)
      });

      totalSavings += yearlyTotal;
      runningSalary *= salaryIncFactor;
    }

    const result: CalculationResult = {
      currentSalary,
      monthlySaving,
      years,
      increment,
      savingsRate: savingsRate * 100,
      yearlyBreakdown,
      totalSavings: Math.round(totalSavings),
      date: new Date()
    };

    const transaction = this.db.transaction(['history'], 'readwrite');
    transaction.objectStore('history').add(result).onsuccess = () => {
      this.loadHistory();
      this.calcForm.patchValue({ currentSalary: null, monthlySaving: null });
    };
  }

  loadHistory() {
    const request = this.db.transaction(['history'], 'readonly').objectStore('history').getAll();
    request.onsuccess = () => {
      const results = (request.result as CalculationResult[]).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.history.set(results);
    };
  }

  deleteRecord(id: number) {
    this.db.transaction(['history'], 'readwrite').objectStore('history').delete(id).onsuccess = () => this.loadHistory();
  }
}

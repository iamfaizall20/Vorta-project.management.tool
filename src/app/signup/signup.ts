import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
})
export class Signup {
  year = new Date().getFullYear();
  fullNameValue = '';
  passwordValue = '';
  confirmValue = '';
  showPassword = false;
  showConfirm = false;
  loading = false;
  errorMsg = '';

  ruleLength = false;
  ruleUpper = false;
  ruleNumber = false;
  ruleSpecial = false;

  readonly passwordPattern = '^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,}$';

  features = [
    { icon: 'bolt', text: 'Lightning-fast task assignment' },
    { icon: 'group', text: 'Real-time team collaboration' },
    { icon: 'insights', text: 'Live project progress tracking' },
    { icon: 'lock', text: 'End-to-end privacy by default' },
  ];

  constructor(private router: Router, private http: HttpClient) {}

  get passwordsMatch(): boolean { return this.passwordValue === this.confirmValue; }
  get strengthScore(): number {
    let score = 0;
    if (this.ruleLength) score++;
    if (this.ruleUpper) score++;
    if (this.ruleNumber) score++;
    if (this.ruleSpecial) score++;
    return score;
  }
  get strengthPercent(): number { return (this.strengthScore / 4) * 100; }
  get strengthLabel(): string {
    switch (this.strengthScore) {
      case 0: case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'Weak';
    }
  }

  onPasswordInput(): void {
    const v = this.passwordValue;
    this.ruleLength = v.length >= 8;
    this.ruleUpper = /[A-Z]/.test(v);
    this.ruleNumber = /[0-9]/.test(v);
    this.ruleSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || !this.passwordsMatch) {
      form.form.markAllAsTouched();
      this.errorMsg = !this.passwordsMatch ? 'Passwords do not match.' : '';
      return;
    }

    if (!new RegExp(this.passwordPattern).test(this.passwordValue)) {
      this.errorMsg = 'Password does not meet the required rules.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const payload = {
      full_name: this.fullNameValue,
      username: form.value.username,
      email: form.value.email,
      password: this.passwordValue,
    };

    this.http.post('http://localhost/VortaAppApis/auth/signup.php', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.response) this.router.navigate(['/login']);
        else this.errorMsg = res.message || 'Signup failed. Try again.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = 'Server error. Please try again later.';
        console.error(err);
      }
    });
  }
}
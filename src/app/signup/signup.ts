// ============================================
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
})
export class Signup {
  year = new Date().getFullYear();

  // ── Form state ──────────────────────────────────────────────
  passwordValue = '';
  confirmValue = '';
  showPassword = false;
  showConfirm = false;
  loading = false;
  errorMsg = '';

  // ── Password rule flags ─────────────────────────────────────
  ruleLength = false;
  ruleUpper = false;
  ruleNumber = false;
  ruleSpecial = false;

  // Password must have ≥8 chars, 1 uppercase, 1 number, 1 special char
  readonly passwordPattern = '^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,}$';

  // ── Left panel features ─────────────────────────────────────
  features = [
    { icon: 'bolt', text: 'Lightning-fast task assignment' },
    { icon: 'group', text: 'Real-time team collaboration' },
    { icon: 'insights', text: 'Live project progress tracking' },
    { icon: 'lock', text: 'End-to-end privacy by default' },
  ];

  // ── Getters ─────────────────────────────────────────────────
  get passwordsMatch(): boolean {
    return this.passwordValue === this.confirmValue;
  }

  get strengthScore(): number {
    let score = 0;
    if (this.ruleLength) score++;
    if (this.ruleUpper) score++;
    if (this.ruleNumber) score++;
    if (this.ruleSpecial) score++;
    return score;
  }

  get strengthPercent(): number {
    return (this.strengthScore / 4) * 100;
  }

  get strengthLabel(): string {
    switch (this.strengthScore) {
      case 0:
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'Weak';
    }
  }

  // ── Methods ─────────────────────────────────────────────────
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
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    // Simulate API call — replace with real AuthService call later
    setTimeout(() => {
      // Mock: save user to localStorage
      const user = {
        id: Date.now().toString(),
        username: form.value.username,
        email: form.value.email,
        role: 'Member',
        joinedAt: new Date().toISOString(),
        theme: 'dark',
      };
      localStorage.setItem('tf_user', JSON.stringify(user));
      localStorage.setItem('tf_token', 'mock-token-' + user.id);

      this.loading = false;
      this.router.navigate(['/app/dashboard']);
    }, 1800);
  }

  constructor(private router: Router) { }
}
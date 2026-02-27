// ======================================
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  year = new Date().getFullYear();

  showPassword = false;
  loading = false;
  errorMsg = '';

  constructor(private router: Router) { }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    // Simulate API call — replace with AuthService.login() later
    setTimeout(() => {
      const { username, password } = form.value;

      // Mock validation against localStorage user
      const stored = localStorage.getItem('tf_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.username === username) {
          // In real app: validate hashed password via API
          localStorage.setItem('tf_token', 'mock-token-' + user.id);
          this.loading = false;
          this.router.navigate(['/app/dashboard']);
          return;
        }
      }

      // Fallback: demo credentials
      if (username === 'demo' && password === 'Demo@1234') {
        const demoUser = {
          id: 'demo-001',
          username: 'demo',
          email: 'demo@taskflow.app',
          role: 'Manager',
          joinedAt: new Date().toISOString(),
          theme: 'dark',
        };
        localStorage.setItem('tf_user', JSON.stringify(demoUser));
        localStorage.setItem('tf_token', 'mock-token-demo-001');
        this.loading = false;
        this.router.navigate(['dashboard']);
        return;
      }

      // Credentials not found
      this.loading = false;
      this.errorMsg = 'Invalid username or password. Try demo / Demo@1234.';
    }, 1600);
  }
}
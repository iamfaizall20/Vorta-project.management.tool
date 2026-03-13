import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  year = new Date().getFullYear();
  showPassword = false;
  loading = false;
  errorMsg = '';

  constructor(private router: Router, private http: HttpClient) { }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const payload = {
      organization_id: form.value.organizationId,
      user_id: form.value.userId,
      password: form.value.password,
    };

    // Backend login API
    this.http.post('http://localhost/VortaAppApis/auth/login.php', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.response) {
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('organization_id', res.organization_id);
          this.router.navigate(['/app/dashboard']);
        } else {
          this.errorMsg = res.message || 'Invalid credentials. Please check your Organization ID, User ID, and password.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = 'Server error. Please try again later.';
        console.error(err);
      }
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

interface Role {
  value: string;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-new-member',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './member.html',
  styleUrls: ['./member.css']
})
export class Member implements OnInit {
  memberForm!: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showSuccessModal = false;
  showErrorModal = false;
  successMessage = '';
  errorMessage = '';
  generatedUserId: number = 0; // Store generated user ID

  roles: Role[] = [
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Full access to all features and settings',
      icon: 'admin_panel_settings'
    },
    {
      value: 'manager',
      label: 'Manager',
      description: 'Can manage projects, teams, and members',
      icon: 'manage_accounts'
    },
    {
      value: 'member',
      label: 'Team Member',
      description: 'Standard access to assigned projects',
      icon: 'person'
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'Read-only access to projects',
      icon: 'visibility'
    }
  ];

  private apiUrl = 'http://localhost/VortaAppApis/users/create.php';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.memberForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['member', Validators.required]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  selectRole(role: string): void {
    this.memberForm.patchValue({ role });
  }

  getPasswordStrength(): string {
    const password = this.memberForm.get('password')?.value || '';

    if (!password) return '';

    let strength = 0;

    // Length check
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;

    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength === 'weak') return 'Weak';
    if (strength === 'medium') return 'Medium';
    if (strength === 'strong') return 'Strong';
    return '';
  }

  generateUserId(): number {
    // Generate a random user ID between 10000 and 99999
    return Math.floor(Math.random() * 90000) + 10000;
  }

  getOrganizationId(): string | null {
    return localStorage.getItem('organization_id');
  }

  onSubmit(): void {
    if (this.memberForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.memberForm.controls).forEach(key => {
        this.memberForm.get(key)?.markAsTouched();
      });
      return;
    }

    const organizationId = this.getOrganizationId();

    if (!organizationId) {
      this.errorMessage = 'Organization ID not found. Please login again.';
      this.showErrorModal = true;
      return;
    }

    this.isSubmitting = true;

    // Generate and store user ID
    this.generatedUserId = this.generateUserId();

    const requestData = {
      user_id: this.generatedUserId,
      organization_id: organizationId,
      full_name: this.memberForm.value.full_name,
      email: this.memberForm.value.email,
      username: this.memberForm.value.username,
      password: this.memberForm.value.password,
      role: this.memberForm.value.role
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post(this.apiUrl, requestData, { headers })
      .subscribe({
        next: (response: any) => {
          this.isSubmitting = false;

          // Check if the API response indicates success
          if (response.success || response.status === 'success' || response.message) {
            this.successMessage = `${this.memberForm.value.full_name} has been successfully added to your organization!`;
            this.showSuccessModal = true;

            setTimeout(() => {
              this.goToDashboard();
            }, 6000);
            // this.memberForm.reset({ role: 'member' });
          } else {
            this.errorMessage = response.message || 'Failed to create member. Please try again.';
            this.showErrorModal = true;
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error creating member:', error);

          // Handle specific error messages
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to the server. Please check your connection.';
          } else if (error.status === 409) {
            this.errorMessage = 'A user with this email or username already exists.';
          } else if (error.status === 400) {
            this.errorMessage = 'Invalid data provided. Please check all fields.';
          } else if (error.status === 500) {
            this.errorMessage = 'Server error. Please try again later.';
          } else {
            this.errorMessage = 'An unexpected error occurred. Please try again.';
          }

          this.showErrorModal = true;
        }
      });
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
  }

  goToDashboard(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/app/dashboard']);
  }

  onCancel(): void {
    if (this.memberForm.dirty) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (confirmed) {
        this.router.navigate(['/app/dashboard']);
      }
    } else {
      this.router.navigate(['/app/dashboard']);
    }
  }

  goBack(): void {
    if (this.memberForm.dirty) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to go back?');
      if (confirmed) {
        this.router.navigate(['/app/dashboard']);
      }
    } else {
      this.router.navigate(['/app/dashboard']);
    }
  }

  getInitials(): string {
    const fullName = this.memberForm.get('full_name')?.value || '';
    if (!fullName) return '?';

    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getRoleLabel(): string {
    const roleValue = this.memberForm.get('role')?.value;
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.label : 'Not set';
  }

  getRoleIcon(): string {
    const roleValue = this.memberForm.get('role')?.value;
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.icon : 'person';
  }
}
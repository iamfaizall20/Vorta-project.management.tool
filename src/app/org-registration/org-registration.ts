import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface OrgData {
  name: string;
  industry: string;
  size: string;
  country: string;
  email: string;
  phone: string;
}

interface AdminData {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-org-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './org-registration.html',
  styleUrls: ['./org-registration.css'],
})
export class OrgRegistrationComponent {
  currentStep = 1;
  totalSteps = 3;
  year = new Date().getFullYear();
  loading = false;
  errorMsg = '';
  successMsg = '';
  generatedOrgId = '';

  // Organization data
  orgData: OrgData = {
    name: '',
    industry: '',
    size: '',
    country: '',
    email: '',
    phone: '',
  };

  // Admin data
  adminData: AdminData = {
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  };

  // Password visibility
  showPassword = false;
  showConfirmPassword = false;

  // Password validation rules
  ruleLength = false;
  ruleUpper = false;
  ruleNumber = false;
  ruleSpecial = false;

  readonly passwordPattern = '^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,}$';

  industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Other'
  ];

  companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
  ];

  features = [
    { icon: 'business', text: 'Dedicated organization workspace' },
    { icon: 'admin_panel_settings', text: 'Full admin control panel' },
    { icon: 'group_add', text: 'Add unlimited team members' },
    { icon: 'security', text: 'Enterprise-grade security' },
  ];

  constructor(public router: Router, private http: HttpClient) { }

  get progressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  get passwordsMatch(): boolean {
    return this.adminData.password === this.adminData.confirmPassword;
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
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Weak';
    }
  }

  onPasswordInput(): void {
    const v = this.adminData.password;
    this.ruleLength = v.length >= 8;
    this.ruleUpper = /[A-Z]/.test(v);
    this.ruleNumber = /[0-9]/.test(v);
    this.ruleSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
  }

  canProceedStep1(): boolean {
    return !!(
      this.orgData.name &&
      this.orgData.industry &&
      this.orgData.size &&
      this.orgData.country &&
      this.orgData.email &&
      this.orgData.phone
    );
  }

  canProceedStep2(): boolean {
    return !!(
      this.adminData.fullName &&
      this.adminData.email &&
      this.adminData.username &&
      this.adminData.password &&
      this.adminData.confirmPassword &&
      this.passwordsMatch &&
      new RegExp(this.passwordPattern).test(this.adminData.password)
    );
  }

  nextStep(): void {
    this.errorMsg = '';

    if (this.currentStep === 1 && !this.canProceedStep1()) {
      this.errorMsg = 'Please fill in all organization details.';
      return;
    }

    if (this.currentStep === 2 && !this.canProceedStep2()) {
      if (!this.passwordsMatch) {
        this.errorMsg = 'Passwords do not match.';
      } else if (!new RegExp(this.passwordPattern).test(this.adminData.password)) {
        this.errorMsg = 'Password does not meet the required rules.';
      } else {
        this.errorMsg = 'Please fill in all admin details correctly.';
      }
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    this.errorMsg = '';
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (!this.canProceedStep1() || !this.canProceedStep2()) {
      this.errorMsg = 'Please complete all required fields.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const payload = {
      organization: this.orgData,
      admin: {
        full_name: this.adminData.fullName,
        email: this.adminData.email,
        username: this.adminData.username,
        password: this.adminData.password,
      },
    };

    this.http
      .post('http://localhost/VortaAppApis/auth/register-organization.php', payload)
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.response) {
            this.successMsg = 'Organization registered successfully!';
            this.generatedOrgId = res.organization_id || 'ORG-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            // Optional: redirect after a delay
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 5000);
          } else {
            this.errorMsg = res.message || 'Registration failed. Please try again.';
          }
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = 'Server error. Please try again later.';
          console.error(err);
        },
      });
  }
}
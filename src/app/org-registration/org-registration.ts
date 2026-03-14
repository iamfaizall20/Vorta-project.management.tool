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
  generatedUserId = 0;

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

      // Generate IDs when moving to step 3 (review/confirmation)
      if (this.currentStep === 3 && !this.generatedOrgId) {
        this.generatedOrgId = this.generateOrgId();
        this.generatedUserId = this.generateUserId();
      }
    }
  }

  prevStep(): void {
    this.errorMsg = '';
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Generate Organization ID in format: ORG-ABC123
   * Combines random uppercase letters and numbers
   */
  private generateOrgId(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let orgId = 'ORG-';

    // Generate 3 random letters
    for (let i = 0; i < 3; i++) {
      orgId += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Generate 3 random numbers
    for (let i = 0; i < 3; i++) {
      orgId += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return orgId;
  }

  /**
   * Generate User ID as a random integer between 100000 and 999999
   */
  private generateUserId(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  onSubmit(): void {
    if (!this.canProceedStep1() || !this.canProceedStep2()) {
      this.errorMsg = 'Please complete all required fields.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    // Use the IDs that were already generated when user reached step 3
    // If somehow they're not generated, generate them now
    if (!this.generatedOrgId) {
      this.generatedOrgId = this.generateOrgId();
    }
    if (!this.generatedUserId) {
      this.generatedUserId = this.generateUserId();
    }

    const payload = {
      organization: {
        ...this.orgData,
        organization_id: this.generatedOrgId
      },
      admin: {
        user_id: this.generatedUserId,
        full_name: this.adminData.fullName,
        email: this.adminData.email,
        username: this.adminData.username,
        password: this.adminData.password,
      },
    };

    this.http
      .post('http://localhost/VortaAppApis/auth/org-registration.php', payload)
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.response) {
            this.successMsg = 'Organization registered successfully!';

            // Use server-provided IDs if available, otherwise keep the locally generated ones
            if (res.organization_id) {
              this.generatedOrgId = res.organization_id;
            }
            if (res.user_id) {
              this.generatedUserId = res.user_id;
            }

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
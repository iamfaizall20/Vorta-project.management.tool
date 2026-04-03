import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  bio: string;
  timezone: string;
  language: string;
  color: string;
  role: string;
  joinedDate: string;
  projectCount: number;
  taskCount: number;
  teamCount: number;
  initials?: string;
  name?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {

  constructor(private http: HttpClient, private router: Router) { }

  // ── Profile data ───────────────────────────────────────────
  profile: UserProfile = {
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    bio: '',
    timezone: '',
    language: '',
    color: '#5B5BD6',
    role: '',
    joinedDate: '',
    projectCount: 0,
    taskCount: 0,
    teamCount: 0
  };

  // ── UI state ───────────────────────────────────────────────
  activeSection: 'personal' | 'password' | 'notifications' | null = 'personal';
  isDirty = false;
  saving = false;
  saveSuccess = false;
  saveError = false;
  saveErrorMessage = '';
  showColorPicker = false;

  // ── Password fields ────────────────────────────────────────
  passwords = { current: '', new: '', confirm: '' };
  showCurrentPwd = false;
  showNewPwd = false;
  showConfirmPwd = false;
  pwdStrength = { pct: 0, label: '', color: '' };

  // ── Password UI state (separate from profile save) ─────────
  pwdSaving = false;
  pwdSuccess = false;
  pwdError = false;
  pwdErrorMessage = '';
  showLogoutModal = false;

  // ── Colour palette ─────────────────────────────────────────
  colorOptions = [
    '#5B5BD6', '#E54D2E', '#30A46C', '#F59E0B',
    '#EC4899', '#7C7CE8', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F97316',
  ];

  // ── Notification preferences ───────────────────────────────
  notifPrefs = [
    { label: 'Task assigned to me', desc: 'When someone assigns you a task', enabled: true },
    { label: 'Task status changed', desc: 'When a task you own changes status', enabled: true },
    { label: 'Project updates', desc: 'When a project you\'re on is updated', enabled: false },
    { label: 'New team member', desc: 'When someone joins a team you\'re in', enabled: true },
    { label: 'Mentions & comments', desc: 'When someone @mentions you', enabled: true },
    { label: 'Weekly digest', desc: 'A weekly summary of your workspace activity', enabled: false },
  ];

  // ── Snapshot for dirty tracking ────────────────────────────
  private originalSnapshot = '';

  ngOnInit(): void {
    this.loadProfile();
    this.originalSnapshot = this.getSnapshot();
  }

  // ── Load profile from API ──────────────────────────────────
  loadProfile(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.user_id) return;

    const payload = { user_id: user.user_id };
    this.http.post<any>('http://localhost/VortaAppApis/profile/get.php', payload)
      .pipe(
        catchError(err => {
          console.error('Profile API error', err);
          return of(null);
        })
      )
      .subscribe(res => {
        if (res?.status === 'success' && res.data?.user) {
          const u = res.data.user;
          const names = u.fullName.trim().split(/\s+/);
          const firstName = names.shift() || '';
          const lastName = names.join(' ') || '';
          Object.assign(this.profile, {
            firstName,
            lastName,
            email: u.email || '',
            jobTitle: u.jobTitle || '',
            bio: u.bio || '',
            role: u.role || '',
            joinedDate: new Date(u.joinedDate).toLocaleDateString(),
            projectCount: u.projectCount || 0,
            taskCount: u.taskCount || 0,
            teamCount: u.teamCount || 0,
            initials: (firstName[0] + (lastName[0] || '')).toUpperCase(),
            name: `${firstName} ${lastName}`.trim()
          });
          this.originalSnapshot = this.getSnapshot();
        }
      });
  }

  // ── Computed gradient background ──────────────────────────
  get meshGradient(): string {
    const c = this.profile.color;
    return `radial-gradient(ellipse at 20% 50%, ${c}22 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, ${c}15 0%, transparent 50%),
            linear-gradient(135deg, #FAFAF8 0%, #F4F4F5 100%)`;
  }

  // ── Section accordion ──────────────────────────────────────
  toggleSection(s: typeof this.activeSection): void {
    this.activeSection = this.activeSection === s ? null : s;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.color-picker-wrap')) {
      this.showColorPicker = false;
    }
  }

  // ── Dirty tracking ─────────────────────────────────────────
  onFieldChange(): void {
    this.isDirty = this.getSnapshot() !== this.originalSnapshot;
  }

  getSnapshot(): string {
    return JSON.stringify({
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      email: this.profile.email,
      jobTitle: this.profile.jobTitle,
      bio: this.profile.bio,
      timezone: this.profile.timezone,
      language: this.profile.language,
      color: this.profile.color,
      notifs: this.notifPrefs.map(n => n.enabled),
    });
  }

  // ── Save profile ───────────────────────────────────────────
  onSave(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.user_id) return;

    this.saving = true;
    this.saveError = false;
    this.saveErrorMessage = '';

    const payload = {
      user_id: user.user_id,
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      bio: this.profile.bio,
    };

    this.http.post<any>('http://localhost/VortaAppApis/profile/update-user.php', payload)
      .pipe(
        catchError(err => {
          console.error('Update profile error', err);
          return of(null);
        })
      )
      .subscribe(res => {
        this.saving = false;

        if (res?.status === 'success') {
          const fullName: string = res.data?.full_name || `${this.profile.firstName} ${this.profile.lastName}`.trim();
          const names = fullName.trim().split(/\s+/);
          const firstName = names.shift() || '';
          const lastName = names.join(' ') || '';

          this.profile.firstName = firstName;
          this.profile.lastName = lastName;
          this.profile.bio = res.data?.bio ?? this.profile.bio;
          this.profile.name = fullName;
          this.profile.initials = (firstName[0] + (lastName[0] || '')).toUpperCase();

          this.originalSnapshot = this.getSnapshot();
          this.isDirty = false;
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        } else {
          this.saveError = true;
          this.saveErrorMessage = res?.message || 'Failed to update profile. Please try again.';
          setTimeout(() => this.saveError = false, 4000);
        }
      });
  }

  onCancel(): void {
    this.loadProfile();
    this.isDirty = false;
  }

  // ── Password strength ──────────────────────────────────────
  checkPwdStrength(): void {
    const p = this.passwords.new;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    const map = [
      { pct: 20, label: 'Very weak', color: '#EF4444' },
      { pct: 40, label: 'Weak', color: '#F97316' },
      { pct: 65, label: 'Fair', color: '#F59E0B' },
      { pct: 85, label: 'Strong', color: '#30A46C' },
      { pct: 100, label: 'Very strong', color: '#059669' },
    ];
    this.pwdStrength = map[Math.min(score, 4)];
  }
  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  logout(): void {
    // Clear user session
    localStorage.removeItem('user');

    // Close modal
    this.showLogoutModal = false;

    // Redirect to login page
    this.router.navigate(['/login']);
  }
  // ── Update password (separate button) ─────────────────────
  onChangePassword(): void {
    if (
      !this.passwords.current ||
      !this.passwords.new ||
      this.passwords.new !== this.passwords.confirm
    ) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.user_id) return;

    this.pwdSaving = true;
    this.pwdError = false;
    this.pwdErrorMessage = '';
    this.pwdSuccess = false;

    const payload = {
      user_id: user.user_id,
      current_password: this.passwords.current,
      new_password: this.passwords.new,
    };

    this.http.post<any>('http://localhost/VortaAppApis/profile/update-password.php', payload)
      .pipe(
        catchError(err => {
          console.error('Update password error', err);
          return of(null);
        })
      )
      .subscribe(res => {
        this.pwdSaving = false;

        if (res?.status === 'success') {
          // Clear all password fields
          this.passwords = { current: '', new: '', confirm: '' };
          this.pwdStrength = { pct: 0, label: '', color: '' };
          this.pwdSuccess = true;
          setTimeout(() => this.pwdSuccess = false, 3000);
        } else {
          this.pwdError = true;
          // Shows "Current password is incorrect" or any other API message
          this.pwdErrorMessage = res?.message || 'Failed to update password. Please try again.';
          setTimeout(() => this.pwdError = false, 4000);
        }
      });
  }
}
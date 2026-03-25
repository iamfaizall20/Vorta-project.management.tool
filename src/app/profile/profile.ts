import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  constructor(private http: HttpClient) { }

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
  showColorPicker = false;

  // ── Password fields ────────────────────────────────────────
  passwords = { current: '', new: '', confirm: '' };
  showCurrentPwd = false;
  showNewPwd = false;
  showConfirmPwd = false;
  pwdStrength = { pct: 0, label: '', color: '' };

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
          // Split fullName safely
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

  // ── Save ───────────────────────────────────────────────────
  onSave(): void {
    this.saving = true;
    setTimeout(() => {
      const toSave = {
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        email: this.profile.email,
        jobTitle: this.profile.jobTitle,
        bio: this.profile.bio,
        timezone: this.profile.timezone,
        language: this.profile.language,
        color: this.profile.color,
      };
      localStorage.setItem('vorta_profile', JSON.stringify(toSave));
      this.originalSnapshot = this.getSnapshot();
      this.isDirty = false;
      this.saving = false;
      this.saveSuccess = true;
      setTimeout(() => this.saveSuccess = false, 3000);
    }, 800);
  }

  onCancel(): void {
    this.loadProfile();
    this.isDirty = false;
  }

  // ── Password ───────────────────────────────────────────────
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

  onChangePassword(): void {
    if (!this.passwords.current || !this.passwords.new || this.passwords.new !== this.passwords.confirm) return;
    // Simulate API call
    setTimeout(() => {
      this.passwords = { current: '', new: '', confirm: '' };
      this.pwdStrength = { pct: 0, label: '', color: '' };
      alert('Password updated!');
    }, 600);
  }
}
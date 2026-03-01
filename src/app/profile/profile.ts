import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  get name(): string;
  get initials(): string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {

  // ── Profile data ───────────────────────────────────────────
  profile = {
    firstName: 'Faizal',
    lastName: 'Hassan',
    email: 'faizal@vorta.io',
    jobTitle: 'Engineering Manager',
    bio: 'Building Vorta — a modern project management tool for fast-moving teams.',
    timezone: 'PKT',
    language: 'en',
    color: '#5B5BD6',
    role: 'Manager',
    joinedDate: 'Jan 2024',
    projectCount: 5,
    taskCount: 12,
    teamCount: 3,
    get name() { return `${this.firstName} ${this.lastName}`.trim(); },
    get initials() {
      return [this.firstName, this.lastName]
        .filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    },
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

  // ── Recent activity feed ───────────────────────────────────
  recentActivity = [
    { icon: 'task_alt', iconBg: 'rgba(48,164,108,.1)', iconColor: '#30A46C', text: 'Completed "Design auth endpoints"', time: '2h ago' },
    { icon: 'folder_open', iconBg: 'rgba(91,91,214,.1)', iconColor: '#5B5BD6', text: 'Created project "Backend API v2"', time: '1d ago' },
    { icon: 'group_add', iconBg: 'rgba(236,72,153,.1)', iconColor: '#EC4899', text: 'Joined team "Backend Squad"', time: '3d ago' },
    { icon: 'edit', iconBg: 'rgba(245,158,11,.1)', iconColor: '#F59E0B', text: 'Updated task "Implement rate limiting"', time: '4d ago' },
    { icon: 'person_add', iconBg: 'rgba(14,165,233,.1)', iconColor: '#0EA5E9', text: 'Invited Nadia Hussain to workspace', time: '1w ago' },
  ];

  // ── Snapshot for dirty tracking ────────────────────────────
  private originalSnapshot = '';

  ngOnInit(): void {
    this.loadProfile();
    this.originalSnapshot = this.getSnapshot();
  }

  loadProfile(): void {
    const saved = localStorage.getItem('vorta_profile');
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(this.profile, data);
    }
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

  // ── Colour picker ──────────────────────────────────────────
  setColor(c: string): void {
    this.profile.color = c;
    this.showColorPicker = false;
    this.onFieldChange();
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
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class Settings implements OnInit {

  // ── Active tab ─────────────────────────────────────────────
  activeTab: 'general' | 'appearance' | 'notifications' | 'security' | 'danger' = 'general';

  // ── UI state ───────────────────────────────────────────────
  isDirty = false;
  saving = false;
  saveSuccess = false;

  // ── Nav tabs ───────────────────────────────────────────────
  tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'security', label: 'Security', icon: 'security' },
    { id: 'danger', label: 'Danger Zone', icon: 'warning' },
  ] as const;

  // ── Settings object ────────────────────────────────────────
  settings = {
    workspaceName: 'Vorta HQ',
    workspaceSlug: 'vorta-hq',
    workspaceDesc: 'Building the future of project management.',
    industry: 'tech',
    companySize: '1-10',
    theme: 'light',
    accentColor: '#5B5BD6',
    density: 'comfortable',
    sessionTimeout: '8h',
  };

  // ── Themes ─────────────────────────────────────────────────
  themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  // ── Accent colours ─────────────────────────────────────────
  accentColors = [
    { name: 'Indigo', color: '#5B5BD6' },
    { name: 'Crimson', color: '#E54D2E' },
    { name: 'Green', color: '#30A46C' },
    { name: 'Amber', color: '#F59E0B' },
    { name: 'Pink', color: '#EC4899' },
    { name: 'Violet', color: '#8B5CF6' },
    { name: 'Sky', color: '#0EA5E9' },
    { name: 'Teal', color: '#14B8A6' },
  ];

  // ── Density options ────────────────────────────────────────
  densityOptions = [
    { value: 'compact', label: 'Compact', icon: 'density_small' },
    { value: 'comfortable', label: 'Comfortable', icon: 'density_medium' },
    { value: 'spacious', label: 'Spacious', icon: 'density_large' },
  ];

  // ── General toggles ────────────────────────────────────────
  generalToggles = [
    { label: 'Allow public project view', desc: 'Share project links without login', enabled: false },
    { label: 'Auto-assign tasks', desc: 'Automatically assign created tasks to you', enabled: true },
    { label: 'Show completed tasks', desc: 'Display done tasks in the kanban board', enabled: true },
    { label: 'Enable guest access', desc: 'Allow external collaborators with a link', enabled: false },
  ];

  // ── Notification groups ────────────────────────────────────
  notifGroups = [
    {
      title: 'In-App Notifications',
      items: [
        { label: 'Task assigned to me', desc: 'When a task is assigned to you', enabled: true },
        { label: 'Task status changed', desc: 'When a task you own changes status', enabled: true },
        { label: 'Project updates', desc: 'Changes to projects you\'re part of', enabled: true },
        { label: 'New team member', desc: 'When someone joins your teams', enabled: false },
      ],
    },
    {
      title: 'Email Notifications',
      items: [
        { label: 'Daily digest', desc: 'Summary of activity every morning', enabled: true },
        { label: 'Weekly report', desc: 'Full workspace report every Monday', enabled: false },
        { label: 'Overdue task alerts', desc: 'Reminder when tasks are past due', enabled: true },
        { label: 'Workspace invitations', desc: 'When you invite someone and they accept', enabled: true },
      ],
    },
  ];

  // ── Security toggles ───────────────────────────────────────
  securityToggles = [
    { label: 'Two-factor authentication', desc: 'Require 2FA for all workspace members', enabled: false },
    { label: 'Single sign-on (SSO)', desc: 'Allow login via your identity provider', enabled: false },
    { label: 'Audit log', desc: 'Track all actions taken in the workspace', enabled: true },
    { label: 'IP allowlist', desc: 'Restrict access to specific IP ranges', enabled: false },
  ];

  // ── Login methods ──────────────────────────────────────────
  loginMethods = [
    { label: 'Email & Password', enabled: true },
    { label: 'Google OAuth', enabled: true },
    { label: 'GitHub OAuth', enabled: false },
    { label: 'Microsoft SSO', enabled: false },
  ];

  // ── Active sessions ────────────────────────────────────────
  activeSessions = [
    { icon: 'computer', device: 'Chrome on Windows 11', location: 'Karachi, PK', lastSeen: 'Active now', isCurrent: true },
    { icon: 'smartphone', device: 'Safari on iPhone 15', location: 'Karachi, PK', lastSeen: '2h ago', isCurrent: false },
    { icon: 'laptop_mac', device: 'Firefox on MacBook Pro', location: 'Lahore, PK', lastSeen: '3d ago', isCurrent: false },
  ];

  // ── Danger actions ─────────────────────────────────────────
  dangerActions = [
    {
      icon: 'person_off',
      title: 'Leave Workspace',
      desc: 'You will lose access to all projects, teams and data in this workspace.',
      action: 'Leave Workspace',
      type: 'leave',
    },
    {
      icon: 'archive',
      title: 'Archive Workspace',
      desc: 'Pause all activity. The workspace can be restored later by an admin.',
      action: 'Archive',
      type: 'archive',
    },
    {
      icon: 'delete_forever',
      title: 'Delete Workspace',
      desc: 'Permanently delete the workspace and all its data. This cannot be undone.',
      action: 'Delete Workspace',
      type: 'delete',
    },
  ];

  // ── Snapshot ───────────────────────────────────────────────
  private originalSnapshot = '';

  ngOnInit(): void {
    this.loadSettings();
    this.originalSnapshot = JSON.stringify(this.settings);
  }

  loadSettings(): void {
    const saved = localStorage.getItem('vorta_settings');
    if (saved) Object.assign(this.settings, JSON.parse(saved));
  }

  onFieldChange(): void {
    this.isDirty = JSON.stringify(this.settings) !== this.originalSnapshot;
  }

  onSave(): void {
    this.saving = true;
    setTimeout(() => {
      localStorage.setItem('vorta_settings', JSON.stringify(this.settings));
      this.originalSnapshot = JSON.stringify(this.settings);
      this.isDirty = false;
      this.saving = false;
      this.saveSuccess = true;
      setTimeout(() => this.saveSuccess = false, 3000);
    }, 800);
  }

  onCancel(): void {
    this.loadSettings();
    this.isDirty = false;
  }

  revokeSession(session: any): void {
    this.activeSessions = this.activeSessions.filter(s => s !== session);
  }

  onDangerAction(action: any): void {
    const messages: Record<string, string> = {
      leave: `Are you sure you want to leave "${this.settings.workspaceName}"?`,
      archive: `Archive "${this.settings.workspaceName}"? It can be restored later.`,
      delete: `PERMANENTLY delete "${this.settings.workspaceName}"? This CANNOT be undone.`,
    };
    if (confirm(messages[action.type] ?? 'Are you sure?')) {
      if (action.type === 'delete') {
        localStorage.clear();
        alert('Workspace deleted. Redirecting…');
        window.location.href = '/';
      } else {
        alert(`Action "${action.title}" would proceed in production.`);
      }
    }
  }
}
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface WorkspaceMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  color: string;
  role: 'Manager' | 'Member' | 'Viewer';
  status: 'online' | 'away' | 'offline';
  teams: string[];
  projectCount: number;
  taskCount: number;
  joinedDate: string;
}

interface AvailableTeam {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
}

interface AssignedTask {
  id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TitleCasePipe],
  templateUrl: './members.html',
  styleUrls: ['./members.css'],
})
export class Members implements OnInit {

  // ── State ──────────────────────────────────────────────────
  members: WorkspaceMember[] = [];
  searchQuery = '';
  searchFocused = false;
  activeRole = 'all';
  viewMode: 'grid' | 'list' = 'grid';
  selectedMember: WorkspaceMember | null = null;
  showInvite = false;
  inviting = false;
  inviteSuccess = false;
  lastInvitedName = '';
  memberToRemove: WorkspaceMember | null = null;
  currentUserId = 'u1'; // Logged-in user

  // ── Filters ────────────────────────────────────────────────
  roleFilters = [
    { label: 'All', value: 'all' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Member', value: 'Member' },
    { label: 'Viewer', value: 'Viewer' },
  ];

  // ── Color palette ──────────────────────────────────────────
  colorOptions = [
    '#5B5BD6', '#E54D2E', '#30A46C', '#F59E0B',
    '#EC4899', '#7C7CE8', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F97316',
  ];

  // ── Available teams for invite assignment ──────────────────
  availableTeams: AvailableTeam[] = [
    { id: 'tm1', name: 'Backend Squad', type: 'Engineering', icon: 'code', color: '#5B5BD6' },
    { id: 'tm2', name: 'Design Team', type: 'Design', icon: 'palette', color: '#EC4899' },
    { id: 'tm3', name: 'Mobile Team', type: 'Engineering', icon: 'smartphone', color: '#E54D2E' },
    { id: 'tm4', name: 'Product & QA', type: 'Product', icon: 'inventory_2', color: '#30A46C' },
  ];

  // ── Invite draft ───────────────────────────────────────────
  inviteDraft = {
    name: '',
    email: '',
    role: 'Member' as 'Member' | 'Manager' | 'Viewer',
    color: '#5B5BD6',
    teamIds: [] as string[],
  };

  ngOnInit(): void {
    this.loadMembers();
  }

  // ── Load members ───────────────────────────────────────────
  loadMembers(): void {
    const stored = JSON.parse(localStorage.getItem('vorta_members') || '[]') as WorkspaceMember[];
    if (stored.length === 0) {
      this.members = this.getMockMembers();
      localStorage.setItem('vorta_members', JSON.stringify(this.members));
    } else {
      this.members = stored;
    }
  }

  getMockMembers(): WorkspaceMember[] {
    return [
      {
        id: 'u1', name: 'Faizal Hassan', initials: 'FH', email: 'faizal@vorta.io',
        color: '#5B5BD6', role: 'Manager', status: 'online',
        teams: ['Backend Squad', 'Product & QA'],
        projectCount: 5, taskCount: 12, joinedDate: 'Jan 2024',
      },
      {
        id: 'u2', name: 'Ali Raza', initials: 'AR', email: 'ali@vorta.io',
        color: '#E54D2E', role: 'Member', status: 'online',
        teams: ['Backend Squad'],
        projectCount: 3, taskCount: 8, joinedDate: 'Feb 2024',
      },
      {
        id: 'u3', name: 'Sara Zeb', initials: 'SZ', email: 'sara@vorta.io',
        color: '#30A46C', role: 'Member', status: 'away',
        teams: ['Backend Squad', 'Design Team'],
        projectCount: 4, taskCount: 10, joinedDate: 'Feb 2024',
      },
      {
        id: 'u4', name: 'Omar Farooq', initials: 'OF', email: 'omar@vorta.io',
        color: '#F59E0B', role: 'Member', status: 'offline',
        teams: ['Mobile Team', 'Product & QA'],
        projectCount: 2, taskCount: 5, joinedDate: 'Mar 2024',
      },
      {
        id: 'u5', name: 'Aisha Malik', initials: 'AM', email: 'aisha@vorta.io',
        color: '#EC4899', role: 'Member', status: 'online',
        teams: ['Design Team', 'Product & QA'],
        projectCount: 3, taskCount: 7, joinedDate: 'Mar 2024',
      },
      {
        id: 'u6', name: 'Bilal Khan', initials: 'BK', email: 'bilal@vorta.io',
        color: '#7C7CE8', role: 'Member', status: 'away',
        teams: ['Mobile Team'],
        projectCount: 2, taskCount: 4, joinedDate: 'Apr 2024',
      },
      {
        id: 'u7', name: 'Nadia Hussain', initials: 'NH', email: 'nadia@vorta.io',
        color: '#0EA5E9', role: 'Viewer', status: 'offline',
        teams: ['Mobile Team', 'Product & QA'],
        projectCount: 1, taskCount: 3, joinedDate: 'May 2024',
      },
    ];
  }

  // ── Computed ───────────────────────────────────────────────
  get filteredMembers(): WorkspaceMember[] {
    let list = [...this.members];

    if (this.activeRole !== 'all') {
      list = list.filter(m => m.role === this.activeRole);
    }

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.teams.some(t => t.toLowerCase().includes(q))
      );
    }

    return list;
  }

  getCountByRole(role: string): number {
    if (role === 'all') return this.members.length;
    return this.members.filter(m => m.role === role).length;
  }

  // ── Assigned tasks (reads from localStorage projects) ──────
  getAssignedTasks(memberId: string): AssignedTask[] {
    const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    const tasks: AssignedTask[] = [];
    for (const p of projects) {
      for (const t of (p.tasks || [])) {
        if (t.assignee?.id === memberId) {
          tasks.push({ id: t.id, title: t.title, status: t.status, priority: t.priority });
        }
      }
    }
    return tasks.slice(0, 6);
  }

  // ── Member detail ──────────────────────────────────────────
  openMemberDetail(m: WorkspaceMember): void {
    this.selectedMember = m;
    this.showInvite = false;
  }

  // ── Invite ─────────────────────────────────────────────────
  openInvite(): void {
    this.inviteDraft = { name: '', email: '', role: 'Member', color: '#5B5BD6', teamIds: [] };
    this.inviteSuccess = false;
    this.showInvite = true;
    this.selectedMember = null;
  }

  closeInvite(): void {
    this.showInvite = false;
    this.inviteSuccess = false;
  }

  isTeamSelected(t: AvailableTeam): boolean {
    return this.inviteDraft.teamIds.includes(t.id);
  }

  toggleTeam(t: AvailableTeam): void {
    if (this.isTeamSelected(t)) {
      this.inviteDraft.teamIds = this.inviteDraft.teamIds.filter(id => id !== t.id);
    } else {
      this.inviteDraft.teamIds = [...this.inviteDraft.teamIds, t.id];
    }
  }

  getInitials(name: string): string {
    return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  onInvite(form: NgForm): void {
    if (form.invalid) return;
    this.inviting = true;

    setTimeout(() => {
      const selectedTeamNames = this.availableTeams
        .filter(t => this.inviteDraft.teamIds.includes(t.id))
        .map(t => t.name);

      const newMember: WorkspaceMember = {
        id: 'u' + Date.now(),
        name: this.inviteDraft.name.trim(),
        initials: this.getInitials(this.inviteDraft.name),
        email: this.inviteDraft.email.trim(),
        color: this.inviteDraft.color,
        role: this.inviteDraft.role,
        status: 'offline',
        teams: selectedTeamNames,
        projectCount: 0,
        taskCount: 0,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };

      this.members = [...this.members, newMember];
      this.saveMembers();

      this.lastInvitedName = newMember.name;
      this.inviting = false;
      this.inviteSuccess = true;

      // Reset form after 2s
      setTimeout(() => {
        this.inviteSuccess = false;
        form.resetForm();
        this.inviteDraft = { name: '', email: '', role: 'Member', color: '#5B5BD6', teamIds: [] };
      }, 2000);
    }, 900);
  }

  // ── Role change ────────────────────────────────────────────
  onChangeRole(m: WorkspaceMember): void {
    const roles: ('Manager' | 'Member' | 'Viewer')[] = ['Manager', 'Member', 'Viewer'];
    const currentIdx = roles.indexOf(m.role);
    const next = roles[(currentIdx + 1) % roles.length];
    m.role = next;
    this.saveMembers();
  }

  // ── Remove ─────────────────────────────────────────────────
  confirmRemove(m: WorkspaceMember): void {
    this.memberToRemove = m;
  }

  removeMember(): void {
    if (!this.memberToRemove) return;
    this.members = this.members.filter(m => m.id !== this.memberToRemove!.id);
    if (this.selectedMember?.id === this.memberToRemove.id) this.selectedMember = null;
    this.memberToRemove = null;
    this.saveMembers();
  }

  // ── Persist ────────────────────────────────────────────────
  saveMembers(): void {
    localStorage.setItem('vorta_members', JSON.stringify(this.members));
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.selectedMember = null;
    this.showInvite = false;
    this.memberToRemove = null;
  }
}
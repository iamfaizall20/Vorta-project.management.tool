import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  color: string;
  members: TeamMember[];
  lead: TeamMember | null;
  projectCount: number;
  taskCount: number;
  createdAt: string;
}

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './team-list.html',
  styleUrls: ['./team-list.css'],
})
export class TeamList implements OnInit {

  teams: Team[] = [];
  searchQuery = '';
  searchFocused = false;
  selectedTeam: Team | null = null;
  showCreateTeam = false;
  creating = false;

  menuTeam: Team | null = null;
  menuX = 0;
  menuY = 0;

  colorOptions = [
    '#5B5BD6', '#E54D2E', '#30A46C', '#F59E0B',
    '#EC4899', '#7C7CE8', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F97316',
  ];

  allMembers: TeamMember[] = [
    { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
    { id: 'u2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
    { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
    { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
    { id: 'u5', name: 'Aisha Malik', initials: 'AM', color: '#EC4899', role: 'Member' },
    { id: 'u6', name: 'Bilal Khan', initials: 'BK', color: '#7C7CE8', role: 'Member' },
    { id: 'u7', name: 'Nadia Hussain', initials: 'NH', color: '#0EA5E9', role: 'Member' },
  ];

  teamDraft = {
    name: '',
    description: '',
    type: 'Engineering',
    color: '#5B5BD6',
    memberIds: [] as string[],
  };

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    const stored = JSON.parse(localStorage.getItem('vorta_teams') || '[]') as Team[];
    if (stored.length === 0) {
      this.teams = this.getMockTeams();
      localStorage.setItem('vorta_teams', JSON.stringify(this.teams));
    } else {
      this.teams = stored;
    }
  }

  getMockTeams(): Team[] {
    return [
      {
        id: 'tm1', name: 'Backend Squad', description: 'Owns all server-side services, APIs, and database architecture.',
        type: 'Engineering', icon: 'code', color: '#5B5BD6',
        members: [
          { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
          { id: 'u2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
          { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
        ],
        lead: { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
        projectCount: 3, taskCount: 14, createdAt: new Date().toISOString(),
      },
      {
        id: 'tm2', name: 'Design Team', description: 'Responsible for UI/UX design, brand identity and the Vorta design system.',
        type: 'Design', icon: 'palette', color: '#EC4899',
        members: [
          { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
          { id: 'u5', name: 'Aisha Malik', initials: 'AM', color: '#EC4899', role: 'Member' },
        ],
        lead: { id: 'u5', name: 'Aisha Malik', initials: 'AM', color: '#EC4899', role: 'Member' },
        projectCount: 2, taskCount: 8, createdAt: new Date().toISOString(),
      },
      {
        id: 'tm3', name: 'Mobile Team', description: 'Building and maintaining the iOS and Android apps.',
        type: 'Engineering', icon: 'smartphone', color: '#E54D2E',
        members: [
          { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
          { id: 'u6', name: 'Bilal Khan', initials: 'BK', color: '#7C7CE8', role: 'Member' },
          { id: 'u7', name: 'Nadia Hussain', initials: 'NH', color: '#0EA5E9', role: 'Member' },
        ],
        lead: { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
        projectCount: 1, taskCount: 6, createdAt: new Date().toISOString(),
      },
      {
        id: 'tm4', name: 'Product & QA', description: 'Product strategy, roadmap planning and quality assurance.',
        type: 'Product', icon: 'inventory_2', color: '#30A46C',
        members: [
          { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
          { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
          { id: 'u5', name: 'Aisha Malik', initials: 'AM', color: '#EC4899', role: 'Member' },
          { id: 'u7', name: 'Nadia Hussain', initials: 'NH', color: '#0EA5E9', role: 'Member' },
        ],
        lead: { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
        projectCount: 4, taskCount: 20, createdAt: new Date().toISOString(),
      },
    ];
  }

  get filteredTeams(): Team[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.teams;
    return this.teams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q)
    );
  }

  get totalMembers(): number {
    const ids = new Set<string>();
    this.teams.forEach(t => t.members.forEach(m => ids.add(m.id)));
    return ids.size;
  }

  openTeamDetail(t: Team): void {
    this.selectedTeam = t;
    this.showCreateTeam = false;
  }

  openCreateTeam(): void {
    this.teamDraft = { name: '', description: '', type: 'Engineering', color: '#5B5BD6', memberIds: [] };
    this.showCreateTeam = true;
    this.selectedTeam = null;
  }

  closeCreateTeam(): void { this.showCreateTeam = false; }

  isDraftMemberSelected(m: TeamMember): boolean {
    return this.teamDraft.memberIds.includes(m.id);
  }

  toggleDraftMember(m: TeamMember): void {
    if (this.isDraftMemberSelected(m)) {
      this.teamDraft.memberIds = this.teamDraft.memberIds.filter(id => id !== m.id);
    } else {
      this.teamDraft.memberIds = [...this.teamDraft.memberIds, m.id];
    }
  }

  iconForType(type: string): string {
    const map: Record<string, string> = {
      Engineering: 'code', Design: 'palette', Product: 'inventory_2',
      Marketing: 'campaign', Operations: 'settings', QA: 'bug_report',
    };
    return map[type] ?? 'groups';
  }

  onCreateTeam(form: NgForm): void {
    if (form.invalid) return;
    this.creating = true;
    setTimeout(() => {
      const members = this.allMembers.filter(m => this.teamDraft.memberIds.includes(m.id));
      const newTeam: Team = {
        id: 'tm' + Date.now(),
        name: this.teamDraft.name.trim(),
        description: this.teamDraft.description.trim(),
        type: this.teamDraft.type,
        icon: this.iconForType(this.teamDraft.type),
        color: this.teamDraft.color,
        members,
        lead: members[0] ?? null,
        projectCount: 0,
        taskCount: 0,
        createdAt: new Date().toISOString(),
      };
      this.teams = [newTeam, ...this.teams];
      this.saveTeams();
      this.creating = false;
      this.showCreateTeam = false;
    }, 800);
  }

  onEditTeam(t: Team): void {
    this.selectedTeam = null;
    this.teamDraft = {
      name: t.name,
      description: t.description,
      type: t.type,
      color: t.color,
      memberIds: t.members.map(m => m.id),
    };
    this.showCreateTeam = true;
  }

  onDeleteTeam(t: Team): void {
    if (!confirm(`Delete team "${t.name}"?`)) return;
    this.teams = this.teams.filter(tm => tm.id !== t.id);
    if (this.selectedTeam?.id === t.id) this.selectedTeam = null;
    this.saveTeams();
  }

  openTeamMenu(t: Team, e: MouseEvent): void {
    this.menuTeam = t;
    this.menuX = e.clientX;
    this.menuY = e.clientY;
  }

  saveTeams(): void {
    localStorage.setItem('vorta_teams', JSON.stringify(this.teams));
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.menuTeam = null;
    this.selectedTeam = null;
    this.showCreateTeam = false;
  }
}
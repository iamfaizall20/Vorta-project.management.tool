import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
}

export interface Team {
  id: number; // changed to number
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

  apiUrl = 'http://localhost/VortaAppApis/teams/create-team.php';
  getTeamsUrl = 'http://localhost/VortaAppApis/teams/get-teams.php';
  deleteTeamUrl = 'http://localhost/VortaAppApis/teams/delete-team.php';

  colorOptions = [
    '#5B5BD6', '#E54D2E', '#30A46C', '#F59E0B',
    '#EC4899', '#7C7CE8', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F97316',
  ];

  allMembers: TeamMember[] = [
    { id: '1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
    { id: '2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
    { id: '3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
    { id: '4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
    { id: '5', name: 'Aisha Malik', initials: 'AM', color: '#EC4899', role: 'Member' },
    { id: '6', name: 'Bilal Khan', initials: 'BK', color: '#7C7CE8', role: 'Member' },
    { id: '7', name: 'Nadia Hussain', initials: 'NH', color: '#0EA5E9', role: 'Member' },
  ];

  teamDraft = {
    name: '',
    description: '',
    type: 'Engineering',
    color: '#5B5BD6',
    memberIds: [] as string[],
  };

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.http.get<{ success: boolean, teams: Team[] }>(this.getTeamsUrl).subscribe({
      next: res => {
        if (res.success) this.teams = res.teams;
        else console.error('Failed to load teams: API returned success=false');
      },
      error: err => console.error('Error loading teams', err)
    });
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

  closeCreateTeam(): void {
    this.showCreateTeam = false;
  }

  isDraftMemberSelected(m: TeamMember): boolean {
    return this.teamDraft.memberIds.includes(m.id);
  }

  toggleDraftMember(m: TeamMember): void {
    if (this.isDraftMemberSelected(m)) this.teamDraft.memberIds = this.teamDraft.memberIds.filter(id => id !== m.id);
    else this.teamDraft.memberIds = [...this.teamDraft.memberIds, m.id];
  }

  iconForType(type: string): string {
    const map: Record<string, string> = {
      Engineering: 'code',
      Design: 'palette',
      Product: 'inventory_2',
      Marketing: 'campaign',
      Operations: 'settings',
      QA: 'bug_report',
    };
    return map[type] ?? 'groups';
  }

  onCreateTeam(form: NgForm): void {
    if (form.invalid) return;
    this.creating = true;
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const payload = {
      name: this.teamDraft.name.trim(),
      description: this.teamDraft.description.trim(),
      type: this.teamDraft.type,
      color: this.teamDraft.color,
      creator_id: user.user_id,
      members: this.teamDraft.memberIds
    };

    this.http.post<{ success: boolean, team_id: number }>(this.apiUrl, payload).subscribe({
      next: res => {
        if (!res.success) {
          alert('Failed to create team');
          this.creating = false;
          return;
        }

        const members = this.allMembers.filter(m => this.teamDraft.memberIds.includes(m.id));
        const newTeam: Team = {
          id: res.team_id, // numeric ID from backend
          name: payload.name,
          description: payload.description,
          type: payload.type,
          icon: this.iconForType(payload.type),
          color: payload.color,
          members: members,
          lead: members[0] ?? null,
          projectCount: 0,
          taskCount: 0,
          createdAt: new Date().toISOString(),
        };

        this.teams = [newTeam, ...this.teams];
        this.creating = false;
        this.showCreateTeam = false;
        this.teamDraft = { name: '', description: '', type: 'Engineering', color: '#5B5BD6', memberIds: [] };

        alert(`Team "${newTeam.name}" created successfully!`);
      },
      error: () => {
        this.creating = false;
        alert('Failed to create team. Please try again.');
      }
    });
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

  onDeleteTeam(team: Team) {
    if (!confirm(`Are you sure you want to delete "${team.name}"?`)) return;

    this.http.delete(this.deleteTeamUrl, {
      body: { id: team.id }, // numeric ID
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.teams = this.teams.filter(t => t.id !== team.id);
          if (this.selectedTeam?.id === team.id) this.selectedTeam = null;
          alert(res.message);
        } else alert(res.message);
      },
      error: () => alert('Server error, please try again')
    });
  }

  openTeamMenu(t: Team, e: MouseEvent): void {
    this.menuTeam = t;
    this.menuX = e.clientX;
    this.menuY = e.clientY;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.menuTeam = null;
    this.selectedTeam = null;
    this.showCreateTeam = false;
  }
}
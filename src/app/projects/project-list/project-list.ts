import { Component, OnInit, HostListener } from '@angular/core';
import { TitleCasePipe, SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ProjectsService } from '../../services/projects-service';

// Project interface with new API fields
export interface Project {
  id: string | number;
  name: string;
  description: string;
  status: 'new' | 'active' | 'hold' | 'completed';
  color: string;
  priority: 'low' | 'medium' | 'mid' | 'high' | 'critical';
  dueDate: string;

  // New API fields
  totalMembers?: number;
  totalTeams?: number;
  totalTasks?: number;
  completedTasks?: number;

  // Legacy fields - kept for backwards compatibility
  members?: any[];
  tasks?: any[];
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TitleCasePipe, SlicePipe, HttpClientModule],
  templateUrl: './project-list.html',
  styleUrls: ['./project-list.css'],
})
export class ProjectList implements OnInit {

  // ── State ──────────────────────────────────────────────────
  projects: Project[] = [];
  searchQuery = '';
  searchFocused = false;
  activeFilter = 'all';
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'name' | 'status' | 'progress' | 'dueDate' = 'name';
  isLoading = true;

  // ── Context menu ───────────────────────────────────────────
  menuProject: Project | null = null;
  menuX = 0;
  menuY = 0;

  // ── Filters ────────────────────────────────────────────────
  filters = [
    { label: 'All', value: 'all', color: '' },
    { label: 'Active', value: 'active', color: '#30A46C' },
    { label: 'New', value: 'new', color: '#A1A1AA' },
    { label: 'On Hold', value: 'hold', color: '#F59E0B' },
    { label: 'Completed', value: 'completed', color: '#5B5BD6' },
  ];

  constructor(private router: Router, private projectService: ProjectsService) { }

  ngOnInit(): void {
    // Check if organization_id exists in localStorage
    const organizationId = localStorage.getItem('organization_id');
    if (!organizationId) {
      console.error('No organization_id found in localStorage');
      this.isLoading = false;
      return;
    }

    this.loadProjects();
  }

  // ── Load from API via Service ──────────────────────────────
  loadProjects(): void {
    this.isLoading = true;
    this.projectService.projectDetails().subscribe({
      next: (data: any[]) => {
        // Map API data directly - no need to generate mock data
        this.projects = data.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || 'No description provided.',
          status: project.status,
          color: project.color,
          priority: project.priority,
          dueDate: project.dueDate,
          // Store API counts directly
          totalMembers: project.totalMembers || 0,
          totalTeams: project.totalTeams || 0,
          totalTasks: project.totalTasks || 0,
          completedTasks: project.completedTasks || 0,
          // Keep empty arrays for backwards compatibility with old helper methods
          members: [],
          tasks: []
        }));

        console.log('Loaded projects:', this.projects);
        this.isLoading = false;

        // Cache to localStorage for offline fallback
        localStorage.setItem('vorta_projects', JSON.stringify(this.projects));
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.isLoading = false;

        // Fallback to local storage if API fails
        const stored = localStorage.getItem('vorta_projects');
        if (stored) {
          this.projects = JSON.parse(stored);
        }
      }
    });
  }

  // ── Computed ───────────────────────────────────────────────
  get activeCount(): number {
    return this.projects.filter(p => p.status === 'active').length;
  }

  get completedCount(): number {
    return this.projects.filter(p => p.status === 'completed').length;
  }

  getCountByStatus(status: string): number {
    if (status === 'all') return this.projects.length;
    return this.projects.filter(p => p.status === status).length;
  }

  get filteredProjects(): Project[] {
    let list = [...this.projects];

    if (this.activeFilter !== 'all') {
      list = list.filter(p => p.status === this.activeFilter);
    }

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (this.sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'status': return a.status.localeCompare(b.status);
        case 'progress': return this.getProgress(b) - this.getProgress(a);
        case 'dueDate': return (a.dueDate || '').localeCompare(b.dueDate || '');
        default: return 0;
      }
    });

    return list;
  }

  // ── Helpers ────────────────────────────────────────────────

  // Calculate progress directly from API counts
  getProgressFromAPI(p: Project): number {
    const totalTasks = p.totalTasks ?? 0;
    const completedTasks = p.completedTasks ?? 0;

    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }

  // Legacy method - kept for backwards compatibility but uses API counts now
  getProgress(p: Project): number {
    return this.getProgressFromAPI(p);
  }

  // Legacy method - kept for backwards compatibility but uses API counts now
  getCompletedTasks(p: Project): number {
    return p.completedTasks ?? 0;
  }

  // Safe getter for total tasks
  getTotalTasks(p: Project): number {
    return p.totalTasks ?? 0;
  }

  // Safe getter for total members
  getTotalMembers(p: Project): number {
    return p.totalMembers ?? 0;
  }

  // Safe getter for total teams
  getTotalTeams(p: Project): number {
    return p.totalTeams ?? 0;
  }

  getPriorityIcon(priority: string): string {
    const map: Record<string, string> = {
      low: 'south', medium: 'remove', mid: 'remove', high: 'north', critical: 'priority_high'
    };
    return map[priority] ?? 'remove';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isOverdue(dateStr: string): boolean {
    return !!dateStr && new Date(dateStr) < new Date();
  }

  // ── Actions ────────────────────────────────────────────────
  setFilter(value: string): void {
    this.activeFilter = value;
  }

  clearFilters(): void {
    this.activeFilter = 'all';
    this.searchQuery = '';
  }

  openProject(id: string | number): void {
    this.router.navigate(['/app/projects', id]);
  }

  onNewProject(): void {
    this.router.navigate(['/app/projects/new']);
  }

  onEditProject(p: Project): void {
    this.router.navigate(['/app/projects', p.id, 'edit']);
  }

  onDeleteProject(p: Project): void {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;

    // Call the delete service
    this.projectService.deleteProject(String(p.id)).subscribe({
      next: () => {
        this.projects = this.projects.filter(proj => proj.id !== p.id);
        localStorage.setItem('vorta_projects', JSON.stringify(this.projects));
      },
      error: (err) => {
        console.error('Error deleting project:', err);
        alert('Failed to delete project. Please try again.');
      }
    });
  }

  // ── Context menu ───────────────────────────────────────────
  onMenuClick(p: Project, event: MouseEvent): void {
    this.menuProject = p;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuProject = null;
  }
}
import { Component, OnInit, HostListener } from '@angular/core';
import { TitleCasePipe, SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Project } from '../project-detail/project-detail';
import { HttpClientModule } from '@angular/common/http';
import { ProjectsService } from '../../services/projects-service';

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
  isLoading = true; // Added loading state

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
    this.loadProjects();
  }

  // ── Load from API via Service ──────────────────────────────
  loadProjects(): void {
    this.isLoading = true;
    this.projectService.projectDetails().subscribe({
      next: (data: any[]) => {
        // Map API data to match the UI expectations (adding initials etc.)
        this.projects = data.map(project => ({
          ...project,
          members: project.members.map((m: any) => ({
            ...m,
            initials: this.getInitials(m.name),
            // Default color if avatar/color is missing from API
            color: m.avatar || '#5B5BD6'
          }))
        }));
        console.log(this.projects);
        this.isLoading = false;
        // Optionally cache to localStorage if you still want offline fallback
        localStorage.setItem('vorta_projects', JSON.stringify(this.projects));
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.isLoading = false;
        // Fallback to local storage if API fails
        const stored = localStorage.getItem('vorta_projects');
        if (stored) this.projects = JSON.parse(stored);
      }
    });
  }

  // Helper to generate initials from name for the UI avatars
  private getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
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
  getProgress(p: Project): number {
    if (!p.tasks || p.tasks.length === 0) return 0;
    // The API tasks are simplified; we check if status exists or just count total
    // Assuming status logic remains same as mock for now
    const done = p.tasks.filter((t: any) => t.status === 'done').length;
    return Math.round((done / p.tasks.length) * 100);
  }

  getCompletedTasks(p: Project): number {
    return (p.tasks || []).filter((t: any) => t.status === 'done').length;
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
    // In a real app, you would call projectService.delete(p.id).subscribe(...)
    this.projects = this.projects.filter(proj => proj.id !== p.id);
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
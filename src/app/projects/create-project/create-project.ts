
// ========
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
}

interface ProjectForm {
  name: string;
  description: string;
  status: 'new' | 'active' | 'hold';
  dueDate: string;
  color: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-project.html',
  styleUrls: ['./create-project.css']
})
export class CreateProject implements OnInit {

  // ── Form model ─────────────────────────────────────────────
  form: ProjectForm = {
    name: '',
    description: '',
    status: 'new',
    dueDate: '',
    color: '#5B5BD6',
    priority: 'medium',
  };

  // ── UI state ───────────────────────────────────────────────
  loading = false;
  errorMsg = '';
  memberQuery = '';
  today = new Date().toISOString().split('T')[0];

  // ── Color palette ──────────────────────────────────────────
  colorOptions = [
    '#5B5BD6', // Indigo (default)
    '#E54D2E', // Red
    '#30A46C', // Green
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#7C7CE8', // Lavender
    '#0EA5E9', // Sky
    '#8B5CF6', // Violet
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];

  // ── Priority options ───────────────────────────────────────
  priorityOptions = [
    { value: 'low' as const, label: 'Low', icon: 'south' },
    { value: 'medium' as const, label: 'Medium', icon: 'remove' },
    { value: 'high' as const, label: 'High', icon: 'north' },
    { value: 'critical' as const, label: 'Critical', icon: 'priority_high' },
  ];

  // ── Mock registered users (replace with UserService later) ─
  allMembers: Member[] = [
    { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
    { id: 'u2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
    { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
    { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
    { id: 'u5', name: 'Aisha Malik', initials: 'AM', color: '#EC4899', role: 'Member' },
    { id: 'u6', name: 'Bilal Khan', initials: 'BK', color: '#7C7CE8', role: 'Member' },
    { id: 'u7', name: 'Nadia Hussain', initials: 'NH', color: '#0EA5E9', role: 'Member' },
  ];

  filteredAvailableMembers: Member[] = [];
  selectedMembers: Member[] = [];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.filteredAvailableMembers = [...this.allMembers];
  }

  // ── Member search / filter ──────────────────────────────────
  filterMembers(): void {
    const q = this.memberQuery.toLowerCase().trim();
    this.filteredAvailableMembers = this.allMembers.filter(m =>
      m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
    );
  }

  isMemberSelected(member: Member): boolean {
    return this.selectedMembers.some(m => m.id === member.id);
  }

  toggleMember(member: Member): void {
    if (this.isMemberSelected(member)) {
      this.selectedMembers = this.selectedMembers.filter(m => m.id !== member.id);
    } else {
      this.selectedMembers = [...this.selectedMembers, member];
    }
  }

  removeMember(member: Member): void {
    this.selectedMembers = this.selectedMembers.filter(m => m.id !== member.id);
  }

  // ── Date formatting for preview ────────────────────────────
  formatDate(dateStr: string): string {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Submit ─────────────────────────────────────────────────
  onSubmit(ngForm: NgForm): void {
    if (ngForm.invalid) {
      ngForm.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    // Build the new project object — replace setTimeout with ProjectService.create() later
    const newProject = {
      id: 'p' + Date.now(),
      name: this.form.name.trim(),
      description: this.form.description.trim(),
      status: this.form.status,
      color: this.form.color,
      priority: this.form.priority,
      dueDate: this.form.dueDate,
      members: this.selectedMembers,
      tasksCompleted: 0,
      tasksTotal: 0,
      createdAt: new Date().toISOString(),
    };

    // Simulate API call
    setTimeout(() => {
      // Save to localStorage mock store
      const existing = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
      existing.push(newProject);
      localStorage.setItem('vorta_projects', JSON.stringify(existing));

      this.loading = false;
      // Navigate to the new project's detail page
      this.router.navigate(['/app/projects', newProject.id]);
    }, 1200);
  }

  onCancel(): void {
    this.router.navigate(['/app/projects']);
  }
}
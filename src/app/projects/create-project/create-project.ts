// ========
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectsService } from '../../services/projects-service';
import { UserService } from '../../services/user-service';

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
    '#5B5BD6',
    '#E54D2E',
    '#30A46C',
    '#F59E0B',
    '#EC4899',
    '#7C7CE8',
    '#0EA5E9',
    '#8B5CF6',
    '#14B8A6',
    '#F97316',
  ];

  // ── Priority options ───────────────────────────────────────
  priorityOptions = [
    { value: 'low' as const, label: 'Low', icon: 'south' },
    { value: 'medium' as const, label: 'Medium', icon: 'remove' },
    { value: 'high' as const, label: 'High', icon: 'north' },
    { value: 'critical' as const, label: 'Critical', icon: 'priority_high' },
  ];

  // ── Members (now from API) ─────────────────────────────────
  allMembers: Member[] = [];
  filteredAvailableMembers: Member[] = [];
  selectedMembers: Member[] = [];

  constructor(
    private router: Router,
    private projectService: ProjectsService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.getUsers();
  }

  // ✅ Load Users from API
  getUsers(): void {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.allMembers = res.data.map((u: any) => ({
            id: u.user_id,
            name: u.full_name,
            initials: this.getInitials(u.full_name),
            color: '#5B5BD6',
            role: 'Member'
          }));

          this.filteredAvailableMembers = [...this.allMembers];
        }
      },
      error: () => {
        this.errorMsg = 'Failed to load users';
      }
    });
  }

  // Compute initials from full name
  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
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

    const payload = {
      title: this.form.name.trim(),
      description: this.form.description.trim(),
      status: this.form.status,
      color: this.form.color,
      due_date: this.form.dueDate,
      priority: this.form.priority === 'medium' ? 'mid' : this.form.priority,
      members: this.selectedMembers.map(m => m.id)
    };

    // ✅ Call API instead of localStorage
    this.projectService.createProject(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/app/projects', res.project_id]);
        } else {
          this.errorMsg = res.message || 'Failed to create project';
        }
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Server error while creating project';
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/app/projects']);
  }
}
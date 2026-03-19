import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../services/projects-service';

interface Project {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  members?: TeamMember[];
}

interface TeamMember {
  user_id: string;
  name: string;
  email?: string;
  role?: string;
  avatar_color?: string;
}

interface TeamFormData {
  team_id: string;
  project_id: string;
  name: string;
  description: string;
  members: TeamMemberAssignment[];
}

interface TeamMemberAssignment {
  user_id: string;
  team_id: string;
  name?: string;
  email?: string;
  avatar_color?: string;
}

type DialogStep = 'project-selection' | 'team-creation';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-component.html',
  styleUrls: ['./team-component.css']
})
export class TeamComponent implements OnInit {
  // Dialog state
  isDialogOpen = false;
  currentStep: DialogStep = 'project-selection';

  // Project selection
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchQuery = '';
  isLoadingProjects = false;
  selectedProject: Project | null = null;

  // Team creation form
  teamForm: TeamFormData = {
    team_id: '',
    project_id: '',
    name: '',
    description: '',
    members: []
  };

  // Available users from selected project
  availableUsers: TeamMember[] = [];
  selectedUserIds: Set<string> = new Set();

  // Form validation
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  constructor(private projectService: ProjectService) { }

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * Open the team creation dialog
   */
  openDialog(): void {
    this.isDialogOpen = true;
    this.currentStep = 'project-selection';
    this.loadProjects();
  }

  /**
   * Close the dialog and reset state
   */
  closeDialog(): void {
    this.isDialogOpen = false;
    this.resetDialogState();
  }

  /**
   * Reset all dialog state
   */
  private resetDialogState(): void {
    this.currentStep = 'project-selection';
    this.searchQuery = '';
    this.selectedProject = null;
    this.resetTeamForm();
    this.formErrors = {};
  }

  /**
   * Load all projects for the organization
   */
  loadProjects(): void {
    this.isLoadingProjects = true;

    this.projectService.projectDetails().subscribe({
      next: (response: any) => {
        // Assuming the API returns an array of projects or a response with projects array
        this.projects = Array.isArray(response) ? response : (response.projects || []);
        this.filteredProjects = [...this.projects];
        this.isLoadingProjects = false;
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.isLoadingProjects = false;
        // TODO: Show error message to user
      }
    });
  }

  /**
   * Filter projects based on search query
   */
  filterProjects(): void {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.filteredProjects = [...this.projects];
      return;
    }

    this.filteredProjects = this.projects.filter(project =>
      project.title.toLowerCase().includes(query) ||
      (project.description?.toLowerCase().includes(query) || false)
    );
  }

  /**
   * Select a project and move to team creation step
   */
  selectProject(project: Project): void {
    this.selectedProject = project;
    this.teamForm.project_id = project.id;
    this.teamForm.team_id = this.generateTeamId();

    // Extract available users from project members
    this.availableUsers = project.members || [];

    // Move to team creation step
    this.currentStep = 'team-creation';
  }

  /**
   * Go back to project selection
   */
  backToProjectSelection(): void {
    this.currentStep = 'project-selection';
    this.resetTeamForm();
  }

  /**
   * Generate a unique team ID
   */
  private generateTeamId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `team-${timestamp}-${random}`;
  }

  /**
   * Reset team form to initial state
   */
  private resetTeamForm(): void {
    this.teamForm = {
      team_id: '',
      project_id: '',
      name: '',
      description: '',
      members: []
    };
    this.selectedUserIds.clear();
    this.formErrors = {};
  }

  /**
   * Toggle member selection
   */
  toggleMemberSelection(user: TeamMember): void {
    if (this.selectedUserIds.has(user.user_id)) {
      this.selectedUserIds.delete(user.user_id);
      this.teamForm.members = this.teamForm.members.filter(
        m => m.user_id !== user.user_id
      );
    } else {
      this.selectedUserIds.add(user.user_id);
      this.teamForm.members.push({
        user_id: user.user_id,
        team_id: this.teamForm.team_id,
        name: user.name,
        email: user.email,
        avatar_color: user.avatar_color
      });
    }

    // Clear members error if any member is selected
    if (this.selectedUserIds.size > 0) {
      delete this.formErrors['members'];
    }
  }

  /**
   * Check if a user is selected
   */
  isMemberSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }

  /**
   * Validate the team creation form
   */
  private validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    // Validate team name
    if (!this.teamForm.name.trim()) {
      this.formErrors['name'] = 'Team name is required';
      isValid = false;
    } else if (this.teamForm.name.trim().length < 3) {
      this.formErrors['name'] = 'Team name must be at least 3 characters';
      isValid = false;
    }

    // Validate description (optional, but if provided should have min length)
    if (this.teamForm.description.trim() && this.teamForm.description.trim().length < 10) {
      this.formErrors['description'] = 'Description must be at least 10 characters if provided';
      isValid = false;
    }

    // Validate members
    if (this.teamForm.members.length === 0) {
      this.formErrors['members'] = 'Please select at least one team member';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Submit the team creation form
   */
  submitTeamForm(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    // TODO: Replace with actual API call to create team
    // Example:
    // this.teamService.createTeam(this.teamForm).subscribe({
    //   next: (response) => {
    //     console.log('Team created successfully:', response);
    //     this.closeDialog();
    //     // Show success message
    //   },
    //   error: (error) => {
    //     console.error('Error creating team:', error);
    //     this.isSubmitting = false;
    //     // Show error message
    //   }
    // });

    // Simulate API call
    setTimeout(() => {
      console.log('Team created:', this.teamForm);
      this.isSubmitting = false;
      this.closeDialog();
      // TODO: Show success notification
      // TODO: Refresh teams list
    }, 1500);
  }

  /**
   * Get status badge class
   */
  getStatusClass(status?: string): string {
    const statusMap: { [key: string]: string } = {
      'new': 'status-badge--new',
      'active': 'status-badge--active',
      'on-hold': 'status-badge--hold',
      'completed': 'status-badge--completed',
      'cancelled': 'status-badge--cancelled'
    };
    return statusMap[status?.toLowerCase() || 'new'] || 'status-badge--new';
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority?: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': 'priority-badge--low',
      'medium': 'priority-badge--medium',
      'high': 'priority-badge--high',
      'critical': 'priority-badge--critical'
    };
    return priorityMap[priority?.toLowerCase() || 'low'] || 'priority-badge--low';
  }

  /**
   * Get initials from name
   */
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Get avatar color for user
   */
  getAvatarColor(user: TeamMember): string {
    if (user.avatar_color) return user.avatar_color;

    // Generate color based on user_id
    const colors = [
      '#5B5BD6', '#30A46C', '#F59E0B', '#EF4444',
      '#8B5CF6', '#06B6D4', '#EC4899', '#10B981'
    ];
    const index = user.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  }

  /**
   * Handle backdrop click to close dialog
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }
}
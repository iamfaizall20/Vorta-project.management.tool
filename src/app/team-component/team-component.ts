import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../services/projects-service';

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  color?: string;
  dueDate?: string;
  totalMembers?: number;
  totalTeams?: number;
  totalTasks?: number;
  completedTasks?: number;
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
  organizationId: string = '';

  // Page state
  currentStep: DialogStep = 'project-selection';

  // Project selection
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchQuery = '';
  isLoadingProjects = false;
  isLoadingMembers = false; // ✅ Separate loading state for members
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

  constructor(private projectsService: ProjectsService) { }

  ngOnInit(): void {
    this.organizationId = localStorage.getItem('organization_id') || '';

    if (!this.organizationId) {
      console.error('Organization ID not found in localStorage');
      this.formErrors['general'] = 'Organization ID is missing. Please log in again.';
      return;
    }

    this.loadProjects();
  }

  /**
   * Reset all state and go back to project selection
   */
  resetToProjectSelection(): void {
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
    if (!this.organizationId) {
      console.error('Organization ID is not set');
      this.formErrors['general'] = 'Organization ID is missing. Please log in again.';
      return;
    }

    this.isLoadingProjects = true;

    // Call without id parameter to get all projects
    this.projectsService.projectDetails().subscribe({
      next: (response) => {
        console.log('Projects API Response:', response);

        // Handle the response - it returns an array directly
        this.projects = Array.isArray(response) ? response : [];
        this.filteredProjects = [...this.projects];
        this.isLoadingProjects = false;

        // Clear any previous errors
        delete this.formErrors['general'];
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.isLoadingProjects = false;

        // Handle specific error cases
        if (error.status === 400) {
          this.formErrors['general'] = error.error?.error || 'Invalid organization ID.';
        } else if (error.status === 404) {
          this.formErrors['general'] = 'No projects found for this organization.';
          this.projects = [];
          this.filteredProjects = [];
        } else if (error.status === 0) {
          this.formErrors['general'] = 'Network error. Please check your connection.';
        } else {
          this.formErrors['general'] = error.error?.error || 'Failed to load projects. Please try again.';
        }
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
      project.name.toLowerCase().includes(query) ||
      (project.description?.toLowerCase().includes(query) || false)
    );
  }

  /**
   * Select a project and load its details to get members
   */
  selectProject(project: Project): void {
    this.selectedProject = project;
    this.teamForm.project_id = project.id;
    this.teamForm.team_id = this.generateTeamId();

    // Move to team creation step immediately
    this.currentStep = 'team-creation';

    // Load full project details to get members in the background
    this.loadProjectDetails(project.id);
  }

  /**
   * Load detailed project information including members
   */
  private loadProjectDetails(projectId: string): void {
    this.isLoadingMembers = true;

    this.projectsService.projectDetails(projectId).subscribe({
      next: (response) => {
        console.log('Project Details Response:', response);

        if (response.members && Array.isArray(response.members)) {
          this.availableUsers = response.members.map((member: any) => ({
            user_id: String(member.id),
            name: member.name,
            avatar_color: this.generateColorForUser(member.id)
          }));
        } else {
          this.availableUsers = [];
        }

        this.isLoadingMembers = false;

        delete this.formErrors['general'];
        delete this.formErrors['members'];
      },
      error: (error) => {
        console.error('Error loading project details:', error);
        this.isLoadingMembers = false;

        // Set empty members list
        this.availableUsers = [];

        // Show warning but don't block the flow
        this.formErrors['members'] = 'Could not load project members. You may need to refresh.';
      }
    });
  }

  /**
   * Generate a color for a user based on their ID
   */
  private generateColorForUser(userId: string | number): string {
    const colors = [
      '#5B5BD6', '#30A46C', '#F59E0B', '#EF4444',
      '#8B5CF6', '#06B6D4', '#EC4899', '#10B981'
    ];

    const ID = String(userId);
    const index = ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
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
    const num = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `team-${num}`;
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
    this.availableUsers = [];
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

    // Call the API to create team
    this.projectsService.createTeam(this.teamForm).subscribe({
      next: (response) => {
        console.log('Team created successfully:', response);
        this.isSubmitting = false;

        // Reset to project selection after success
        this.resetToProjectSelection();

        // TODO: Show success notification
        alert('Team created successfully!');
      },
      error: (error) => {
        console.error('Error creating team:', error);
        this.isSubmitting = false;

        // Show error notification to user
        this.formErrors['submit'] = error.error?.error || 'Failed to create team. Please try again.';
      }
    });
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

    const colors = [
      '#5B5BD6', '#30A46C', '#F59E0B', '#EF4444',
      '#8B5CF6', '#06B6D4', '#EC4899', '#10B981'
    ];

    const idStr = String(user.user_id);

    const index = idStr.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );

    return colors[index % colors.length];
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'http://localhost/VortaAppApis/projects/projects.php';
  private createProjectUrl = 'http://localhost/VortaAppApis/projects/create.php';
  private deleteProjectUrl = 'http://localhost/VortaAppApis/projects/delete.php';
  private createTeamUrl = 'http://localhost/VortaAppApis/teams/create-team.php'; // Add your team creation endpoint

  constructor(private http: HttpClient) { }

  /**
   * Fetch project details
   * @param id - Optional project ID. If not provided, returns all projects for the organization
   * @returns Observable with project data
   */
  projectDetails(id?: string): Observable<any> {
    const organizationId = localStorage.getItem('organization_id');

    if (!organizationId) {
      throw new Error('organization_id not found in localStorage');
    }

    const body: any = {
      organization_id: organizationId
    };

    // If id is provided, add it to the body for single project fetch
    if (id) {
      body.id = id;
    }

    return this.http.post<any>(this.apiUrl, body);
  }

  /**
   * Create a new project
   * @param projectData - Project data to create
   * @returns Observable with creation response
   */
  createProject(projectData: any): Observable<any> {
    return this.http.post(this.createProjectUrl, projectData);
  }

  /**
   * Delete a project
   * @param projectId - ID of the project to delete
   * @returns Observable with deletion response
   */
  deleteProject(projectId: string): Observable<any> {
    return this.http.post(this.deleteProjectUrl, {
      project_id: projectId
    });
  }

  /**
   * Create a new team for a project
   * @param teamData - Team creation data
   * @returns Observable with created team data
   */
  createTeam(teamData: any): Observable<any> {
    const organizationId = localStorage.getItem('organization_id');

    if (!organizationId) {
      throw new Error('organization_id not found in localStorage');
    }

    const body = {
      ...teamData,
      organization_id: organizationId
    };

    return this.http.post<any>(this.createTeamUrl, body);
  }
}

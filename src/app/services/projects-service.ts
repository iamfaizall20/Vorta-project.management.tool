import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'http://localhost/VortaAppApis/projects/projects.php';

  constructor(private http: HttpClient) { }

  /**
   * Fetch project details
   * @param id - Optional project ID. If not provided, returns all projects for the organization
   * @returns Observable with project data
   */
  projectDetails(id?: string): Observable<any> {
    const organizationId = localStorage.getItem('organization_id');

    console.log('🌐 ProjectsService.projectDetails called');
    console.log('  📍 Project ID:', id || 'none (fetching all projects)');
    console.log('  🏢 Organization ID:', organizationId);

    if (!organizationId) {
      console.error('❌ No organization_id found in localStorage');
      throw new Error('organization_id not found in localStorage');
    }

    const body: any = {
      organization_id: organizationId
    };

    // If id is provided, add it to the body for single project fetch
    if (id) {
      body.id = id;
    }

    console.log('📤 Request body:', body);
    console.log('🔗 API URL:', this.apiUrl);

    return this.http.post<any>(this.apiUrl, body).pipe(
      tap({
        next: (response) => {
          console.log('✅ API Response received:', response);
          if (id) {
            console.log('  📄 Project name:', response.name);
            console.log('  👥 Members:', response.members?.length || 0);
            console.log('  🏢 Teams:', response.teams?.length || 0);
            console.log('  📊 Stats:', response.stats);
          } else {
            console.log('  📋 Projects count:', response.length);
          }
        },
        error: (error) => {
          console.error('❌ API Error:', error);
          console.error('  Status:', error.status);
          console.error('  Status Text:', error.statusText);
          console.error('  Error Message:', error.message);
          console.error('  Error Details:', error.error);
        }
      })
    );
  }

  /**
   * Create a new project
   * @param projectData - Project data to create
   * @returns Observable with creation response
   */
  createProject(projectData: any): Observable<any> {
    console.log('🌐 ProjectsService.createProject called');
    console.log('  📦 Project data:', projectData);

    return this.http.post('http://localhost/VortaAppApis/projects/create.php', projectData).pipe(
      tap({
        next: (response) => console.log('✅ Project created:', response),
        error: (error) => console.error('❌ Create project error:', error)
      })
    );
  }

  /**
   * Delete a project
   * @param projectId - ID of the project to delete
   * @returns Observable with deletion response
   */
  deleteProject(projectId: number): Observable<any> {
    console.log('🌐 ProjectsService.deleteProject called');
    console.log('  🗑️ Project ID:', projectId);

    return this.http.post('http://localhost/VortaAppApis/projects/delete.php', {
      project_id: projectId
    }).pipe(
      tap({
        next: (response) => console.log('✅ Project deleted:', response),
        error: (error) => console.error('❌ Delete project error:', error)
      })
    );
  }
}
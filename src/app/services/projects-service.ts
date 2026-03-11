import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'http://localhost/VortaAppApis/projects/projects.php';

  constructor(private http: HttpClient) { }

  projectDetails(id?: string): Observable<any> {
    const url = id ? `${this.apiUrl}?id=${id}` : this.apiUrl;
    return this.http.get<any>(url);
  }

  createProject(projectData: any): Observable<any> {
    return this.http.post('http://localhost/VortaAppApis/projects/create.php', projectData);
  }

  deleteProject(projectId: number): Observable<any> {
    return this.http.post('http://localhost/VortaAppApis/projects/delete.php', {
      project_id: projectId
    })
  }
}
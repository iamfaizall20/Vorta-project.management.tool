import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService {

  constructor(private http: HttpClient) { }

  createTask(taskData: any): Observable<any> {
    return this.http.post('http://localhost/VortaAppApis/tasks/create.php', taskData, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getTasks(id: number): Observable<any> {
    return this.http.post('http://localhost/VortaAppApis/tasks/get.php',
      {
        user_id: id
      })
  }

  updateTaskStatus(taskId: number, status: string) {
    return this.http.post(
      'http://localhost/VortaAppApis/tasks/update-status.php',
      {
        task_id: taskId,
        status: status
      }
    );
  }
}
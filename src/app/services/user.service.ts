import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isPremium: boolean;
  premiumExpiryDate?: string;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  isPremium: boolean;
}

export interface UpdateSubscriptionRequest {
  isPremium: boolean;
  months: number;
}

export interface UserStatsResponse {
  totalUsers: number;
  premiumUsers: number;
  adminUsers: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllUsers(page: number = 0, size: number = 10, sortBy: string = 'createdAt', sortDir: string = 'desc'): Observable<PageResponse<User>> {
    const params = {
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    };
    
    return this.http.get<PageResponse<User>>(`${this.apiUrl}/users`, {
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, userData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateUserSubscription(userId: number, subscriptionData: UpdateSubscriptionRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}/subscription`, subscriptionData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserStats(): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/users/stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}

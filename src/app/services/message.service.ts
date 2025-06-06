import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface SendMessageRequest {
  name: string;
  email: string;
  reason: string;
  subject: string;
  message: string;
}

export interface MessageResponse {
  id: number;
  name: string;
  email: string;
  reason: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'READ' | 'RESPONDED' | 'CLOSED';
  adminResponse?: string;
  respondedBy?: string;
  createdAt: string;
  readAt?: string;
  respondedAt?: string;
  userId?: number;
  username?: string;
}

export interface RespondToMessageRequest {
  response: string;
}

export interface MessageStatsResponse {
  totalMessages: number;
  unreadMessages: number;
  pendingMessages: number;
  respondedMessages: number;
  closedMessages: number;
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
export class MessageService {
  private apiUrl = 'http://localhost:8080/api/messages';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Public methods - for contact form
  sendMessage(messageData: SendMessageRequest): Observable<MessageResponse> {
    const headers = this.authService.isAuthenticated() ? this.authService.getAuthHeaders() : {};
    return this.http.post<MessageResponse>(`${this.apiUrl}/send`, messageData, { headers });
  }

  // User methods - for profile
  getMyMessages(page: number = 0, size: number = 10): Observable<PageResponse<MessageResponse>> {
    const params = {
      page: page.toString(),
      size: size.toString()
    };
    
    return this.http.get<PageResponse<MessageResponse>>(`${this.apiUrl}/my-messages`, {
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getMessageById(messageId: number): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/${messageId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Admin methods
  getAllMessages(page: number = 0, size: number = 10, sortBy: string = 'createdAt', sortDir: string = 'desc'): Observable<PageResponse<MessageResponse>> {
    const params = {
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    };
    
    return this.http.get<PageResponse<MessageResponse>>(`${this.apiUrl}/admin/all`, {
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getMessagesByStatus(status: string, page: number = 0, size: number = 10): Observable<PageResponse<MessageResponse>> {
    const params = {
      page: page.toString(),
      size: size.toString()
    };
    
    return this.http.get<PageResponse<MessageResponse>>(`${this.apiUrl}/admin/status/${status}`, {
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  searchMessages(keyword: string, page: number = 0, size: number = 10): Observable<PageResponse<MessageResponse>> {
    const params = {
      keyword,
      page: page.toString(),
      size: size.toString()
    };
    
    return this.http.get<PageResponse<MessageResponse>>(`${this.apiUrl}/admin/search`, {
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  markAsRead(messageId: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/admin/${messageId}/read`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  respondToMessage(messageId: number, response: string): Observable<MessageResponse> {
    const requestData: RespondToMessageRequest = { response };
    
    return this.http.put<MessageResponse>(`${this.apiUrl}/admin/${messageId}/respond`, requestData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  closeMessage(messageId: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/admin/${messageId}/close`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteMessage(messageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/${messageId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getMessageStats(): Observable<MessageStatsResponse> {
    return this.http.get<MessageStatsResponse>(`${this.apiUrl}/admin/stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getRecentMessages(limit: number = 5): Observable<MessageResponse[]> {
    const params = { limit: limit.toString() };
    
    return this.http.get<MessageResponse[]>(`${this.apiUrl}/admin/recent`, {
      params,
      headers: this.authService.getAuthHeaders()
    });
  }
}

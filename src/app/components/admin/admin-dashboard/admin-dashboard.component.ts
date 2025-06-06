import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { VideoService, Video } from '../../../services/video.service';
import { UserService, User, CreateUserRequest, UserStatsResponse } from '../../../services/user.service';
import { MessageService, MessageResponse, MessageStatsResponse } from '../../../services/message.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  videos: Video[] = [];
  users: User[] = [];
  userStats: UserStatsResponse | null = null;
  loading = true;
  loadingUsers = false;
  error = '';
  userError = '';
  activeTab = 'overview'; // 'overview', 'videos', 'users', 'messages'
  
  // User management
  showAddUserForm = false;
  addUserForm!: FormGroup;
  isSubmittingUser = false;

  // Messages management
  messages: MessageResponse[] = [];
  messageStats: MessageStatsResponse | null = null;
  loadingMessages = false;
  currentMessagesPage = 0;
  totalMessagesPages = 0;
  unreadMessagesCount = 0;
  selectedMessageStatus = '';
  messageSearchTerm = '';
  expandedMessages = new Set<number>();
  responseTexts: { [key: number]: string } = {};
  
  // Additional properties for beautiful styling
  searchTerm = '';
  isLoadingMessages = false;
  filteredMessages: MessageResponse[] = [];
  respondingToMessage: MessageResponse | null = null;
  adminResponse = '';
  responseStatus = 'RESPONDED';

  constructor(
    private authService: AuthService,
    private videoService: VideoService,
    private userService: UserService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      window.location.href = '/home';
      return;
    }
    this.initializeAddUserForm();
    this.loadDashboardData();
  }

  initializeAddUserForm(): void {
    this.addUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['USER', [Validators.required]],
      isPremium: [false]
    });
  }

  loadDashboardData(): void {
    this.loadVideos();
    this.loadUserStats();
    if (this.activeTab === 'users') {
      this.loadUsers();
    }
  }
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'users' && this.users.length === 0) {
      this.loadUsers();
    }
    if (tab === 'messages' && this.messages.length === 0) {
      this.loadMessages();
      this.loadMessageStats();
    }
  }

  loadVideos(): void {
    this.loading = true;
    this.videoService.getVideos().subscribe({
      next: (videos: Video[]) => {
        this.videos = videos;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Fout bij het laden van video\'s';
        this.loading = false;
        console.error('Error loading videos:', error);
      }
    });
  }

  deleteVideo(id: number): void {
    if (confirm('Weet je zeker dat je deze video wilt verwijderen?')) {
      this.videoService.deleteVideo(id).subscribe({
        next: () => {
          this.videos = this.videos.filter(video => video.id !== id);
        },
        error: (error: any) => {
          console.error('Error deleting video:', error);
          alert('Fout bij het verwijderen van de video');
        }
      });
    }
  }  getVideoThumbnail(video: Video): string {
    if (video.coverImageUrl) {
      return this.videoService.getCoverImageUrl(video.coverImageUrl);
    }
    return 'assets/images/default-thumbnail.svg';
  }

  getFreeVideosCount(): number {
    return this.videos.filter(v => v.contentType === 'FREE').length;
  }

  getPremiumVideosCount(): number {
    return this.videos.filter(v => v.contentType === 'PREMIUM').length;
  }

  getTotalViews(): number {
    return this.videos.reduce((sum, v) => sum + v.viewCount, 0);
  }
  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  // User Management Methods
  loadUserStats(): void {
    this.userService.getUserStats().subscribe({
      next: (stats) => {
        this.userStats = stats;
      },
      error: (error) => {
        console.error('Error loading user stats:', error);
      }
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.userService.getAllUsers(0, 50).subscribe({
      next: (response) => {
        this.users = response.content;
        this.loadingUsers = false;
      },
      error: (error) => {
        this.userError = 'Fout bij het laden van gebruikers';
        this.loadingUsers = false;
        console.error('Error loading users:', error);
      }
    });
  }

  toggleAddUserForm(): void {
    this.showAddUserForm = !this.showAddUserForm;
    if (!this.showAddUserForm) {
      this.addUserForm.reset();
      this.addUserForm.patchValue({
        role: 'USER',
        isPremium: false
      });
    }
  }

  onSubmitUser(): void {
    if (this.addUserForm.valid) {
      // Debug authentication state
      console.log('=== USER CREATION DEBUG ===');
      console.log('Is authenticated:', this.authService.isAuthenticated());
      console.log('Is admin:', this.authService.isAdmin());
      console.log('Current user:', this.authService.getCurrentUser());
      console.log('Token:', this.authService.getToken());
      console.log('Auth headers:', this.authService.getAuthHeaders());

      if (!this.authService.isAuthenticated()) {
        alert('Je bent niet ingelogd. Log eerst in.');
        return;
      }

      if (!this.authService.isAdmin()) {
        alert('Je hebt geen admin rechten om gebruikers aan te maken.');
        return;
      }

      this.isSubmittingUser = true;
      const userData: CreateUserRequest = this.addUserForm.value;

      console.log('Creating user with data:', userData);

      this.userService.createUser(userData).subscribe({
        next: (newUser) => {
          console.log('User created successfully:', newUser);
          this.users.unshift(newUser);
          this.toggleAddUserForm();
          this.loadUserStats(); // Refresh stats
          this.isSubmittingUser = false;
          alert('Gebruiker succesvol aangemaakt!');
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.isSubmittingUser = false;
          
          let errorMessage = 'Fout bij het aanmaken van de gebruiker.';
          if (error.status === 403) {
            errorMessage = 'Toegang geweigerd. Je hebt geen rechten om gebruikers aan te maken. Log opnieuw in als admin.';
          } else if (error.status === 401) {
            errorMessage = 'Je sessie is verlopen. Log opnieuw in.';
          } else if (error.status === 400) {
            errorMessage = error.error || 'Ongeldige gebruikersgegevens.';
          } else if (error.status === 0) {
            errorMessage = 'Kan geen verbinding maken met de server.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  deleteUser(userId: number): void {
    if (confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(user => user.id !== userId);
          this.loadUserStats(); // Refresh stats
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Fout bij het verwijderen van de gebruiker');
        }
      });
    }
  }

  toggleUserPremium(user: User): void {
    const subscriptionData = {
      isPremium: !user.isPremium,
      months: user.isPremium ? 0 : 1 // Add 1 month if making premium
    };

    this.userService.updateUserSubscription(user.id, subscriptionData).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.loadUserStats(); // Refresh stats
      },
      error: (error) => {
        console.error('Error updating user subscription:', error);
        alert('Fout bij het bijwerken van het abonnement');
      }
    });
  }
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Messages methods
  loadMessages(page: number = 0): void {
    this.loadingMessages = true;
    this.isLoadingMessages = true;
    let observable;

    if (this.messageSearchTerm || this.searchTerm) {
      const searchTerm = this.messageSearchTerm || this.searchTerm;
      observable = this.messageService.searchMessages(searchTerm, page, 10);
    } else if (this.selectedMessageStatus) {
      observable = this.messageService.getMessagesByStatus(this.selectedMessageStatus, page, 10);
    } else {
      observable = this.messageService.getAllMessages(page, 10);
    }

    observable.subscribe({
      next: (response) => {
        this.messages = response.content;
        this.filteredMessages = response.content;
        this.currentMessagesPage = response.number;
        this.totalMessagesPages = response.totalPages;
        this.loadingMessages = false;
        this.isLoadingMessages = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loadingMessages = false;
        this.isLoadingMessages = false;
      }
    });
  }

  loadMessageStats(): void {
    this.messageService.getMessageStats().subscribe({
      next: (stats) => {
        this.messageStats = stats;
        this.unreadMessagesCount = stats.unreadMessages;
      },
      error: (error) => {
        console.error('Error loading message stats:', error);
      }
    });
  }

  filterMessages(): void {
    this.currentMessagesPage = 0;
    this.loadMessages();
  }
  searchMessages(): void {
    this.currentMessagesPage = 0;
    this.loadMessages();
  }

  refreshMessages(): void {
    this.loadMessages(this.currentMessagesPage);
    this.loadMessageStats();
  }

  clearMessageFilters(): void {
    this.selectedMessageStatus = '';
    this.messageSearchTerm = '';
    this.searchTerm = '';
    this.currentMessagesPage = 0;
    this.loadMessages();
  }

  toggleMessageDetails(messageId: number): void {
    if (this.expandedMessages.has(messageId)) {
      this.expandedMessages.delete(messageId);
    } else {
      this.expandedMessages.add(messageId);
      // Initialize response text if not exists
      if (!this.responseTexts[messageId]) {
        this.responseTexts[messageId] = '';
      }
    }
  }

  markAsRead(messageId: number): void {
    this.messageService.markAsRead(messageId).subscribe({
      next: (updatedMessage) => {
        // Update the message in both arrays
        const index = this.messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
          this.filteredMessages[index] = updatedMessage;
        }
        this.refreshMessages();
      },
      error: (error) => {
        console.error('Error marking message as read:', error);
        alert('Fout bij het markeren als gelezen');
      }
    });
  }

  respondToMessage(messageId: number): void {
    const responseText = this.responseTexts[messageId]?.trim();
    if (!responseText) {
      alert('Voer een antwoord in');
      return;
    }

    this.messageService.respondToMessage(messageId, responseText).subscribe({
      next: (updatedMessage) => {
        // Update the message in both arrays
        const index = this.messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
          this.filteredMessages[index] = updatedMessage;
        }
        this.responseTexts[messageId] = '';
        this.refreshMessages();
        alert('Antwoord succesvol verzonden');
      },
      error: (error) => {
        console.error('Error responding to message:', error);
        alert('Fout bij het verzenden van het antwoord');
      }
    });
  }

  // Additional methods for beautiful styling
  startResponse(message: MessageResponse): void {
    this.respondingToMessage = message;
    this.adminResponse = '';
    this.responseStatus = 'RESPONDED';
  }

  cancelResponse(): void {
    this.respondingToMessage = null;
    this.adminResponse = '';
    this.responseStatus = 'RESPONDED';
  }

  submitResponse(): void {
    if (!this.respondingToMessage || !this.adminResponse.trim()) {
      return;
    }

    this.messageService.respondToMessage(this.respondingToMessage.id, this.adminResponse.trim()).subscribe({
      next: (updatedMessage) => {
        // Update the message in both arrays
        const index = this.messages.findIndex(m => m.id === this.respondingToMessage!.id);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
          this.filteredMessages[index] = updatedMessage;
        }
        this.cancelResponse();
        this.refreshMessages();
      },
      error: (error) => {
        console.error('Error responding to message:', error);
        alert('Fout bij het verzenden van het antwoord');
      }
    });
  }

  closeMessage(messageId: number): void {
    this.messageService.closeMessage(messageId).subscribe({
      next: (updatedMessage) => {
        // Update the message in the list
        const index = this.messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
        }
        this.refreshMessages();
        alert('Bericht succesvol gesloten');
      },
      error: (error) => {
        console.error('Error closing message:', error);
        alert('Fout bij het sluiten van het bericht');
      }
    });
  }

  deleteMessage(messageId: number): void {
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        // Remove the message from the list
        this.messages = this.messages.filter(m => m.id !== messageId);
        this.refreshMessages();
        alert('Bericht succesvol verwijderd');
      },
      error: (error) => {
        console.error('Error deleting message:', error);
        alert('Fout bij het verwijderen van het bericht');
      }
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'In behandeling';
      case 'READ': return 'Gelezen';
      case 'RESPONDED': return 'Beantwoord';
      case 'CLOSED': return 'Gesloten';
      default: return status;
    }
  }

  // Getters for form validation
  get username() { return this.addUserForm.get('username'); }
  get email() { return this.addUserForm.get('email'); }
  get password() { return this.addUserForm.get('password'); }
  get role() { return this.addUserForm.get('role'); }
  get isPremium() { return this.addUserForm.get('isPremium'); }
}

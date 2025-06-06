import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { VideoService, Video } from '../../../services/video.service';
import { UserService, User, CreateUserRequest, UserStatsResponse } from '../../../services/user.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
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
  activeTab = 'overview'; // 'overview', 'videos', 'users'
  
  // User management
  showAddUserForm = false;
  addUserForm!: FormGroup;
  isSubmittingUser = false;

  constructor(
    private authService: AuthService,
    private videoService: VideoService,
    private userService: UserService,
    private fb: FormBuilder
  ) {}  ngOnInit(): void {
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

  // Getters for form validation
  get username() { return this.addUserForm.get('username'); }
  get email() { return this.addUserForm.get('email'); }
  get password() { return this.addUserForm.get('password'); }
  get role() { return this.addUserForm.get('role'); }
  get isPremium() { return this.addUserForm.get('isPremium'); }
}

import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { VideoService, Video } from '../../../services/video.service';
import { MessageService, MessageResponse } from '../../../services/message.service';

@Component({
  selector: 'app-profile',
  standalone: true,  imports: [
    CommonModule, 
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    FormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  
  user: any = null;
  loading = true;
  likedVideos: Video[] = [];
  favoriteVideos: Video[] = [];
  loadingLikedVideos = true;
  loadingFavoriteVideos = true;
  activeTab = 'profile'; // 'profile', 'liked', 'favorites', 'messages'
  selectedTabIndex = 0; // For Material tabs

  // Messages properties
  userMessages: MessageResponse[] = [];
  loadingMessages = true;
  currentMessagesPage = 0;
  totalMessagesPages = 0;
  unreadMessagesCount = 0;
  expandedMessages = new Set<number>();
  showReplyForm: { [key: number]: boolean } = {};
  replyText: { [key: number]: string } = {};
  playingVideoId: number | null = null;
  viewIncrementedVideos: Set<number> = new Set();constructor(
    public authService: AuthService,
    private videoService: VideoService,
    private messageService: MessageService,
    private router: Router
  ) {}  ngOnInit(): void {
    this.loadUserProfile();
    this.loadLikedVideos();
    this.loadFavoriteVideos();
    this.loadMessages();
  }

  ngOnDestroy(): void {
    // Stop any playing videos when component is destroyed
    this.stopVideo();
  }

  loadUserProfile(): void {
    if (this.authService.isAuthenticated()) {
      this.user = this.authService.getCurrentUser();
      this.loading = false;
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadLikedVideos(): void {
    this.loadingLikedVideos = true;
    this.videoService.getLikedVideos(0, 20).subscribe({
      next: (response) => {
        this.likedVideos = response.content;
        this.loadingLikedVideos = false;
      },
      error: (error) => {
        console.error('Error loading liked videos:', error);
        this.loadingLikedVideos = false;
      }
    });
  }

  loadFavoriteVideos(): void {
    this.loadingFavoriteVideos = true;
    this.videoService.getFavoriteVideos(0, 20).subscribe({
      next: (response) => {
        this.favoriteVideos = response.content;
        this.loadingFavoriteVideos = false;
      },
      error: (error) => {
        console.error('Error loading favorite videos:', error);
        this.loadingFavoriteVideos = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  navigateToVideo(video: Video): void {
    this.router.navigate(['/video', video.id]);
  }

  toggleLike(video: Video): void {
    this.videoService.toggleLike(video.id).subscribe({
      next: (updatedVideo) => {
        // Update the video in the liked videos list
        const index = this.likedVideos.findIndex(v => v.id === video.id);
        if (index !== -1) {
          this.likedVideos[index] = { ...updatedVideo, isLiked: true };
        }
        // If video is no longer liked, remove it from the list
        if (!updatedVideo.isLiked) {
          this.likedVideos = this.likedVideos.filter(v => v.id !== video.id);
        }
      },
      error: (error) => {
        console.error('Error toggling like:', error);
      }
    });
  }

  toggleFavorite(video: Video): void {
    this.videoService.toggleFavorite(video.id).subscribe({
      next: (updatedVideo) => {
        // Update the video in the favorite videos list
        const index = this.favoriteVideos.findIndex(v => v.id === video.id);
        if (index !== -1) {
          this.favoriteVideos[index] = { ...updatedVideo, isFavorited: true };
        }
        // If video is no longer favorited, remove it from the list
        if (!updatedVideo.isFavorited) {
          this.favoriteVideos = this.favoriteVideos.filter(v => v.id !== video.id);
        }
      },
      error: (error) => {
        console.error('Error toggling favorite:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }
  // Video player functionality
  playVideo(video: Video): void {
    if (this.canWatchVideo(video)) {
      this.stopVideo(); // Stop any currently playing video
      this.playingVideoId = video.id;
    }
  }

  stopVideo(): void {
    // Pause all video elements
    if (this.videoPlayers) {
      this.videoPlayers.forEach(videoRef => {
        const videoElement = videoRef.nativeElement;
        if (videoElement && !videoElement.paused) {
          videoElement.pause();
          videoElement.currentTime = 0; // Reset to beginning
        }
      });
    }
    this.playingVideoId = null;
  }
  onTabChange(): void {
    // Stop any playing video when switching tabs
    this.stopVideo();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    // Stop video when Escape key is pressed
    if (this.playingVideoId !== null) {
      this.stopVideo();
      event.preventDefault();
    }
  }

  canWatchVideo(video: Video): boolean {
    if (video.contentType === 'FREE') return true;
    return this.authService.isAuthenticated() && this.authService.getCurrentUser()?.premium;
  }

  getVideoThumbnail(video: Video): string {
    if (video.coverImageUrl) {
      return this.videoService.getCoverImageUrl(video.coverImageUrl);
    }
    return 'assets/images/default-thumbnail.svg';
  }

  getVideoUrl(videoUrl: string): string {
    return this.videoService.getVideoUrl(videoUrl);
  }

  onVideoPlay(video: Video): void {
    if (this.viewIncrementedVideos.has(video.id)) {
      return;
    }
    
    this.viewIncrementedVideos.add(video.id);
    
    this.videoService.incrementView(video.id).subscribe({
      next: (updatedVideo) => {
        // Update the video in the appropriate array with new view count
        const likedIndex = this.likedVideos.findIndex(v => v.id === video.id);
        if (likedIndex !== -1) {
          this.likedVideos[likedIndex].viewCount = updatedVideo.viewCount;
        }
        
        const favoriteIndex = this.favoriteVideos.findIndex(v => v.id === video.id);
        if (favoriteIndex !== -1) {
          this.favoriteVideos[favoriteIndex].viewCount = updatedVideo.viewCount;
        }
      },
      error: (error) => {
        console.error('Error incrementing view:', error);
        this.viewIncrementedVideos.delete(video.id);
      }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/default-thumbnail.svg';
  }
  hasExternalLinks(video: Video): boolean {
    return !!(video.spotifyLink || video.amazonLink || video.appleMusicLink || 
              video.itunesLink || video.youtubeMusicLink || video.instagramLink);
  }

  // New methods for the enhanced profile design
  getDaysSinceJoined(): number {
    if (!this.user?.createdAt) return 0;
    const joinDate = new Date(this.user.createdAt);
    const currentDate = new Date();
    const timeDiff = currentDate.getTime() - joinDate.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  }

  watchVideo(videoId: number): void {
    this.router.navigate(['/video', videoId]);
  }

  unlikeVideo(videoId: number): void {
    this.videoService.toggleLike(videoId).subscribe({
      next: () => {
        this.likedVideos = this.likedVideos.filter(v => v.id !== videoId);
      },
      error: (error) => {
        console.error('Error unliking video:', error);
      }
    });
  }

  removeFavorite(videoId: number): void {
    this.videoService.toggleFavorite(videoId).subscribe({
      next: () => {
        this.favoriteVideos = this.favoriteVideos.filter(v => v.id !== videoId);
      },
      error: (error) => {
        console.error('Error removing favorite:', error);
      }
    });
  }  formatDuration(duration?: number): string {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Messages methods
  loadMessages(page: number = 0): void {
    this.loadingMessages = true;
    this.messageService.getMyMessages(page, 10).subscribe({
      next: (response) => {
        this.userMessages = response.content;
        this.currentMessagesPage = response.number;
        this.totalMessagesPages = response.totalPages;
        this.unreadMessagesCount = response.content.filter(m => 
          m.status === 'PENDING' || m.status === 'READ').length;
        this.loadingMessages = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loadingMessages = false;
      }
    });
  }

  toggleMessage(messageId: number): void {
    if (this.expandedMessages.has(messageId)) {
      this.expandedMessages.delete(messageId);
    } else {
      this.expandedMessages.add(messageId);
    }
  }

  replyToMessage(message: MessageResponse): void {
    this.showReplyForm[message.id] = true;
    this.replyText[message.id] = '';
  }

  sendReply(messageId: number): void {
    const replyText = this.replyText[messageId]?.trim();
    if (!replyText) return;

    // Create a new message for the reply
    const replyData = {
      name: this.user.username,
      email: this.user.email,
      reason: 'reply',
      subject: `Re: ${this.userMessages.find(m => m.id === messageId)?.subject}`,
      message: replyText
    };

    this.messageService.sendMessage(replyData).subscribe({
      next: (response) => {
        this.showReplyForm[messageId] = false;
        this.replyText[messageId] = '';
        this.loadMessages(this.currentMessagesPage); // Reload messages
        console.log('Reply sent successfully');
      },
      error: (error) => {
        console.error('Error sending reply:', error);
      }
    });
  }

  cancelReply(messageId: number): void {
    this.showReplyForm[messageId] = false;
    this.replyText[messageId] = '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

}

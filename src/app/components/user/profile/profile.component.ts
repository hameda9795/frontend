import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';
import { VideoService, Video } from '../../../services/video.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  loading = true;
  likedVideos: Video[] = [];
  favoriteVideos: Video[] = [];
  loadingLikedVideos = true;
  loadingFavoriteVideos = true;
  activeTab = 'profile'; // 'profile', 'liked', 'favorites'
  playingVideoId: number | null = null;
  viewIncrementedVideos: Set<number> = new Set();
  constructor(
    public authService: AuthService,
    private videoService: VideoService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.loadUserProfile();
    this.loadLikedVideos();
    this.loadFavoriteVideos();
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
      this.stopVideo();
      this.playingVideoId = video.id;
    }
  }

  stopVideo(): void {
    this.playingVideoId = null;
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
}

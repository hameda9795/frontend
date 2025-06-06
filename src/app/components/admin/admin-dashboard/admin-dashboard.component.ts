import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { VideoService, Video } from '../../../services/video.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  videos: Video[] = [];
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    private videoService: VideoService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      window.location.href = '/home';
      return;
    }
    this.loadVideos();
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
}

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './services/auth.service';
import { BehaviorSubject, of } from 'rxjs';

describe('AppComponent', () => {
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    // Create a mock AuthService
    mockAuthService = {
      isLoggedIn: () => of(false),
      isAdmin: () => false,
      logout: jasmine.createSpy('logout')
    };

    await TestBed.configureTestingModule({
      imports: [
        AppComponent, 
        HttpClientTestingModule, 
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'Bitzomax' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Bitzomax');
  });

  it('should render Bitzomax title in h1', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Bitzomax');
  });
});

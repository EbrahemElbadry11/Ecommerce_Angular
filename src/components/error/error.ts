// error.component.ts - نسخة مبسطة
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './error.html',
  styleUrls: ['./error.css'],
})
export class Error {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  searchFromInput(): void {
    const input = document.querySelector('.search-input') as HTMLInputElement;
    if (input?.value) {
      this.router.navigate(['/products'], { queryParams: { search: input.value } });
    }
  }

  search(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.value) {
      this.router.navigate(['/products'], { queryParams: { search: input.value } });
    }
  }
}
import { Directive, HostListener, OnInit } from '@angular/core';

@Directive({
  selector: '[appDarkMode]',
  standalone: true
})
export class Darkmode implements OnInit {

  ngOnInit(): void {
    const theme = localStorage.getItem('theme');

    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }

  @HostListener('click')
  toggleDarkMode() {

    const body = document.body;

    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  }
}
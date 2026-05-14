import { Directive, HostListener, OnInit } from '@angular/core';

@Directive({
  selector: '[appDarkMode]',
  standalone: true
})
export class Darkmode implements OnInit {

  ngOnInit(): void {
    const theme = localStorage.getItem('theme');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }

  @HostListener('click')
  toggleDarkMode() {

    const html = document.documentElement;

    html.classList.toggle('dark');

    if (html.classList.contains('dark')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  }
}
import { Directive,HostListener,Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDarkmode]',
  standalone: true
})
export class Darkmode {
 private isDark = false;

  constructor(private renderer: Renderer2) {}

  @HostListener('click')
  toggleDarkMode() {
    this.isDark = !this.isDark;

    if (this.isDark) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
}

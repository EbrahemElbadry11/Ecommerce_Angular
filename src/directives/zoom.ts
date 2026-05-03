import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appZoom]',
})
export class Zoom {

  constructor(private elementref: ElementRef) {
    
  }

  @HostListener('mouseenter') onMouseEnter() {
    const el = this.elementref.nativeElement;
    el.style.transform = 'scale(1.2)';
    el.style.transition = '0.3s';
    el.style.cursor = 'pointer';
  }

  @HostListener('mouseleave') onMouseLeave() {
    const el = this.elementref.nativeElement;
    el.style.transform = 'scale(1)';
  }
}
  


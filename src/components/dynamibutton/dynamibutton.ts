import { Component, Input,Output,EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dynamibutton',
  imports: [],
  templateUrl: './dynamibutton.html',
  styleUrl: './dynamibutton.css',
})
export class Dynamibutton {
@Input() title: string = 'button';
  @Input() color: string = '#ffffff';
  @Input() bgColor: string = '#3b82f6';
  @Input() width: string = 'auto';
  @Input() height: string = '42px';
  @Input() disabled: boolean = false;
}

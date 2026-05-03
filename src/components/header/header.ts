import { Component } from '@angular/core';
import { Darkmode } from '../../directives/darkmode';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-header',
  imports: [Darkmode, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}

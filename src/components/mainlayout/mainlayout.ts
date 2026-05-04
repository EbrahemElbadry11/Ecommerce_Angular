import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { ToastService } from '../../services/toast';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-mainlayout',
  imports: [Header,Footer,RouterOutlet,NgClass],
  templateUrl: './mainlayout.html',
  styleUrl: './mainlayout.css',
})
export class Mainlayout {
  constructor(public toastService: ToastService) {}
}

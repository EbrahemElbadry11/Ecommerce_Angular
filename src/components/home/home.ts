import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  products = [
    {
      id: 1,
      name: 'Modern Laptop Pro',
      price: 1200,
      oldPrice: 1500,
      category: 'Electronics',
      discount: true,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500'
    },
    {
      id: 2,
      name: 'Wireless Headphones',
      price: 80,
      category: 'Accessories',
      discount: false,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500'
    },
    {
      id: 3,
      name: 'Smart Watch Series 7',
      price: 250,
      oldPrice: 300,
      category: 'Electronics',
      discount: true,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500'
    },
    {
      id: 4,
      name: 'Mechanical Keyboard',
      price: 120,
      category: 'Gaming',
      discount: false,
      image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=500'
    }
  ];
}
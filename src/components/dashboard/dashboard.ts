import { Component } from '@angular/core';
import { Productoperation } from '../productoperation/productoperation';
import { Users } from '../users/users';

@Component({
  selector: 'app-dashboard',
  imports: [Productoperation, Users],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  activeTab: string = 'products'; 
}

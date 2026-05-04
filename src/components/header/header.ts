import { Component } from '@angular/core';
import { Darkmode } from '../../directives/darkmode';
import { RouterLink } from "@angular/router";
import { Auth } from '../../services/auth';


@Component({
  selector: 'app-header',
  imports: [Darkmode, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
   Logged:boolean = false;
 constructor(private userAuth:Auth){}
  ngOnInit(): void {
    this.Logged = this.userAuth.isLoggedIn()
  }
 userLogIn(){
  this.userAuth.isLoggedIn()
  this.Logged = this.userAuth.isLoggedIn()

 }
 userLogOut(){
  this.userAuth.logout()
  this.Logged = this.userAuth.isLoggedIn()
 }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '../../services/user';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AsyncPipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-users',
  imports: [UpperCasePipe,AsyncPipe],
  templateUrl: './users.html',
  styleUrl: './users.css',
  changeDetection:ChangeDetectionStrategy.OnPush

})
export class Users implements OnInit, OnDestroy {
  data: any[] = [];
  private subscription!: Subscription;


  constructor(private users: User, private c: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.getAll();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe(); 
  }

  getAll() {
    this.subscription = this.users.getAllUsers().subscribe({ 
      next: (prds) => {
        this.data = prds; 
        this.c.detectChanges();
      },
      error: (err) => {
        console.error('failed to bring users', err);
      }
    });
  }

  addUser(user: any) {
    this.users.addUser(user).subscribe(() => {
      this.getAll();
    });
  }

  deleteUser(id: number) {
    this.users.deleteUser(id).subscribe(() => {
      this.getAll();
    });
  }
}
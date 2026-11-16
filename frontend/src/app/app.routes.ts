import { Routes } from '@angular/router';
import { Cart } from './cart/cart';
import { Home } from './home/home';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { Search } from './search/search';
import { Shell } from './shell/shell';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    children: [
      { path: 'home', component: Home },
      { path: 'search', component: Search },
      { path: 'cart', component: Cart },
      { path: 'profile', component: Profile },
    ],
  },
];

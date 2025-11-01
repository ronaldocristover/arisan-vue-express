import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: () => import('../views/Login.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/',
            component: () => import('../layouts/DashboardLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'Dashboard',
                    component: () => import('../views/Dashboard.vue')
                },
                {
                    path: 'members',
                    name: 'Members',
                    component: () => import('../views/Members.vue')
                },
                {
                    path: 'members/:id',
                    name: 'MemberDetail',
                    component: () => import('../views/MemberDetail.vue')
                },
                {
                    path: 'periods',
                    name: 'Periods',
                    component: () => import('../views/Periods.vue')
                },
                {
                    path: 'periods/:id',
                    name: 'PeriodDetail',
                    component: () => import('../views/PeriodDetail.vue')
                },
                {
                    path: 'payments',
                    name: 'Payments',
                    component: () => import('../views/Payments.vue')
                },
                {
                    path: 'winners',
                    name: 'Winners',
                    component: () => import('../views/Winners.vue')
                },
                {
                    path: 'notes',
                    name: 'Notes',
                    component: () => import('../views/Notes.vue')
                },
                {
                    path: 'transactions',
                    name: 'Transactions',
                    component: () => import('../views/Transactions.vue')
                },
                {
                    path: 'settings',
                    name: 'Settings',
                    component: () => import('../views/Settings.vue')
                }
            ]
        }
    ]
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    authStore.initAuth();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'Login' });
    } else if (to.name === 'Login' && authStore.isAuthenticated) {
        next({ name: 'Dashboard' });
    } else {
        next();
    }
});

export default router;

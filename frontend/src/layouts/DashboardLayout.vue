<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-white text-gray-800 border-r border-gray-200 shadow-sm">
      <div class="flex flex-col h-full">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-800">Arisan App</h1>
          </div>
        </div>
        <nav class="flex-1 p-4 space-y-2">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center px-4 py-3 rounded-lg transition-colors text-base"
            :class="$route.path === item.path ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'"
          >
            <span class="ml-3">{{ item.label }}</span>
          </router-link>
        </nav>
        <div class="p-4 border-t border-gray-200">
          <button
            @click="logout"
            class="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-base"
          >
            <span class="ml-3">Logout</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="ml-64">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="px-6 py-4 flex justify-between items-center">
          <h2 class="text-2xl font-semibold text-gray-800">{{ currentPageTitle }}</h2>
          <div class="flex items-center space-x-4">
            <span class="text-base text-gray-600">{{ authStore.user?.email }}</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const menuItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/members', label: 'Members' },
  { path: '/periods', label: 'Periods' },
  { path: '/payments', label: 'Payments' },
  { path: '/winners', label: 'Winners' },
  { path: '/transactions', label: 'Transactions' },
  { path: '/notes', label: 'Notes' },
  { path: '/settings', label: 'Settings' }
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/members': 'Members',
  '/periods': 'Periods',
  '/payments': 'Payments',
  '/winners': 'Winners',
  '/transactions': 'Transactions',
  '/notes': 'Notes',
  '/settings': 'Settings'
};

const currentPageTitle = computed(() => {
  return pageTitles[route.path] || 'Arisan App';
});

const logout = () => {
  authStore.clearAuth();
  router.push('/login');
};
</script>

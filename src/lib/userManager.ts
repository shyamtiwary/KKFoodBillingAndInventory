import { Capacitor } from '@capacitor/core';
import { ApiUserService, LocalUserService, IUserService } from './services/userService';
import { User } from '@/hooks/useAuth';

const isNative = Capacitor.isNativePlatform();
const apiService = new ApiUserService();
const localService = new LocalUserService();
const service: IUserService = isNative ? localService : apiService;

export const userManager = {
    getAll: async (includeDeleted: boolean = false): Promise<User[]> => {
        return await service.getAll(includeDeleted);
    },

    approve: async (email: string): Promise<boolean> => {
        const success = await service.approve(email);
        if (success && isNative) {
            // Try to sync to API if online
            try {
                await apiService.approve(email);
            } catch (e) {
                console.warn("Failed to sync approval to API:", e);
            }
        }
        return success;
    },

    disapprove: async (email: string): Promise<boolean> => {
        const success = await service.disapprove(email);
        if (success && isNative) {
            try {
                await apiService.disapprove(email);
            } catch (e) {
                console.warn("Failed to sync disapproval to API:", e);
            }
        }
        return success;
    },

    enable: async (email: string): Promise<boolean> => {
        const success = await service.enable(email);
        if (success && isNative) {
            try {
                await apiService.enable(email);
            } catch (e) {
                console.warn("Failed to sync enable to API:", e);
            }
        }
        return success;
    },

    disable: async (email: string): Promise<boolean> => {
        const success = await service.disable(email);
        if (success && isNative) {
            try {
                await apiService.disable(email);
            } catch (e) {
                console.warn("Failed to sync disable to API:", e);
            }
        }
        return success;
    },

    delete: async (email: string): Promise<boolean> => {
        const success = await service.delete(email);
        if (success && isNative) {
            try {
                await apiService.delete(email);
            } catch (e) {
                console.warn("Failed to sync delete to API:", e);
            }
        }
        return success;
    },

    add: async (user: User): Promise<boolean> => {
        const success = await service.add(user);
        if (success && isNative) {
            try {
                await apiService.add(user);
            } catch (e) {
                console.warn("Failed to sync add to API:", e);
            }
        }
        return success;
    },

    syncUsers: async (): Promise<void> => {
        if (!isNative) return;
        try {
            const users = await apiService.getAll();
            if (users && users.length > 0) {
                await localService.sync(users);
            }
        } catch (error) {
            console.error("Failed to sync users from API:", error);
        }
    }
};

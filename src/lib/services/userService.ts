import { User, UserRole } from '@/hooks/useAuth';
import { SERVICE_URLS } from '@/config/apiConfig';
import { databaseService } from '@/lib/db/database';

const API_URL = SERVICE_URLS.AUTH.replace('Auth', 'Users');

export interface IUserService {
    getAll(): Promise<User[]>;
    approve(email: string): Promise<boolean>;
    disapprove(email: string): Promise<boolean>;
    enable(email: string): Promise<boolean>;
    disable(email: string): Promise<boolean>;
    delete(email: string): Promise<boolean>;
    sync(users: User[]): Promise<void>;
}

export class ApiUserService implements IUserService {
    async getAll(): Promise<User[]> {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
        return [];
    }

    async approve(email: string): Promise<boolean> {
        const response = await fetch(`${API_URL}/approve/${email}`, { method: 'POST' });
        return response.ok;
    }

    async disapprove(email: string): Promise<boolean> {
        const response = await fetch(`${API_URL}/disapprove/${email}`, { method: 'POST' });
        return response.ok;
    }

    async enable(email: string): Promise<boolean> {
        const response = await fetch(`${API_URL}/enable/${email}`, { method: 'POST' });
        return response.ok;
    }

    async disable(email: string): Promise<boolean> {
        const response = await fetch(`${API_URL}/disable/${email}`, { method: 'POST' });
        return response.ok;
    }

    async delete(email: string): Promise<boolean> {
        const response = await fetch(`${API_URL}/${email}`, { method: 'DELETE' });
        return response.ok;
    }

    async sync(users: User[]): Promise<void> {
        // API is the source of truth, no sync needed from client to API for all users
    }
}

export class LocalUserService implements IUserService {
    async getAll(): Promise<User[]> {
        const result = await databaseService.query('SELECT * FROM users');
        return result.map(row => ({
            email: row.email,
            name: row.name,
            role: row.role as UserRole,
            isApproved: row.isApproved === 1,
            isActive: row.isActive === 1,
            accessType: row.accessType || 'mobile',
            createdAt: row.createdAt
        }));
    }

    async approve(email: string): Promise<boolean> {
        await databaseService.run('UPDATE users SET isApproved = 1 WHERE email = ?', [email]);
        return true;
    }

    async disapprove(email: string): Promise<boolean> {
        await databaseService.run('UPDATE users SET isApproved = 0 WHERE email = ?', [email]);
        return true;
    }

    async enable(email: string): Promise<boolean> {
        await databaseService.run('UPDATE users SET isActive = 1 WHERE email = ?', [email]);
        return true;
    }

    async disable(email: string): Promise<boolean> {
        await databaseService.run('UPDATE users SET isActive = 0 WHERE email = ?', [email]);
        return true;
    }

    async delete(email: string): Promise<boolean> {
        await databaseService.run('DELETE FROM users WHERE email = ?', [email]);
        return true;
    }

    async sync(users: User[]): Promise<void> {
        for (const user of users) {
            await databaseService.run(
                `INSERT OR REPLACE INTO users (email, name, role, isApproved, isActive, accessType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user.email, user.name, user.role, user.isApproved ? 1 : 0, user.isActive ? 1 : 0, user.accessType || 'web', user.createdAt || new Date().toISOString()]
            );
        }
    }
}

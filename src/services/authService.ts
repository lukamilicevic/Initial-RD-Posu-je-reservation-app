const ADMIN_PASSWORD = 'Posusje2026!';

export const authService = {
  validateAdmin(password: string): boolean {
    return password.trim() === ADMIN_PASSWORD;
  }
};

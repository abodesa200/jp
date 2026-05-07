/**
 * Main Contract - يجمع كل الـ contracts
 */
import { initContract } from '@ts-rest/core';
import { authContract } from './auth.contract';
import { driversContract } from './drivers.contract';
import { profileContract } from './profile.contract';
import { ridesContract } from './rides.contract';

const c = initContract();

/**
 * Main API Contract
 * يحتوي على كل الـ endpoints في المشروع
 */
export const contract = c.router({
    auth: authContract,
    rides: ridesContract,
    drivers: driversContract,
    profile: profileContract,
});

/**
 * Type exports للاستخدام في الـ Frontend
 */
export type Contract = typeof contract;

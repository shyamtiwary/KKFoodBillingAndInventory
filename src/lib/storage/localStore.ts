import localforage from 'localforage';

export const productStore = localforage.createInstance({
    name: 'KKFoodBilling',
    storeName: 'products',
});

export const billStore = localforage.createInstance({
    name: 'KKFoodBilling',
    storeName: 'bills',
});

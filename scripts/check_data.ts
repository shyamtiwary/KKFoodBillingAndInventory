
import { productManager } from '../src/lib/productManager.ts';

async function checkData() {
    try {
        const products = await productManager.getAll();
        console.log(`Total products: ${products.length}`);

        const ids = new Set();
        const duplicates = [];
        const corrupted = [];

        products.forEach(p => {
            if (ids.has(p.id)) {
                duplicates.push(p);
            }
            ids.add(p.id);

            if (!p.name || !p.sku) {
                corrupted.push(p);
            }
        });

        if (duplicates.length > 0) {
            console.log('Found Duplicate IDs:', duplicates);
        } else {
            console.log('No duplicate IDs found.');
        }

        if (corrupted.length > 0) {
            console.log('Found Corrupted Products (missing name/sku):', corrupted);
        } else {
            console.log('No corrupted products found.');
        }

        console.log('All Products:', JSON.stringify(products, null, 2));

    } catch (error) {
        console.error('Error checking data:', error);
    }
}

checkData();
